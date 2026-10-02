import IndustryModel from '../model/industry.model.js';
import WorkflowModel from '../model/workflow.model.js';
import JobModel from '../model/job.model.js';
import StudentModel from '../model/student.model.js';
import UserModel from '../model/user.model.js';

const safeRegex = (str) => new RegExp(`^${str.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

// Helper to auto-sync any industries created in Workflow Step 2 or Step 3 into Industry collection.
// Use the User ObjectId already stored on each placement contact when available.
const syncIndustriesFromWorkflows = async () => {
  try {
    const workflows = await WorkflowModel.find();
    for (const wf of workflows) {
      // From requests -> contactedIndustries
      for (const r of (wf.requests || [])) {
        for (const c of (r.contactedIndustries || [])) {
          const orgName = (c.organizationName || '').trim();
          if (!orgName) continue;
          const existing = await IndustryModel.findOne({ name: safeRegex(orgName) });
          if (!existing) {
            const code = orgName.replace(/[^A-Za-z0-9]/g, '').substring(0, 6).toUpperCase() + Math.floor(100 + Math.random() * 900);
            await IndustryModel.create({
              name: orgName,
              code,
              sector: c.industryType || 'Aged Care',
              contactPersonName: c.contactPerson || 'Contact Person',
              contactEmail: c.email || `${code.toLowerCase()}@portal.com`,
              contactPhone: c.phone || 'N/A',
              address: c.address || 'Australia',
              location: c.address || 'Australia',
              status: c.response === 'Rejected' ? 'Inactive' : 'Active',
              students: 1,
              jobs: 0,
              createdBy: c.addedByUserId || null,
              industryCategory: 'Random',
            });
          }
        }
      }
      // From appointments -> company (no coordinator field on appointments — leave createdBy null)
      for (const a of (wf.appointments || [])) {
        const compName = (a.company || '').trim();
        if (!compName || compName === 'Unknown Company' || compName === 'Pending Assignment') continue;
        const existing = await IndustryModel.findOne({ name: safeRegex(compName) });
        if (!existing) {
          const code = compName.replace(/[^A-Za-z0-9]/g, '').substring(0, 6).toUpperCase() + Math.floor(100 + Math.random() * 900);
          await IndustryModel.create({
            name: compName,
            code,
            sector: 'Healthcare',
            contactPersonName: a.interviewer || 'Placement Coordinator',
            contactEmail: `contact@${code.toLowerCase()}.com`,
            contactPhone: 'N/A',
            address: a.location || 'Australia',
            location: a.location || 'Australia',
            status: a.status === 'Declined' ? 'Inactive' : 'Active',
            students: 1,
            jobs: 0,
            createdBy: null,
            industryCategory: 'Random',
          });
        }
      }
    }
  } catch (syncErr) {
    console.error('Industry auto-sync error:', syncErr);
  }
};

export const getAllIndustriesController = async (req, res) => {
  try {
    const { search, status, sector, industryCategory, postcode, city, state } = req.query;

    // ── 1. Auto-sync industries from workflows
    await syncIndustriesFromWorkflows();

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { contactPersonName: { $regex: search, $options: 'i' } },
        { suburb: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { postCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (industryCategory && industryCategory !== 'All') query.industryCategory = industryCategory;
    const partialMatch = (value) => ({ $regex: String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' });
    if (postcode) query.postCode = partialMatch(postcode);
    if (city) query.suburb = partialMatch(city);
    if (state) query.state = partialMatch(state);

    if (status && status !== 'All') {
      query.status = status;
    }

    if (sector && sector !== 'All') {
      query.sector = sector;
    }

    const industries = await IndustryModel.find(query).sort({ createdAt: -1 });

    // ── 2. Attach real-time student placement and rejection details from workflows
    const allWorkflows = await WorkflowModel.find();
    const enriched = await Promise.all(industries.map(async (ind) => {
      const indDoc = ind.toObject();
      const normName = ind.name.trim().toLowerCase();

      const studentMap = new Map(); // key: studentId or studentName
      let placedCount = 0;
      let rejectedCount = 0;
      let discussionCount = 0;

      for (const wf of allWorkflows) {
        // Check appointments with this company
        for (const appt of (wf.appointments || [])) {
          if ((appt.company || '').trim().toLowerCase() === normName) {
            const key = appt.studentId || appt.student || appt.id;
            const isRejected = appt.status === 'Declined' || appt.cancellationType === 'industry';
            const isPlaced = appt.status === 'Completed' || appt.status === 'Confirmed';
            
            if (isPlaced) placedCount++;
            if (isRejected) rejectedCount++;

            studentMap.set(key, {
              studentName: appt.student || 'Student',
              studentId: appt.studentId || '',
              status: isPlaced ? 'Placed' : isRejected ? 'Rejected by Industry' : appt.status || 'Scheduled',
              date: appt.date || '',
              rejectionReason: isRejected ? (appt.cancellationReason || 'Industry declined') : null,
            });
          }
        }

        // Check requests -> contactedIndustries
        for (const req of (wf.requests || [])) {
          for (const c of (req.contactedIndustries || [])) {
            if ((c.organizationName || '').trim().toLowerCase() === normName) {
              const key = req.studentId || req.student || req.id;
              if (!studentMap.has(key)) {
                const isRejected = c.response === 'Rejected';
                const isAccepted = c.response === 'Accepted';
                if (isAccepted) placedCount++;
                if (isRejected) rejectedCount++;
                if (!isAccepted && !isRejected) discussionCount++;

                studentMap.set(key, {
                  studentName: req.student || 'Student',
                  studentId: req.studentId || '',
                  status: isAccepted ? 'Accepted' : isRejected ? 'Rejected by Industry' : (c.response || 'In Discussion'),
                  date: c.contactedDate ? new Date(c.contactedDate).toISOString().split('T')[0] : '',
                  notes: c.notes || '',
                });
              }
            }
          }
        }
      }

      const studentDetails = Array.from(studentMap.values());
      const jobCount = await JobModel.countDocuments({
        employer: { $regex: ind.name.trim(), $options: 'i' }
      });

      // ── Currently / Previously Placed (same logic as getMyIndustriesController) ──
      // Priority: Internship status (Step 4) overrides Appointment status (Step 3).
      // Internship status 'Active' → currently placed; any other status → previously placed.
      // Appointments used only as fallback when no internship record exists for that student.
      const currentlyPlacedMap  = new Map(); // key → record
      const previouslyPlacedMap = new Map(); // key → record

      for (const wf of allWorkflows) {
        // Step 4 — Internships (highest signal)
        for (const intern of (wf.internships || [])) {
          if ((intern.company || '').trim().toLowerCase() !== normName) continue;
          const key = (intern.studentId || '').trim().toLowerCase();
          if (!key) continue;
          const record = {
            studentName: intern.student || 'Student',
            studentId: intern.studentId || '',
            start: intern.start || '',
            end: intern.end || '',
          };
          if ((intern.status || 'Active') === 'Active') {
            currentlyPlacedMap.set(key, record);
            previouslyPlacedMap.delete(key);
          } else if (!currentlyPlacedMap.has(key)) {
            previouslyPlacedMap.set(key, record);
          }
        }
        // Step 3 — Appointments (fallback only)
        for (const appt of (wf.appointments || [])) {
          if ((appt.company || '').trim().toLowerCase() !== normName) continue;
          const key = (appt.studentId || '').trim().toLowerCase();
          if (!key) continue;
          if (currentlyPlacedMap.has(key) || previouslyPlacedMap.has(key)) continue;
          const record = {
            studentName: appt.student || 'Student',
            studentId: appt.studentId || '',
            date: appt.date || '',
          };
          const isConfirmed = appt.status === 'Confirmed';
          const isCompleted = appt.status === 'Completed';
          const isDeclined  = appt.status === 'Declined' || appt.cancellationType === 'industry';
          if (isConfirmed) {
            currentlyPlacedMap.set(key, record);
          } else if (isCompleted) {
            previouslyPlacedMap.set(key, record);
          } else if (!isDeclined) {
            currentlyPlacedMap.set(key, record);
          }
        }
      }

      indDoc.students = studentDetails.length;
      indDoc.studentDetails = studentDetails;
      indDoc.placedCount = placedCount;
      indDoc.rejectedCount = rejectedCount;
      indDoc.jobs = jobCount || indDoc.jobs || 0;
      indDoc.currentlyPlacedStudents  = Array.from(currentlyPlacedMap.values());
      indDoc.previouslyPlacedStudents = Array.from(previouslyPlacedMap.values());
      indDoc.currentlyPlacedCount     = indDoc.currentlyPlacedStudents.length;
      indDoc.previouslyPlacedCount    = indDoc.previouslyPlacedStudents.length;

      return indDoc;
    }));

    res.status(200).json({
      success: true,
      data: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createIndustryController = async (req, res) => {
  try {
    const {
      industryName,
      industryCode,
      industryType,       // maps to sector
      contactPersonName,
      contactEmail,
      contactPhone,
      contactJobTitle,
      address,
      suburb,
      state,
      postCode,
      country,
      abn,
      website,
      shortDescription,
      industryCategory = 'Random',
      onboardedByName,
      onboardedBy,
      partnershipInfo,
      documents,
    } = req.body;

    // Validate all required fields
    const missing = [];
    if (!industryName) missing.push('Industry Name');
    if (!industryType) missing.push('Industry Type');
    if (!contactPersonName) missing.push('Contact Person Name');
    if (!contactEmail) missing.push('Email Address');
    if (!contactPhone) missing.push('Phone Number');
    if (!address) missing.push('Address');
    if (industryCategory === 'Partner' && !onboardedByName?.trim()) missing.push('Onboarded By');
    if (industryCategory === 'Partner' && !suburb) missing.push('City/Suburb');
    if (industryCategory === 'Partner' && !state) missing.push('State');
    if (industryCategory === 'Partner' && !postCode) missing.push('Postcode');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `The following fields are required: ${missing.join(', ')}`,
        missingFields: missing,
      });
    }

    // Auto-generate a unique industry code if not provided
    const finalCode = industryCode || industryName.replace(/\s+/g, '').substring(0, 6).toUpperCase() + Date.now().toString().slice(-4);

    const location = [suburb, state].filter(Boolean).join(', ') || 'Australia';

    let linkedOnboarder = null;
    if (industryCategory === 'Partner' && onboardedBy) {
      linkedOnboarder = await UserModel.findById(onboardedBy).select('_id name');
      if (!linkedOnboarder) return res.status(400).json({ success: false, message: 'Selected Portal User was not found' });
    }

    const industry = new IndustryModel({
      name: industryName,
      code: finalCode,
      sector: industryType,
      contactPersonName,
      contactEmail,
      contactPhone,
      contactJobTitle,
      address,
      suburb,
      state,
      postCode,
      country: country || 'Australia',
      abn,
      website,
      shortDescription,
      industryCategory: industryCategory === 'Partner' ? 'Partner' : 'Random',
      onboardedByName: industryCategory === 'Partner' ? String(onboardedByName).trim() : '',
      onboardedBy: linkedOnboarder?._id || null,
      partnershipInfo: industryCategory === 'Partner' ? (partnershipInfo || '') : '',
      documents: industryCategory === 'Partner' && Array.isArray(documents) ? documents : [],
      location,
      status: 'Active',
      students: 0,
      jobs: 0,
      createdBy: industryCategory === 'Partner' ? (linkedOnboarder?._id || req.user?._id || null) : (req.user?._id || null),
    });

    await industry.save();

    res.status(201).json({
      success: true,
      message: 'Industry created successfully',
      data: industry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateIndustryController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const oldIndustry = await IndustryModel.findById(id);
    if (!oldIndustry) {
      return res.status(404).json({ success: false, message: 'Industry not found' });
    }
    const oldName = (oldIndustry.name || '').trim();

    if (Object.prototype.hasOwnProperty.call(updateData, 'onboardedBy')) {
      if (updateData.onboardedBy) {
        const linkedUser = await UserModel.findById(updateData.onboardedBy).select('_id');
        if (!linkedUser) return res.status(400).json({ success: false, message: 'Selected Portal User was not found' });
        updateData.onboardedBy = linkedUser._id;
      } else {
        updateData.onboardedBy = null;
      }
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'onboardedByName')) {
      updateData.onboardedByName = String(updateData.onboardedByName || '').trim();
    }

    // Remap frontend field names to model field names if needed
    if (updateData.industryName) { updateData.name = updateData.industryName; delete updateData.industryName; }
    if (updateData.industryType) { updateData.sector = updateData.industryType; delete updateData.industryType; }
    if (updateData.industryCode) { updateData.code = updateData.industryCode; delete updateData.industryCode; }

    // Rebuild location string if address parts changed
    if (updateData.suburb || updateData.state || updateData.address) {
      const suburb = updateData.suburb ?? oldIndustry.suburb;
      const state = updateData.state ?? oldIndustry.state;
      const address = updateData.address ?? oldIndustry.address;
      updateData.location = [address, suburb, state].filter(Boolean).join(', ') || oldIndustry.location || 'Australia';
    }

    const industry = await IndustryModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    const newName = (industry.name || '').trim();

    // If name changed, cascade update across workflows and jobs
    if (newName && oldName && newName.toLowerCase() !== oldName.toLowerCase()) {
      const oldRegex = safeRegex(oldName);
      const allWorkflows = await WorkflowModel.find();
      for (const wf of allWorkflows) {
        let modified = false;
        // In requests -> contactedIndustries
        for (const req of (wf.requests || [])) {
          if ((req.company || '').trim().toLowerCase() === oldName.toLowerCase()) {
            req.company = newName;
            modified = true;
          }
          for (const c of (req.contactedIndustries || [])) {
            if ((c.organizationName || '').trim().toLowerCase() === oldName.toLowerCase()) {
              c.organizationName = newName;
              if (industry.sector) c.industryType = industry.sector;
              modified = true;
            }
          }
        }
        // In appointments
        for (const a of (wf.appointments || [])) {
          if ((a.company || '').trim().toLowerCase() === oldName.toLowerCase()) {
            a.company = newName;
            modified = true;
          }
        }
        // In internships
        for (const i of (wf.internships || [])) {
          if ((i.company || '').trim().toLowerCase() === oldName.toLowerCase()) {
            i.company = newName;
            modified = true;
          }
        }
        if (modified) {
          await wf.save();
        }
      }

      await JobModel.updateMany({ employer: oldRegex }, { $set: { employer: newName } });
    }

    res.status(200).json({ success: true, message: 'Industry updated successfully', data: industry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getIndustryStatsController = async (req, res) => {
  try {
    await syncIndustriesFromWorkflows();

    const [totalIndustries, activeIndustries, inactiveIndustries, totalJobs, allWorkflows] = await Promise.all([
      IndustryModel.countDocuments(),
      IndustryModel.countDocuments({ status: 'Active' }),
      IndustryModel.countDocuments({ status: { $ne: 'Active' } }),
      JobModel.countDocuments(),
      WorkflowModel.find()
    ]);

    // Count all distinct students involved in appointments or placements
    const placedStudentIds = new Set();
    for (const wf of allWorkflows) {
      for (const appt of (wf.appointments || [])) {
        if (appt.studentId || appt.student) {
          placedStudentIds.add(appt.studentId || appt.student);
        }
      }
      for (const req of (wf.requests || [])) {
        if (req.studentId || req.student) {
          placedStudentIds.add(req.studentId || req.student);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalIndustries,
        activeIndustries,
        inactiveIndustries,
        totalStudents: placedStudentIds.size,
        totalJobs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /industries/my ──────────────────────────────────────────────────────
// Returns industries visible to the logged-in coordinator (or all for admin).
//
// An industry is visible when ANY of the following is true (ObjectId-based only,
// never name-based ownership):
//
//   (A) Industry.createdBy === req.user._id
//       Covers direct creation via the Industries section, and auto-sync from
//       workflow requests where requests[].coordinator name resolved to this user.
//
//   (B) The industry has NO owner (createdBy is null) AND its name appears in a
//       workflow internship / appointment / request whose studentId maps to a
//       Student whose assignedCoordinator === req.user._id.
//       If the industry is owned (createdBy) by a DIFFERENT user, it is NOT shown
//       just because one of this coordinator's students is linked to it.
//
// The student placement lists (currentlyPlacedStudents / previouslyPlacedStudents)
// attached to each result are for DISPLAY ONLY — they are scoped to this
// coordinator's assigned students and must NOT influence which industries appear.
export const getMyIndustriesController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Random industries are shared placement options, so make sure workflow
    // contacts have been synchronized before building any user's list.
    await syncIndustriesFromWorkflows();

    const userId = req.user._id;
    const isAdmin = req.user.role === 'Administrator';

    // Admin gets every student for placement lists; coordinators get only their assigned students.
    const myStudents = await StudentModel.find(
      isAdmin
        ? {}
        : {
            $or: [
              { assignedCoordinator: userId },
              ...(req.user.name ? [{ assignedCoordinatorName: safeRegex(req.user.name) }] : []),
            ],
          },
      { _id: 1, studentId: 1, firstName: 1, lastName: 1 }
    ).lean();

    // Industries credited directly to this coordinator are visible even without student links.
    const createdByIds = isAdmin
      ? new Set()
      : new Set(
          (await IndustryModel.find({ $or: [{ createdBy: userId }, { onboardedBy: userId }] }, { _id: 1 }).lean())
            .map(i => i._id.toString())
        );

    // Build a set of the students' business-level studentId strings (used in workflow sub-docs)
    const myStudentIdStrings = new Set(
      myStudents
        .map(s => (s.studentId || '').toString().trim().toLowerCase())
        .filter(Boolean)
    );

    // Walk workflows to collect industry names associated with this coordinator's students.
    // Matching is done by studentId string (the business ID stored in workflow sub-docs)
    // against the set derived from ObjectId-based assignedCoordinator lookup above.
    const studentLinkedIndustryNames = new Set(); // lowercase industry names

    if (myStudentIdStrings.size > 0) {
      const allWorkflows = await WorkflowModel.find(
        {},
        { 'internships.studentId': 1, 'internships.company': 1,
          'appointments.studentId': 1, 'appointments.company': 1,
          'requests.studentId': 1, 'requests.contactedIndustries': 1 }
      ).lean();

      for (const wf of allWorkflows) {
        for (const intern of (wf.internships || [])) {
          if (!myStudentIdStrings.has((intern.studentId || '').trim().toLowerCase())) continue;
          const nm = (intern.company || '').trim().toLowerCase();
          if (nm) studentLinkedIndustryNames.add(nm);
        }
        for (const appt of (wf.appointments || [])) {
          if (!myStudentIdStrings.has((appt.studentId || '').trim().toLowerCase())) continue;
          const nm = (appt.company || '').trim().toLowerCase();
          if (nm && nm !== 'unknown company' && nm !== 'pending assignment')
            studentLinkedIndustryNames.add(nm);
        }
        for (const req of (wf.requests || [])) {
          if (!myStudentIdStrings.has((req.studentId || '').trim().toLowerCase())) continue;
          for (const c of (req.contactedIndustries || [])) {
            const nm = (c.organizationName || '').trim().toLowerCase();
            if (nm) studentLinkedIndustryNames.add(nm);
          }
        }
      }
    }

    // Fetch ALL industries once, then filter to those matching condition A or B
    const allIndustries = await IndustryModel.find().lean();
    const myIndustries = allIndustries.filter(ind => {
      if (isAdmin) return true;
      // Random Industries are reusable across students and coordinators; they
      // must be visible to every staff member regardless of who added them.
      if (ind.industryCategory === 'Random') return true;
      // Condition A: ObjectId match on createdBy (created by / credited to this coordinator)
      if (createdByIds.has(ind._id.toString())) return true;
      // Condition B: one of this coordinator's specifically assigned students is linked
      // to this industry via workflow sub-docs.
      // No restriction on createdBy — a student-linked industry is always visible
      // regardless of who created it.
      if (studentLinkedIndustryNames.has((ind.name || '').trim().toLowerCase())) return true;
      return false;
    });

    if (!myIndustries.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    // ── Build placement lists (display only, scoped to coordinator's students) ─
    // These lists show which of this coordinator's students are placed — they do
    // NOT affect which industries appear in the list above.
    const myIndustryNormNames = new Set(myIndustries.map(i => (i.name || '').trim().toLowerCase()));

    // placementMap: normName → { currentlyPlaced: Map<key, record>, previouslyPlaced: Map }
    const placementMap = new Map();
    for (const nm of myIndustryNormNames) {
      placementMap.set(nm, { currentlyPlaced: new Map(), previouslyPlaced: new Map() });
    }

    const allWorkflowsFull = await WorkflowModel.find().lean();

    for (const wf of allWorkflowsFull) {
      // Internships — highest placement signal
      for (const intern of (wf.internships || [])) {
        if (!myStudentIdStrings.has((intern.studentId || '').trim().toLowerCase())) continue;
        const nm = (intern.company || '').trim().toLowerCase();
        if (!placementMap.has(nm)) continue;
        const entry = placementMap.get(nm);
        const key = (intern.studentId || '').trim().toLowerCase();
        const record = {
          studentName: intern.student || 'Student',
          studentId: intern.studentId || '',
          start: intern.start || '',
          end: intern.end || '',
        };
        if ((intern.status || 'Active') === 'Active') {
          entry.currentlyPlaced.set(key, record);
          entry.previouslyPlaced.delete(key);
        } else if (!entry.currentlyPlaced.has(key)) {
          entry.previouslyPlaced.set(key, record);
        }
      }
      // Appointments — fallback when no internship record yet
      for (const appt of (wf.appointments || [])) {
        if (!myStudentIdStrings.has((appt.studentId || '').trim().toLowerCase())) continue;
        const nm = (appt.company || '').trim().toLowerCase();
        if (!placementMap.has(nm)) continue;
        const entry = placementMap.get(nm);
        const key = (appt.studentId || '').trim().toLowerCase();
        if (entry.currentlyPlaced.has(key) || entry.previouslyPlaced.has(key)) continue;
        const record = {
          studentName: appt.student || 'Student',
          studentId: appt.studentId || '',
          date: appt.date || '',
        };
        const isConfirmed = appt.status === 'Confirmed';
        const isCompleted = appt.status === 'Completed';
        const isDeclined  = appt.status === 'Declined' || appt.cancellationType === 'industry';
        if (isConfirmed) {
          entry.currentlyPlaced.set(key, record);
        } else if (isCompleted) {
          entry.previouslyPlaced.set(key, record);
        } else if (!isDeclined) {
          entry.currentlyPlaced.set(key, record);
        }
      }
    }

    // ── Build final enriched response ──────────────────────────────────────
    const enriched = myIndustries.map(ind => {
      const nm = (ind.name || '').trim().toLowerCase();
      const entry = placementMap.get(nm) || { currentlyPlaced: new Map(), previouslyPlaced: new Map() };
      const currentlyPlacedStudents  = Array.from(entry.currentlyPlaced.values());
      const previouslyPlacedStudents = Array.from(entry.previouslyPlaced.values());
      return {
        ...ind,
        currentlyPlacedStudents,
        previouslyPlacedStudents,
        currentlyPlacedCount:  currentlyPlacedStudents.length,
        previouslyPlacedCount: previouslyPlacedStudents.length,
      };
    });

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('getMyIndustriesController error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteIndustryController = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find industry first
    const industry = await IndustryModel.findById(id);
    if (!industry) {
      return res.status(404).json({ success: false, message: 'Industry not found' });
    }

    const industryName = (industry.name || '').trim();
    const industryNameLower = industryName.toLowerCase();

    // 2. Delete industry from database
    await IndustryModel.findByIdAndDelete(id);

    // 3. Cascade Delete across Workflows (Requests, Appointments, Internships)
    const allWorkflows = await WorkflowModel.find();
    for (const wf of allWorkflows) {
      let wfModified = false;

      // a) Clean up requests
      if (Array.isArray(wf.requests)) {
        for (const req of wf.requests) {
          if ((req.company || '').trim().toLowerCase() === industryNameLower) {
            req.company = 'Unassigned';
            wfModified = true;
          }
          if (Array.isArray(req.contactedIndustries)) {
            const initialCount = req.contactedIndustries.length;
            req.contactedIndustries = req.contactedIndustries.filter(c => {
              const cName = (c.organizationName || '').trim().toLowerCase();
              return cName !== industryNameLower;
            });
            if (req.contactedIndustries.length !== initialCount) {
              wfModified = true;
            }
          }
        }
      }

      // b) Clean up appointments: remove appointments with this industry
      if (Array.isArray(wf.appointments)) {
        const initialCount = wf.appointments.length;
        wf.appointments = wf.appointments.filter(a => {
          const comp = (a.company || '').trim().toLowerCase();
          return comp !== industryNameLower;
        });
        if (wf.appointments.length !== initialCount) {
          wfModified = true;
        }
      }

      // c) Clean up internships: remove internships with this industry
      if (Array.isArray(wf.internships)) {
        const initialCount = wf.internships.length;
        wf.internships = wf.internships.filter(i => {
          const comp = (i.company || '').trim().toLowerCase();
          return comp !== industryNameLower;
        });
        if (wf.internships.length !== initialCount) {
          wfModified = true;
        }
      }

      if (wfModified) {
        await wf.save();
      }
    }

    // 4. Delete associated jobs
    try {
      await JobModel.deleteMany({
        employer: { $regex: safeRegex(industryName) }
      });
    } catch (jErr) {
      console.error('Failed to delete jobs for industry:', jErr);
    }

    res.status(200).json({
      success: true,
      message: `Industry "${industryName}" and all linked student placements/appointments removed successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
