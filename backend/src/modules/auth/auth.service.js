import jwt from 'jsonwebtoken';
import UserModel from '../user/user.model.js';
import StudentModel from '../student/student.model.js';
import RtoModel from '../rto/rto.model.js';
import { RtoService } from '../rto/rto.service.js';
import IndustryModel from '../industry/industry.model.js';
import { IndustryService } from '../industry/industry.service.js';
import NotificationModel from '../notification/notification.model.js';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../core/errors/AppError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mantis_portal_super_secret_key_2026';

export class AuthService {
  static async login({ email, password }) {
    const normEmail = (email || '').toLowerCase().trim();
    const user = await UserModel.findOne({ email: normEmail }).select('+password');

    if (!user || user.isDeleted) {
      throw new UnauthorizedError('Invalid credentials. User not found.');
    }

    if (user.status === 'Rejected') {
      const err = new ForbiddenError('Your registration request was rejected by an Administrator. Please contact support.');
      err.code = 'ACCOUNT_REJECTED';
      throw err;
    }

    if (user.status === 'Disabled') {
      const err = new ForbiddenError('Your account has been disabled. Please contact administration.');
      err.code = 'ACCOUNT_DISABLED';
      throw err;
    }

    if (user.status === 'Pending' || user.approved === false) {
      const err = new ForbiddenError('Your registration is waiting for Administrator approval.');
      err.code = 'ACCOUNT_PENDING_APPROVAL';
      throw err;
    }

    if (user.status !== 'Active') {
      const err = new ForbiddenError('Your account is inactive. Please contact administration.');
      err.code = 'ACCOUNT_INACTIVE';
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Upgrade any legacy plaintext password after a valid login
    if (!/^\$2[aby]\$\d{2}\$/.test(user.password || '')) {
      user.password = password;
    }

    const now = new Date();
    user.lastLogin = now;
    user.isOnline = true;
    user.lastActive = now;
    user.lastSeen = now;
    await user.save();

    // Mark matching student as online
    try {
      await StudentModel.updateMany(
        { emailAddress: normEmail },
        { $set: { isOnline: true, lastActive: now, lastSeen: now } }
      );
    } catch {}

    // Mark matching RTO as online
    try {
      await RtoModel.updateMany(
        { contactEmail: normEmail },
        { $set: { isOnline: true, lastActive: now, lastSeen: now } }
      );
    } catch {}

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '5h' }
    );

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, token };
  }

  static async signup(payload) {
    const { name, email, password, role, phone, rtoName, facilityName, course, studentId, notes } = payload;
    const normEmail = (email || '').toLowerCase().trim();

    // Enforce role trust boundary: Public signup must NEVER create an Administrator account
    const forbiddenRoles = ['Administrator', 'Admin', 'Staff'];
    if (forbiddenRoles.includes(role)) {
      throw new BadRequestError('Privileged roles cannot be created through public signup.');
    }

    // Normalize canonical role
    let canonicalRole = 'Student';
    if (role === 'RTO' || role === 'RTO Manager') canonicalRole = 'RTO Manager';
    else if (role === 'Placement Coordinator' || role === 'Coordinator') canonicalRole = 'Coordinator';
    else if (role === 'Industry' || role === 'Industry/Host') canonicalRole = 'Industry';
    else if (role === 'Student') canonicalRole = 'Student';

    // Check unique email
    const existingUser = await UserModel.findOne({ email: normEmail });
    if (existingUser) {
      throw new ConflictError('A user with this email address already exists');
    }

    // Auto-resolve RTO for RTO Manager signup if matching RTO is in system
    let boundRtoId = null;
    let boundRtoName = null;
    if (canonicalRole === 'RTO Manager' && rtoName) {
      try {
        const cleanRto = rtoName.trim();
        const matched = await RtoModel.findOne({
          name: { $regex: `^${cleanRto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        });
        if (matched) {
          boundRtoId = matched._id;
          boundRtoName = matched.name;
        }
      } catch (_) {}
    }

    // Auto-resolve Industry facility for Industry signup if matching Industry is in system
    let boundIndustryId = null;
    let boundFacilityName = null;
    if (canonicalRole === 'Industry' && facilityName) {
      try {
        const cleanFac = facilityName.trim();
        const matched = await IndustryModel.findOne({
          name: { $regex: `^${cleanFac.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        });
        if (matched) {
          boundIndustryId = matched._id;
          boundFacilityName = matched.name;
        }
      } catch (_) {}
    }

    let user;
    try {
      user = await UserModel.create({
        name: (name || '').trim(),
        email: normEmail,
        password: (password || '').trim(),
        role: canonicalRole,
        status: 'Pending',
        approved: false,
        isDeleted: false,
        phone: (phone || '').trim(),
        department: canonicalRole === 'Industry' ? 'Industry Partner' : canonicalRole === 'RTO Manager' ? 'RTO Relations' : 'Placement Operations',
        registrationNotes: (notes || '').trim(),
        requestedOrgName: (rtoName || '').trim(),
        rtoId: boundRtoId,
        rtoName: boundRtoName || (rtoName ? rtoName.trim() : undefined),
        requestedFacilityName: (facilityName || '').trim(),
        industryId: boundIndustryId,
        facilityName: boundFacilityName || (facilityName ? facilityName.trim() : undefined),
        requestedCourse: (course || '').trim(),
        requestedStudentId: (studentId || '').trim(),
      });

    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictError('A user with this email address already exists');
      }
      throw err;
    }

    // Notify active administrators of the new signup request
    try {
      const admins = await UserModel.find({
        role: { $in: ['Administrator', 'Admin'] },
        status: 'Active',
        isDeleted: false,
      });

      for (const admin of admins) {
        await NotificationModel.create({
          title: 'New User Registration Request',
          desc: `${user.name} (${user.role}) has requested access. Please review and approve.`,
          type: 'system',
          link: '/users',
          recipient: admin._id,
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify admins of signup:', notifyErr.message);
    }

    return {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      approved: user.approved,
      industryId: user.industryId,
      facilityName: user.facilityName,
      rtoId: user.rtoId,
      rtoName: user.rtoName,
    };
  }


  static async logout(user) {
    if (user?._id) {
      try {
        await UserModel.findByIdAndUpdate(user._id, {
          isOnline: false,
          lastSeen: new Date(),
        });
      } catch {}
    }

    if (user?.email) {
      const userEmail = user.email.toLowerCase().trim();
      try {
        await StudentModel.updateMany(
          { emailAddress: userEmail },
          { $set: { isOnline: false, lastSeen: new Date() } }
        );
      } catch {}

      try {
        await RtoModel.updateMany(
          { contactEmail: userEmail },
          { $set: { isOnline: false, lastSeen: new Date() } }
        );
      } catch {}
    }

    return true;
  }

  static async heartbeat(user) {
    const now = new Date();
    if (user?._id) {
      await UserModel.findByIdAndUpdate(user._id, {
        isOnline: true,
        lastActive: now,
        lastSeen: now,
      });
    }

    if (user?.email) {
      const userEmail = user.email.toLowerCase().trim();
      await StudentModel.updateMany(
        { emailAddress: userEmail },
        { $set: { isOnline: true, lastActive: now, lastSeen: now } }
      );
      await RtoModel.updateMany(
        { contactEmail: userEmail },
        { $set: { isOnline: true, lastActive: now, lastSeen: now } }
      );
    }

    return now.getTime();
  }

  static async getPresence(currentUser) {
    const onlineThresholdMs = 3 * 60 * 1000; // 3 minutes
    const now = Date.now();
    const currentUserId = currentUser?._id?.toString();

    const [allUsers, allStudents, allRtos] = await Promise.all([
      UserModel.find().sort({ createdAt: -1 }).lean(),
      StudentModel.find(
        {},
        'firstName lastName preferredName emailAddress assignedRto courseQualification studentId avatar isOnline lastActive lastSeen'
      ).sort({ createdAt: -1 }).lean(),
      RtoModel.find(
        {},
        'name code loc contactName contactEmail logo isOnline lastActive lastSeen'
      ).sort({ createdAt: -1 }).lean(),
    ]);

    const mappedUsers = allUsers.map((u) => {
      const isCurrentUser = currentUserId && u._id.toString() === currentUserId;
      const lastActiveTime = u.lastActive ? new Date(u.lastActive).getTime() : 0;
      const isRecentlyActive = now - lastActiveTime < onlineThresholdMs;
      const online = isCurrentUser || (Boolean(u.isOnline) && isRecentlyActive);
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        avatar: u.avatar,
        isOnline: online,
        lastActive: u.lastActive || u.lastLogin || u.updatedAt,
        lastSeen: online ? new Date() : u.lastSeen || u.lastActive || u.lastLogin || u.updatedAt,
      };
    });

    const mappedStudents = allStudents.map((s) => {
      const isCurrent =
        currentUser?.email &&
        s.emailAddress &&
        currentUser.email.toLowerCase().trim() === s.emailAddress.toLowerCase().trim();
      const lastActiveTime = s.lastActive ? new Date(s.lastActive).getTime() : 0;
      const isRecentlyActive = now - lastActiveTime < onlineThresholdMs;
      const online = isCurrent || (Boolean(s.isOnline) && isRecentlyActive);
      const fullName = s.preferredName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
      return {
        id: s._id,
        studentId: s.studentId,
        name: fullName,
        email: s.emailAddress,
        rto: s.assignedRto,
        course: s.courseQualification,
        avatar: s.avatar,
        isOnline: online,
        lastActive: s.lastActive || s.updatedAt,
        lastSeen: online ? new Date() : s.lastSeen || s.lastActive || s.updatedAt,
      };
    });

    const mappedRtos = allRtos.map((r) => {
      const isCurrent =
        currentUser?.email &&
        r.contactEmail &&
        currentUser.email.toLowerCase().trim() === r.contactEmail.toLowerCase().trim();
      const lastActiveTime = r.lastActive ? new Date(r.lastActive).getTime() : 0;
      const isRecentlyActive = now - lastActiveTime < onlineThresholdMs;
      const online = isCurrent || (Boolean(r.isOnline) && isRecentlyActive);
      return {
        id: r._id,
        name: r.name,
        code: r.code,
        loc: r.loc,
        contactName: r.contactName,
        contactEmail: r.contactEmail,
        logo: r.logo,
        isOnline: online,
        lastActive: r.lastActive || r.updatedAt,
        lastSeen: online ? new Date() : r.lastSeen || r.lastActive || r.updatedAt,
      };
    });

    const adminsOnline = mappedUsers.filter((u) => u.isOnline && u.role === 'Administrator').length;
    const coordinatorsOnline = mappedUsers.filter((u) => u.isOnline && u.role === 'Coordinator').length;
    const staffOnline = mappedUsers.filter((u) => u.isOnline && u.role === 'Staff').length;
    const studentsOnline =
      mappedStudents.filter((s) => s.isOnline).length +
      mappedUsers.filter((u) => u.isOnline && u.role === 'Student').length;
    const rtosOnline =
      mappedRtos.filter((r) => r.isOnline).length +
      mappedUsers.filter((u) => u.isOnline && u.role === 'RTO Manager').length;
    const totalOnline =
      mappedUsers.filter((u) => u.isOnline).length +
      mappedStudents.filter((s) => s.isOnline).length +
      mappedRtos.filter((r) => r.isOnline).length;

    return {
      summary: {
        totalOnline,
        adminsOnline,
        coordinatorsOnline,
        studentsOnline,
        rtosOnline,
        staffOnline,
      },
      users: mappedUsers,
      students: mappedStudents,
      rtos: mappedRtos,
    };
  }

  static async autocompleteRtos(queryStr) {
    return await RtoService.autocompleteRtos(queryStr);
  }

  static async autocompleteIndustries(queryStr) {
    return await IndustryService.autocompleteIndustries(queryStr);
  }
}

