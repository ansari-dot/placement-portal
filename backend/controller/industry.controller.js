import IndustryModel from '../model/industry.model.js';
import WorkflowModel from '../model/workflow.model.js';
import JobModel from '../model/job.model.js';

const safeRegex = (str) => new RegExp(`^${str.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

// Helper to auto-sync any industries created in Workflow Step 2 or Step 3 into Industry collection
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
            });
          }
        }
      }
      // From appointments -> company
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
    const { search, status, sector } = req.query;

    // ── 1. Auto-sync industries from workflows
    await syncIndustriesFromWorkflows();

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { contactPersonName: { $regex: search, $options: 'i' } }
      ];
    }

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

      indDoc.students = studentDetails.length;
      indDoc.studentDetails = studentDetails;
      indDoc.placedCount = placedCount;
      indDoc.rejectedCount = rejectedCount;
      indDoc.jobs = jobCount || indDoc.jobs || 0;

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
    } = req.body;

    // Validate all required fields
    const missing = [];
    if (!industryName) missing.push('Industry Name');
    if (!industryType) missing.push('Industry Type');
    if (!contactPersonName) missing.push('Contact Person Name');
    if (!contactEmail) missing.push('Email Address');
    if (!contactPhone) missing.push('Phone Number');
    if (!address) missing.push('Address');

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
      location,
      status: 'Active',
      students: 0,
      jobs: 0,
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

    // Remap frontend field names to model field names if needed
    if (updateData.industryName) { updateData.name = updateData.industryName; delete updateData.industryName; }
    if (updateData.industryType) { updateData.sector = updateData.industryType; delete updateData.industryType; }
    if (updateData.industryCode) { updateData.code = updateData.industryCode; delete updateData.industryCode; }

    // Rebuild location string if address parts changed
    if (updateData.suburb || updateData.state) {
      const industryDoc = await IndustryModel.findById(id);
      if (industryDoc) {
        const suburb = updateData.suburb ?? industryDoc.suburb;
        const state = updateData.state ?? industryDoc.state;
        updateData.location = [suburb, state].filter(Boolean).join(', ');
      }
    }

    const industry = await IndustryModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!industry) {
      return res.status(404).json({ success: false, message: 'Industry not found' });
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

export const deleteIndustryController = async (req, res) => {
  try {
    const { id } = req.params;
    await IndustryModel.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Industry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
