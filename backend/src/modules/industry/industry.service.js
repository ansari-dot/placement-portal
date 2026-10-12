import IndustryModel from './industry.model.js';
import WorkflowModel from '../workflow/workflow.model.js';
import JobModel from '../job/job.model.js';
import StudentModel from '../student/student.model.js';
import UserModel from '../user/user.model.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../core/errors/AppError.js';
import { normalizeAndValidateState } from './industry.dto.js';

const safeRegex = (str) => new RegExp(`^${str.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

export class IndustryService {
  static async syncIndustriesFromWorkflows() {
    try {
      const workflows = await WorkflowModel.find();
      for (const wf of workflows) {
        for (const r of wf.requests || []) {
          for (const c of r.contactedIndustries || []) {
            const orgName = (c.organizationName || '').trim();
            if (!orgName) continue;
            const existing = await IndustryModel.findOne({ name: safeRegex(orgName) });
            if (!existing) {
              const code =
                orgName.replace(/[^A-Za-z0-9]/g, '').substring(0, 6).toUpperCase() +
                Math.floor(100 + Math.random() * 900);
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
        for (const a of wf.appointments || []) {
          const compName = (a.company || '').trim();
          if (!compName || compName === 'Unknown Company' || compName === 'Pending Assignment') continue;
          const existing = await IndustryModel.findOne({ name: safeRegex(compName) });
          if (!existing) {
            const code =
              compName.replace(/[^A-Za-z0-9]/g, '').substring(0, 6).toUpperCase() +
              Math.floor(100 + Math.random() * 900);
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
  }

  static async getAllIndustries(queryFilters, user) {
    const role = user?.role;
    if (user && (role === 'RTO Manager' || role === 'Student')) {
      throw new ForbiddenError(
        'Access denied. Users with RTO or Student role are not authorized to view Industry facility details.'
      );
    }

    const { search, status, sector, industryCategory, postcode, city, state, page, limit } = queryFilters;

    await this.syncIndustriesFromWorkflows();

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
    if (state && state !== 'All') query.state = partialMatch(state);

    if (status && status !== 'All') query.status = status;
    if (sector && sector !== 'All') query.sector = sector;

    let industriesQuery = IndustryModel.find(query).sort({ createdAt: -1 });
    let totalCount = null;
    let pageNum = null;
    let limitNum = null;

    if (page || limit) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.max(1, parseInt(limit, 10) || 50);
      totalCount = await IndustryModel.countDocuments(query);
      industriesQuery = industriesQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const industries = await industriesQuery;

    const allWorkflows = await WorkflowModel.find();
    const enriched = await Promise.all(
      industries.map(async (ind) => {
        const indDoc = ind.toObject();
        const normName = ind.name.trim().toLowerCase();

        const studentMap = new Map();
        let placedCount = 0;
        let rejectedCount = 0;
        let discussionCount = 0;

        for (const wf of allWorkflows) {
          for (const appt of wf.appointments || []) {
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
                rejectionReason: isRejected ? appt.cancellationReason || 'Industry declined' : null,
              });
            }
          }

          for (const req of wf.requests || []) {
            for (const c of req.contactedIndustries || []) {
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
                    status: isAccepted ? 'Accepted' : isRejected ? 'Rejected by Industry' : c.response || 'In Discussion',
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
          employer: { $regex: ind.name.trim(), $options: 'i' },
        });

        const currentlyPlacedMap = new Map();
        const previouslyPlacedMap = new Map();

        for (const wf of allWorkflows) {
          for (const intern of wf.internships || []) {
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
          for (const appt of wf.appointments || []) {
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
            const isDeclined = appt.status === 'Declined' || appt.cancellationType === 'industry';
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
        indDoc.currentlyPlacedStudents = Array.from(currentlyPlacedMap.values());
        indDoc.previouslyPlacedStudents = Array.from(previouslyPlacedMap.values());
        indDoc.currentlyPlacedCount = indDoc.currentlyPlacedStudents.length;
        indDoc.previouslyPlacedCount = indDoc.previouslyPlacedStudents.length;

        return indDoc;
      })
    );

    return {
      industries: enriched,
      pagination:
        totalCount !== null
          ? {
            total: totalCount,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalCount / limitNum),
          }
          : null,
    };
  }

  static async createIndustry(body, actingUser) {
    const {
      industryName,
      industryCode,
      industryType,
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
    } = body;

    const missing = [];
    if (!industryName) missing.push('Industry Name');
    if (!industryType) missing.push('Industry Type');
    if (!contactPersonName) missing.push('Contact Person Name');
    if (!contactEmail) missing.push('Email Address');
    if (!contactPhone) missing.push('Phone Number');
    if (!address) missing.push('Address');
    if (industryCategory === 'Partner' && !onboardedByName?.trim() && !onboardedBy) missing.push('Onboarded By');
    if (industryCategory === 'Partner' && !suburb) missing.push('City/Suburb');
    if (industryCategory === 'Partner' && !state) missing.push('State');
    if (industryCategory === 'Partner' && !postCode) missing.push('Postcode');

    if (missing.length > 0) {
      const err = new BadRequestError(`The following fields are required: ${missing.join(', ')}`);
      err.missingFields = missing;
      throw err;
    }

    let finalState = state || '';
    if (finalState) {
      const { valid, code } = normalizeAndValidateState(finalState);
      if (!valid) {
        throw new BadRequestError('State must be a valid Australian state or territory (ACT, NSW, NT, QLD, SA, TAS, VIC, WA)');
      }
      finalState = code;
    }

    const finalCode =
      industryCode ||
      industryName.replace(/\s+/g, '').substring(0, 6).toUpperCase() + Date.now().toString().slice(-4);

    const location = [suburb, finalState].filter(Boolean).join(', ') || 'Australia';

    let linkedOnboarder = null;
    if (onboardedBy) {
      linkedOnboarder = await UserModel.findById(onboardedBy).select('_id name role status');
      if (!linkedOnboarder) throw new BadRequestError('Selected Portal User was not found');
      if (!['Administrator', 'Coordinator', 'Staff'].includes(linkedOnboarder.role) || linkedOnboarder.status !== 'Active') {
        throw new BadRequestError('Selected onboardedBy user must be an active Administrator, Coordinator, or Staff member');
      }
    }

    const resolvedOnboardedByName = String(onboardedByName || linkedOnboarder?.name || '').trim();
    if (industryCategory === 'Partner' && !resolvedOnboardedByName) {
      throw new BadRequestError('Onboarded By is required for Partner Industry');
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
      state: finalState,
      postCode,
      country: country || 'Australia',
      abn,
      website,
      shortDescription,
      industryCategory: industryCategory === 'Partner' ? 'Partner' : 'Random',
      onboardedByName: industryCategory === 'Partner' ? resolvedOnboardedByName : '',
      onboardedBy: linkedOnboarder?._id || null,
      partnershipInfo: industryCategory === 'Partner' ? partnershipInfo || '' : '',
      documents: industryCategory === 'Partner' && Array.isArray(documents) ? documents : [],
      location,
      status: 'Active',
      students: 0,
      jobs: 0,
      createdBy: industryCategory === 'Partner' ? linkedOnboarder?._id || actingUser?._id || null : actingUser?._id || null,
    });

    await industry.save();
    return industry;
  }

  static async updateIndustry(id, updateData) {
    const oldIndustry = await IndustryModel.findById(id);
    if (!oldIndustry) {
      throw new NotFoundError('Industry not found');
    }
    const oldName = (oldIndustry.name || '').trim();

    if (Object.prototype.hasOwnProperty.call(updateData, 'state') && updateData.state) {
      const { valid, code } = normalizeAndValidateState(updateData.state);
      if (!valid) {
        throw new BadRequestError('State must be a valid Australian state or territory (ACT, NSW, NT, QLD, SA, TAS, VIC, WA)');
      }
      updateData.state = code;
    }

    if (Object.prototype.hasOwnProperty.call(updateData, 'onboardedBy')) {
      if (updateData.onboardedBy) {
        const linkedUser = await UserModel.findById(updateData.onboardedBy).select('_id name role status');
        if (!linkedUser) throw new BadRequestError('Selected Portal User was not found');
        if (!['Administrator', 'Coordinator', 'Staff'].includes(linkedUser.role) || linkedUser.status !== 'Active') {
          throw new BadRequestError('Selected onboardedBy user must be an active Administrator, Coordinator, or Staff member');
        }
        updateData.onboardedBy = linkedUser._id;
      } else {
        updateData.onboardedBy = null;
      }
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'onboardedByName')) {
      updateData.onboardedByName = String(updateData.onboardedByName || '').trim();
    }

    if (updateData.industryName) {
      updateData.name = updateData.industryName;
      delete updateData.industryName;
    }
    if (updateData.industryType) {
      updateData.sector = updateData.industryType;
      delete updateData.industryType;
    }
    if (updateData.industryCode) {
      updateData.code = updateData.industryCode;
      delete updateData.industryCode;
    }

    if (updateData.suburb || updateData.state || updateData.address) {
      const suburb = updateData.suburb ?? oldIndustry.suburb;
      const state = updateData.state ?? oldIndustry.state;
      const address = updateData.address ?? oldIndustry.address;
      updateData.location = [address, suburb, state].filter(Boolean).join(', ') || oldIndustry.location || 'Australia';
    }

    const industry = await IndustryModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    const newName = (industry.name || '').trim();

    if (newName && oldName && newName.toLowerCase() !== oldName.toLowerCase()) {
      const oldRegex = safeRegex(oldName);
      const allWorkflows = await WorkflowModel.find();
      for (const wf of allWorkflows) {
        let modified = false;
        for (const req of wf.requests || []) {
          if ((req.company || '').trim().toLowerCase() === oldName.toLowerCase()) {
            req.company = newName;
            modified = true;
          }
          for (const c of req.contactedIndustries || []) {
            if ((c.organizationName || '').trim().toLowerCase() === oldName.toLowerCase()) {
              c.organizationName = newName;
              if (industry.sector) c.industryType = industry.sector;
              modified = true;
            }
          }
        }
        for (const a of wf.appointments || []) {
          if ((a.company || '').trim().toLowerCase() === oldName.toLowerCase()) {
            a.company = newName;
            modified = true;
          }
        }
        for (const i of wf.internships || []) {
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

    return industry;
  }

  static async getIndustryStats() {
    await this.syncIndustriesFromWorkflows();

    const [totalIndustries, activeIndustries, inactiveIndustries, totalJobs, allWorkflows] = await Promise.all([
      IndustryModel.countDocuments(),
      IndustryModel.countDocuments({ status: 'Active' }),
      IndustryModel.countDocuments({ status: { $ne: 'Active' } }),
      JobModel.countDocuments(),
      WorkflowModel.find(),
    ]);

    const placedStudentIds = new Set();
    for (const wf of allWorkflows) {
      for (const appt of wf.appointments || []) {
        if (appt.studentId || appt.student) {
          placedStudentIds.add(appt.studentId || appt.student);
        }
      }
      for (const req of wf.requests || []) {
        if (req.studentId || req.student) {
          placedStudentIds.add(req.studentId || req.student);
        }
      }
    }

    return {
      totalIndustries,
      activeIndustries,
      inactiveIndustries,
      totalStudents: placedStudentIds.size,
      totalJobs,
    };
  }

  static async getMyIndustries(user) {
    if (!user) return [];

    await this.syncIndustriesFromWorkflows();

    const userId = user._id;
    const isAdmin = user.role === 'Administrator';

    const myStudents = await StudentModel.find(
      isAdmin
        ? {}
        : {
          $or: [
            { assignedCoordinator: userId },
            ...(user.name ? [{ assignedCoordinatorName: safeRegex(user.name) }] : []),
          ],
        },
      { _id: 1, studentId: 1, firstName: 1, lastName: 1 }
    ).lean();

    const createdByIds = isAdmin
      ? new Set()
      : new Set(
        (await IndustryModel.find({ $or: [{ createdBy: userId }, { onboardedBy: userId }] }, { _id: 1 }).lean()).map(
          (i) => i._id.toString()
        )
      );

    const myStudentIdStrings = new Set(
      myStudents.map((s) => (s.studentId || '').toString().trim().toLowerCase()).filter(Boolean)
    );

    const studentLinkedIndustryNames = new Set();

    if (myStudentIdStrings.size > 0) {
      const allWorkflows = await WorkflowModel.find(
        {},
        {
          'internships.studentId': 1,
          'internships.company': 1,
          'appointments.studentId': 1,
          'appointments.company': 1,
          'requests.studentId': 1,
          'requests.contactedIndustries': 1,
        }
      ).lean();

      for (const wf of allWorkflows) {
        for (const intern of wf.internships || []) {
          if (!myStudentIdStrings.has((intern.studentId || '').trim().toLowerCase())) continue;
          const nm = (intern.company || '').trim().toLowerCase();
          if (nm) studentLinkedIndustryNames.add(nm);
        }
        for (const appt of wf.appointments || []) {
          if (!myStudentIdStrings.has((appt.studentId || '').trim().toLowerCase())) continue;
          const nm = (appt.company || '').trim().toLowerCase();
          if (nm && nm !== 'unknown company' && nm !== 'pending assignment') studentLinkedIndustryNames.add(nm);
        }
        for (const req of wf.requests || []) {
          if (!myStudentIdStrings.has((req.studentId || '').trim().toLowerCase())) continue;
          for (const c of req.contactedIndustries || []) {
            const nm = (c.organizationName || '').trim().toLowerCase();
            if (nm) studentLinkedIndustryNames.add(nm);
          }
        }
      }
    }

    const allIndustries = await IndustryModel.find().lean();
    const myIndustries = allIndustries.filter((ind) => {
      if (isAdmin) return true;
      if (ind.industryCategory === 'Random') return true;
      if (createdByIds.has(ind._id.toString())) return true;
      if (studentLinkedIndustryNames.has((ind.name || '').trim().toLowerCase())) return true;
      return false;
    });

    if (!myIndustries.length) return [];

    const myIndustryNormNames = new Set(myIndustries.map((i) => (i.name || '').trim().toLowerCase()));
    const placementMap = new Map();
    for (const nm of myIndustryNormNames) {
      placementMap.set(nm, { currentlyPlaced: new Map(), previouslyPlaced: new Map() });
    }

    const allWorkflowsFull = await WorkflowModel.find().lean();

    for (const wf of allWorkflowsFull) {
      for (const intern of wf.internships || []) {
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
      for (const appt of wf.appointments || []) {
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
        const isDeclined = appt.status === 'Declined' || appt.cancellationType === 'industry';
        if (isConfirmed) {
          entry.currentlyPlaced.set(key, record);
        } else if (isCompleted) {
          entry.previouslyPlaced.set(key, record);
        } else if (!isDeclined) {
          entry.currentlyPlaced.set(key, record);
        }
      }
    }

    return myIndustries.map((ind) => {
      const nm = (ind.name || '').trim().toLowerCase();
      const entry = placementMap.get(nm) || { currentlyPlaced: new Map(), previouslyPlaced: new Map() };
      const currentlyPlacedStudents = Array.from(entry.currentlyPlaced.values());
      const previouslyPlacedStudents = Array.from(entry.previouslyPlaced.values());
      return {
        ...ind,
        currentlyPlacedStudents,
        previouslyPlacedStudents,
        currentlyPlacedCount: currentlyPlacedStudents.length,
        previouslyPlacedCount: previouslyPlacedStudents.length,
      };
    });
  }

  static async deleteIndustry(id) {
    const industry = await IndustryModel.findById(id);
    if (!industry) {
      throw new NotFoundError('Industry not found');
    }

    const industryName = (industry.name || '').trim();
    const industryNameLower = industryName.toLowerCase();

    await IndustryModel.findByIdAndDelete(id);

    const allWorkflows = await WorkflowModel.find();
    for (const wf of allWorkflows) {
      let wfModified = false;
      if (Array.isArray(wf.requests)) {
        for (const req of wf.requests) {
          if (Array.isArray(req.contactedIndustries)) {
            const origLength = req.contactedIndustries.length;
            req.contactedIndustries = req.contactedIndustries.filter(
              (c) => (c.organizationName || '').trim().toLowerCase() !== industryNameLower
            );
            if (req.contactedIndustries.length !== origLength) wfModified = true;
          }
        }
      }
      if (Array.isArray(wf.appointments)) {
        const origLength = wf.appointments.length;
        wf.appointments = wf.appointments.filter(
          (a) => (a.company || '').trim().toLowerCase() !== industryNameLower
        );
        if (wf.appointments.length !== origLength) wfModified = true;
      }
      if (Array.isArray(wf.internships)) {
        const origLength = wf.internships.length;
        wf.internships = wf.internships.filter(
          (i) => (i.company || '').trim().toLowerCase() !== industryNameLower
        );
        if (wf.internships.length !== origLength) wfModified = true;
      }
      if (wfModified) {
        await wf.save();
      }
    }

    return industry;
  }
}
