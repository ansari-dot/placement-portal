import UserModel from './user.model.js';
import NotificationModel from '../notification/notification.model.js';
import StudentModel from '../student/student.model.js';
import WorkflowModel from '../workflow/workflow.model.js';
import IndustryModel from '../industry/industry.model.js';
import RTOModel from '../rto/rto.model.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../core/errors/AppError.js';

export class UserService {
  static async seedInitialUsersIfEmpty(query) {
    const count = await UserModel.countDocuments();
    if (count === 0 && Object.keys(query).length === 0) {
      const initialUsers = [
        {
          name: 'Mantis Admin',
          email: 'mantisplacements@gmail.com',
          password: 'Admin@123',
          role: 'Administrator',
          department: 'Administration & Operations',
          status: 'Active',
          phone: '+61 400 123 456',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
          lastLogin: new Date(),
          isOnline: true,
          lastActive: new Date(),
          lastSeen: new Date(),
        },
        {
          name: 'Sarah Jenkins',
          email: 'sarah.j@mantisplacements.com',
          password: 'User@123',
          role: 'Coordinator',
          department: 'Placement Operations',
          status: 'Active',
          phone: '+61 411 234 567',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
          lastLogin: new Date(Date.now() - 3600000 * 4),
          isOnline: true,
          lastActive: new Date(Date.now() - 1000 * 60 * 2),
          lastSeen: new Date(Date.now() - 1000 * 60 * 2),
        },
        {
          name: 'Michael Chang',
          email: 'michael.c@tafensw.edu.au',
          password: 'User@123',
          role: 'RTO Manager',
          department: 'RTO Relations',
          status: 'Active',
          phone: '+61 422 345 678',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
          lastLogin: new Date(Date.now() - 3600000 * 24),
          isOnline: false,
          lastActive: new Date(Date.now() - 3600000 * 2),
          lastSeen: new Date(Date.now() - 3600000 * 2),
        },
        {
          name: 'Emma Watson',
          email: 'emma.w@mantisplacements.com',
          password: 'User@123',
          role: 'Staff',
          department: 'Student Services',
          status: 'Active',
          phone: '+61 433 456 789',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces',
          lastLogin: new Date(Date.now() - 3600000 * 12),
          isOnline: false,
          lastActive: new Date(Date.now() - 3600000 * 12),
          lastSeen: new Date(Date.now() - 3600000 * 12),
        },
      ];
      for (const u of initialUsers) {
        await UserModel.create(u);
      }
    }
  }

  static async getAllUsers(queryParams = {}) {
    const { search, role, status, department, page, limit, includeDeleted } = queryParams;
    const query = {};

    if (!includeDeleted || includeDeleted === 'false') {
      query.isDeleted = { $ne: true };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'All') query.role = role;
    if (status && status !== 'All') query.status = status;
    if (department && department !== 'All') query.department = department;

    await this.seedInitialUsersIfEmpty(query);

    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    let userQuery = UserModel.find(query).sort({ createdAt: -1 });

    let total = 0;
    if (isPaginated) {
      total = await UserModel.countDocuments(query);
      userQuery = userQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const users = await userQuery;

    const onlineThresholdMs = 3 * 60 * 1000;
    const now = Date.now();
    const mappedUsers = users.map((u) => {
      const uObj = u.toObject ? u.toObject() : { ...u };
      delete uObj.password;
      const lastActiveTime = uObj.lastActive ? new Date(uObj.lastActive).getTime() : 0;
      const isRecentlyActive = now - lastActiveTime < onlineThresholdMs;
      uObj.isOnline = Boolean(uObj.isOnline) && isRecentlyActive;
      if (!uObj.lastSeen) {
        uObj.lastSeen = uObj.lastActive || uObj.lastLogin || uObj.updatedAt;
      }
      return uObj;
    });

    if (isPaginated) {
      return {
        users: mappedUsers,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    }

    return mappedUsers;
  }

  static async getUserById(id) {
    const user = await UserModel.findById(id).select('-password');
    if (!user || user.isDeleted) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  static async getPendingUsers() {
    return await UserModel.find({ status: 'Pending', isDeleted: { $ne: true } })
      .select('-password')
      .sort({ createdAt: -1 });
  }

  static async approveUser(id, adminUser) {
    const user = await UserModel.findById(id);
    if (!user || user.isDeleted) {
      throw new NotFoundError('User not found');
    }
    if (user.status !== 'Pending') {
      throw new BadRequestError('Only pending users can be approved');
    }

    user.status = 'Active';
    user.approved = true;
    user.approvedAt = new Date();
    user.approvedBy = adminUser?._id || null;
    user.rejectedAt = null;
    user.rejectedBy = null;
    user.rejectionReason = '';

    if ((user.role === 'RTO Manager' || user.role === 'RTO') && !user.rtoId && (user.requestedOrgName || user.rtoName)) {
      try {
        const orgSearch = (user.requestedOrgName || user.rtoName).trim();
        const matchedRto = await RTOModel.findOne({
          name: { $regex: `^${orgSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        });
        if (matchedRto) {
          user.rtoId = matchedRto._id;
          user.rtoName = matchedRto.name;
        } else if (!user.rtoName) {
          user.rtoName = orgSearch;
        }
      } catch (_) {}
    }

    if ((user.role === 'Industry' || user.role === 'Industry/Host') && !user.industryId && (user.requestedFacilityName || user.facilityName)) {
      try {
        const facSearch = (user.requestedFacilityName || user.facilityName).trim();
        const matchedIndustry = await IndustryModel.findOne({
          name: { $regex: `^${facSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        });
        if (matchedIndustry) {
          user.industryId = matchedIndustry._id;
          user.facilityName = matchedIndustry.name;
        } else if (!user.facilityName) {
          user.facilityName = facSearch;
        }
      } catch (_) {}
    }

    await user.save();


    try {
      await NotificationModel.create({
        title: 'Account Approved',
        desc: `Your account has been approved. You can now log in.`,
        type: 'system',
        link: '/',
        recipient: user._id,
      });
    } catch (notifyErr) {
      console.error('Failed to notify approved user:', notifyErr.message);
    }

    const resObj = user.toObject();
    delete resObj.password;
    return resObj;
  }

  static async rejectUser(id, adminUser, reason = '') {
    const user = await UserModel.findById(id);
    if (!user || user.isDeleted) {
      throw new NotFoundError('User not found');
    }
    if (user.status !== 'Pending') {
      throw new BadRequestError('Only pending users can be rejected');
    }

    // Soft reject: Mark account as Rejected with administrator notes, preserving audit history
    user.status = 'Rejected';
    user.approved = false;
    user.rejectedAt = new Date();
    user.rejectedBy = adminUser?._id || null;
    user.rejectionReason = (reason || '').trim() || 'Registration rejected by administrator';

    await user.save();

    const resObj = user.toObject();
    delete resObj.password;
    return resObj;
  }

  static async updateUserStatus(id, newStatus, adminUser, reason = '') {
    const validStatuses = ['Active', 'Inactive', 'Disabled', 'Suspended'];
    if (!validStatuses.includes(newStatus)) {
      throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const user = await UserModel.findById(id);
    if (!user || user.isDeleted) {
      throw new NotFoundError('User not found');
    }

    // Protect the last active Administrator from being deactivated or suspended
    if (
      user.role === 'Administrator' &&
      newStatus !== 'Active'
    ) {
      const activeAdminCount = await UserModel.countDocuments({
        role: { $in: ['Administrator', 'Admin'] },
        status: 'Active',
        isDeleted: { $ne: true },
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestError('The last active Administrator cannot be deactivated or disabled.');
      }
    }

    user.status = newStatus;
    user.approved = newStatus === 'Active';
    if (newStatus === 'Active') {
      user.approvedAt = new Date();
      user.approvedBy = adminUser?._id || null;
    }

    await user.save();

    const resObj = user.toObject();
    delete resObj.password;
    return resObj;
  }

  static async reactivateUser(id, adminUser) {
    const user = await UserModel.findById(id);
    if (!user || user.isDeleted) {
      throw new NotFoundError('User not found');
    }

    if (user.status === 'Rejected') {
      throw new BadRequestError('Rejected accounts cannot be reactivated directly. They must be reapproved through the explicit approval workflow.');
    }

    if (!['Disabled', 'Inactive', 'Suspended'].includes(user.status)) {
      throw new BadRequestError('Only disabled, inactive, or suspended users can be reactivated.');
    }

    user.status = 'Active';
    user.approved = true;
    user.approvedAt = new Date();
    user.approvedBy = adminUser?._id || null;

    await user.save();

    const resObj = user.toObject();
    delete resObj.password;
    return resObj;
  }

  static async getUserStats() {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      coordinatorUsers,
      rtoManagerUsers,
      staffUsers,
      industryUsers,
      inactiveUsers,
      pendingUsers,
    ] = await Promise.all([
      UserModel.countDocuments({ isDeleted: { $ne: true } }),
      UserModel.countDocuments({ status: 'Active', isDeleted: { $ne: true } }),
      UserModel.countDocuments({ role: { $in: ['Administrator', 'Admin'] }, isDeleted: { $ne: true } }),
      UserModel.countDocuments({ role: { $in: ['Coordinator', 'Placement Coordinator'] }, isDeleted: { $ne: true } }),
      UserModel.countDocuments({ role: { $in: ['RTO Manager', 'RTO'] }, isDeleted: { $ne: true } }),
      UserModel.countDocuments({ role: 'Staff', isDeleted: { $ne: true } }),
      UserModel.countDocuments({ role: { $in: ['Industry', 'Industry/Host'] }, isDeleted: { $ne: true } }),
      UserModel.countDocuments({ status: { $in: ['Inactive', 'Disabled', 'Suspended', 'Rejected'] }, isDeleted: { $ne: true } }),
      UserModel.countDocuments({ status: 'Pending', isDeleted: { $ne: true } }),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await UserModel.countDocuments({
      createdAt: { $gte: startOfMonth },
      isDeleted: { $ne: true },
    });

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      coordinatorUsers,
      rtoManagerUsers,
      staffUsers,
      industryUsers,
      inactiveUsers,
      pendingUsers,
      newThisMonth,
    };
  }

  static async createUser({ name, email, password, role, department, status, phone, avatar }) {
    const normEmail = email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: normEmail });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const userStatus = status || 'Active';
    const user = await UserModel.create({
      name: name.trim(),
      email: normEmail,
      password: password?.trim() || 'User@123',
      role: role || 'Staff',
      department: department || 'Placement Operations',
      status: userStatus,
      approved: userStatus === 'Active',
      isDeleted: false,
      phone: phone || '',
      avatar: avatar || '',
      lastLogin: new Date(),
    });

    try {
      await NotificationModel.create({
        title: 'New System User Created',
        desc: `${name} (${user.role}) was added to ${user.department}`,
        type: 'system',
        link: '/users',
      });
    } catch (err) {
      console.error('Failed to trigger user notification:', err);
    }

    return user;
  }

  static async updateUser(id, updateData) {
    const editableFields = ['name', 'email', 'password', 'role', 'department', 'status', 'phone', 'avatar', 'rtoId', 'rtoName', 'industryId', 'facilityName'];
    const filteredUpdates = {};
    for (const key of editableFields) {
      if (updateData[key] !== undefined) {
        filteredUpdates[key] = updateData[key];
      }
    }

    if (filteredUpdates.email) {
      filteredUpdates.email = filteredUpdates.email.toLowerCase().trim();
      const existing = await UserModel.findOne({
        email: filteredUpdates.email,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictError('Another user with this email already exists');
      }
    }

    if (filteredUpdates.password === '' || filteredUpdates.password === undefined) {
      delete filteredUpdates.password;
    }

    const currentUser = await UserModel.findById(id);
    if (!currentUser || currentUser.isDeleted) {
      throw new NotFoundError('User not found');
    }

    const isRemovingAdminAccess =
      currentUser.role === 'Administrator' &&
      ((filteredUpdates.role && filteredUpdates.role !== 'Administrator') ||
        (filteredUpdates.status && filteredUpdates.status !== 'Active'));

    if (isRemovingAdminAccess) {
      const activeAdminCount = await UserModel.countDocuments({
        role: { $in: ['Administrator', 'Admin'] },
        status: 'Active',
        isDeleted: { $ne: true },
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestError('The last active Administrator cannot be deactivated or changed to another role.');
      }
    }

    Object.assign(currentUser, filteredUpdates);
    if (filteredUpdates.status === 'Active') {
      currentUser.approved = true;
    }
    const updated = await currentUser.save();
    const userResponse = updated.toObject();
    delete userResponse.password;
    return userResponse;
  }

  static async deleteUser(id, adminUser) {
    const user = await UserModel.findById(id);
    if (!user || user.isDeleted) {
      throw new NotFoundError('User not found');
    }

    if (user.role === 'Administrator' || user.role === 'Admin') {
      const adminCount = await UserModel.countDocuments({
        role: { $in: ['Administrator', 'Admin'] },
        status: 'Active',
        isDeleted: { $ne: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestError('Cannot delete the only Administrator account on the portal.');
      }
    }

    // Soft delete by default to preserve audit trails, attendance records, and placement history
    user.isDeleted = true;
    user.status = 'Inactive';
    user.approved = false;
    user.deletedAt = new Date();
    user.deletedBy = adminUser?._id || null;
    await user.save();

    return user;
  }

  static async getScoreStats(actingUser) {
    const isAdmin = actingUser?.role === 'Administrator';

    let targetUsers;
    if (isAdmin) {
      targetUsers = await UserModel.find({}, { _id: 1, name: 1, role: 1, email: 1 }).lean();
    } else if (actingUser) {
      targetUsers = [{ _id: actingUser._id, name: actingUser.name, role: actingUser.role, email: actingUser.email }];
    } else {
      return [];
    }

    const [allStudents, allWorkflows, allIndustries, allRtos] = await Promise.all([
      StudentModel.find(
        {},
        {
          _id: 1,
          studentId: 1,
          assignedCoordinator: 1,
          assignedCoordinatorName: 1,
          internshipPriority: 1,
          snoozed: 1,
          snoozeUntil: 1,
          status: 1,
          placementStatus: 1,
          assignedRto: 1,
        }
      ).lean(),
      WorkflowModel.find(
        {},
        {
          'internships.studentId': 1,
          'internships.company': 1,
          'internships.status': 1,
          'appointments.studentId': 1,
          'appointments.company': 1,
          'requests.studentId': 1,
          'requests.priority': 1,
          'requests.status': 1,
          'requests.contactedIndustries': 1,
        }
      ).lean(),
      IndustryModel.find({}, { _id: 1, name: 1, createdBy: 1, industryCategory: 1, onboardedBy: 1 }).lean(),
      RTOModel.find({}, { _id: 1, name: 1, createdBy: 1, onboardedBy: 1 }).lean(),
    ]);

    const activelyPlacedStudentIds = new Set();
    const workflowInactiveStudentIds = new Set();
    const workflowSnoozedStudentIds = new Set();
    const activePlacementStatuses = new Set(['active', 'waiting to join', 'joined', 'on hold', 'placement started']);

    for (const wf of allWorkflows) {
      for (const intern of wf.internships || []) {
        const internStatus = (intern.status || 'Active').trim().toLowerCase();
        if (activePlacementStatuses.has(internStatus) && intern.studentId) {
          activelyPlacedStudentIds.add(intern.studentId.trim().toLowerCase());
        }
      }
      for (const req of wf.requests || []) {
        if (!req.studentId) continue;
        const sKey = req.studentId.trim().toLowerCase();
        const p = (req.priority || '').trim().toLowerCase();
        const st = (req.status || '').trim().toLowerCase();
        if (p === 'inactive' || st === 'inactive') {
          workflowInactiveStudentIds.add(sKey);
        } else if (p === 'snooze') {
          workflowSnoozedStudentIds.add(sKey);
        }
      }
    }

    return targetUsers.map((user) => {
      const uid = user._id.toString();
      const uName = (user.name || '').trim().toLowerCase();
      const uEmail = (user.email || '').trim().toLowerCase();

      const myStudents = allStudents.filter((s) => {
        const coordId = s.assignedCoordinator ? s.assignedCoordinator.toString() : '';
        const coordName = (s.assignedCoordinatorName || '').trim().toLowerCase();
        const idMatch = coordId && coordId === uid;
        const nameMatch = coordName && (coordName === uName || coordName === uEmail);
        if (idMatch || nameMatch) return true;
        if (user.role === 'Administrator') {
          return !coordId && !coordName;
        }
        return false;
      });

      const isStudentPlaced = (s) => {
        const bizId = (s.studentId || '').trim().toLowerCase();
        const dbId = s._id.toString().toLowerCase();
        return (
          (s.placementStatus || '').trim().toLowerCase() === 'placement started' ||
          activelyPlacedStudentIds.has(bizId) ||
          activelyPlacedStudentIds.has(dbId)
        );
      };

      const isStudentInactive = (s) => {
        const bizId = (s.studentId || '').trim().toLowerCase();
        const dbId = s._id.toString().toLowerCase();
        return (
          (s.internshipPriority || '').trim().toLowerCase() === 'inactive' ||
          (s.status || '').trim().toLowerCase() === 'inactive' ||
          workflowInactiveStudentIds.has(bizId) ||
          workflowInactiveStudentIds.has(dbId)
        );
      };

      const isStudentSnoozed = (s) => {
        const bizId = (s.studentId || '').trim().toLowerCase();
        const dbId = s._id.toString().toLowerCase();
        const snoozeActive = s.snoozed === true && (!s.snoozeUntil || new Date(s.snoozeUntil) > new Date());
        return (
          snoozeActive ||
          (s.internshipPriority || '').trim().toLowerCase() === 'snooze' ||
          workflowSnoozedStudentIds.has(bizId) ||
          workflowSnoozedStudentIds.has(dbId)
        );
      };

      const placedStudents = myStudents.filter((s) => isStudentPlaced(s)).length;
      const snoozedStudents = myStudents.filter((s) => !isStudentPlaced(s) && isStudentSnoozed(s)).length;
      const inactiveStudents = myStudents.filter((s) => !isStudentPlaced(s) && !isStudentSnoozed(s) && isStudentInactive(s)).length;
      const pendingStudents = myStudents.filter((s) => !isStudentPlaced(s) && !isStudentSnoozed(s) && !isStudentInactive(s)).length;

      const createdRtos = allRtos.filter((r) => r.onboardedBy && r.onboardedBy.toString() === uid);
      const realRtosCount = createdRtos.length;

      const industries = allIndustries.filter(
        (ind) => ind.industryCategory === 'Partner' && ind.onboardedBy && ind.onboardedBy.toString() === uid
      ).length;

      const score = placedStudents * 10 + realRtosCount * 50 + industries * 30;

      return {
        userId: uid,
        userName: user.name,
        userRole: user.role,
        userEmail: user.email,
        pendingStudents,
        placedStudents,
        snoozedStudents,
        inactiveStudents,
        rtos: realRtosCount,
        industries,
        score,
      };
    });
  }

  static async getOnboardingEligibleUsers() {
    return await UserModel.find({
      status: { $regex: /^active$/i },
      role: { $in: [
        'Administrator', 'Admin', 'Coordinator', 'Staff',
        /^administrator$/i, /^admin$/i, /^coordinator$/i, /^staff$/i
      ] },
    })
      .select('_id name email role department')
      .sort({ name: 1 })
      .lean();
  }
}
