import NotificationModel from './notification.model.js';
import StudentModel from '../student/student.model.js';
import RtoModel from '../rto/rto.model.js';
import { getStudentQueryScope } from '../../core/utils/rbacScope.js';
import { NotFoundError } from '../../core/errors/AppError.js';

export const normalizeRole = (role) => {
  if (!role) return '';
  const r = String(role).trim().toLowerCase();
  if (r === 'administrator' || r === 'admin') return 'Admin';
  if (r === 'coordinator' || r === 'placement coordinator' || r === 'staff') return 'Coordinator';
  if (r === 'student') return 'Student';
  if (r === 'industry' || r === 'industry/host') return 'Industry';
  if (r === 'rto' || r === 'rto manager') return 'RTO';
  return role;
};

const getRoleAliases = (role) => {
  const canonical = normalizeRole(role);
  switch (canonical) {
    case 'Admin':
      return ['Administrator', 'Admin'];
    case 'Coordinator':
      return ['Coordinator', 'Placement Coordinator', 'Staff'];
    case 'Student':
      return ['Student'];
    case 'Industry':
      return ['Industry', 'Industry/Host'];
    case 'RTO':
      return ['RTO', 'RTO Manager'];
    default:
      return [role];
  }
};

export class NotificationService {
  static async getAllNotifications(user = null) {
    // If no user is logged in, unauthenticated clients should receive no notifications
    if (!user) {
      return { notifications: [], unreadCount: 0 };
    }

    const userId = user._id;
    const userRole = user.role || '';
    const canonicalRole = normalizeRole(userRole);
    const roleAliases = getRoleAliases(userRole);

    let rawNotifications = [];

    if (canonicalRole === 'Admin') {
      // Administrators have global visibility of all notifications across the platform
      rawNotifications = await NotificationModel.find({
        clearedBy: { $ne: userId },
      })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // Non-admin roles (Student, Industry, RTO, Coordinator)
      // Rule 1: A notification is a candidate if directly sent to this user, OR
      // if it has NO specific other recipient and is targeted to their role (or All).
      const orConditions = [
        { recipient: userId },
        {
          $and: [
            { $or: [{ recipient: null }, { recipient: { $exists: false } }] },
            {
              $or: [
                { targetRoles: { $in: ['All', 'all', ...roleAliases, canonicalRole] } },
                { targetRole: { $in: ['All', 'all', ...roleAliases, canonicalRole] } },
              ],
            },
          ],
        },
      ];

      rawNotifications = await NotificationModel.find({
        clearedBy: { $ne: userId },
        $or: orConditions,
      })
        .sort({ createdAt: -1 })
        .lean();

      let allowedRtoNames = new Set();
      let allowedStudentNames = new Set();
      let allowedStudentIds = new Set();

      if (canonicalRole === 'RTO') {
        let userRtoName = (user.rtoName || '').trim();
        if (!userRtoName && user.rtoId) {
          const rtoDoc = await RtoModel.findById(user.rtoId).lean();
          if (rtoDoc) userRtoName = rtoDoc.name;
        }
        if (!userRtoName && user.email) {
          const matchedRto = await RtoModel.findOne({ contactEmail: user.email.toLowerCase().trim() }).lean();
          if (matchedRto) userRtoName = matchedRto.name;
        }
        if (!userRtoName && user.requestedOrgName) {
          userRtoName = user.requestedOrgName.trim();
        }

        const studentScope = await getStudentQueryScope(user);
        const studentDocs = await StudentModel.find(studentScope, { firstName: 1, lastName: 1, name: 1, studentId: 1, assignedRto: 1, institute: 1 }).lean();

        allowedRtoNames = new Set(
          [userRtoName, ...studentDocs.flatMap((s) => [s.assignedRto, s.institute])]
            .filter(Boolean)
            .map((r) => r.toLowerCase().trim())
        );

        allowedStudentNames = new Set(
          studentDocs.flatMap((s) => [
            s.name,
            `${s.firstName || ''} ${s.lastName || ''}`.trim(),
            s.firstName,
            s.lastName,
          ]).filter(Boolean).map((n) => n.toLowerCase().trim())
        );

        allowedStudentIds = new Set(
          studentDocs.map((s) => String(s.studentId).trim().toLowerCase()).filter(Boolean)
        );
      }

      // Granular contextual filtering for specific roles
      rawNotifications = rawNotifications.filter((n) => {
        // Direct recipient always sees their own notification
        if (n.recipient && String(n.recipient) === String(userId)) return true;
        // If notification was explicitly addressed to someone else, reject
        if (n.recipient && String(n.recipient) !== String(userId)) return false;

        const titleLower = (n.title || '').toLowerCase().trim();
        const descLower = (n.desc || '').toLowerCase().trim();
        const linkLower = (n.link || '').toLowerCase().trim();

        // Admin-only activities must never leak to non-admins
        if (
          linkLower.includes('/users') ||
          linkLower.includes('/admin') ||
          titleLower.includes('registration request') ||
          descLower.includes('requested access') ||
          titleLower.includes('account approved') ||
          titleLower.includes('account rejected')
        ) {
          return false;
        }

        const isBroad = (n.targetRoles || []).some((r) => ['All', 'all'].includes(r)) || ['All', 'all'].includes(n.targetRole);

        if (canonicalRole === 'Student') {
          if (isBroad && !n.studentName && !n.studentId) return true;
          if (n.studentName) {
            const userNameLower = (user.name || '').toLowerCase().trim();
            const studentNameLower = n.studentName.toLowerCase().trim();
            if (userNameLower && studentNameLower && !studentNameLower.includes(userNameLower) && !userNameLower.includes(studentNameLower)) {
              return false;
            }
          }
          if (n.studentId && user.requestedStudentId) {
            if (n.studentId.trim().toLowerCase() !== user.requestedStudentId.trim().toLowerCase()) {
              return false;
            }
          }
          return true;
        }

        if (canonicalRole === 'Industry') {
          if (isBroad && !n.company) return true;
          if (n.company) {
            const userFacility = (user.facilityName || user.requestedFacilityName || user.name || '').toLowerCase().trim();
            const notifCompany = n.company.toLowerCase().trim();
            if (userFacility && notifCompany && !userFacility.includes(notifCompany) && !notifCompany.includes(userFacility)) {
              return false;
            }
          }
          return true;
        }

        if (canonicalRole === 'RTO') {
          // Invoices are strictly scoped to the billed RTO or enrolled student
          if (titleLower.includes('invoice') || descLower.includes('invoice')) {
            if (n.rtoName && allowedRtoNames.has(n.rtoName.toLowerCase().trim())) {
              return true;
            }
            for (const rName of allowedRtoNames) {
              if (rName.length >= 3 && descLower.includes(rName)) return true;
            }
            for (const sName of allowedStudentNames) {
              if (sName.length >= 3 && descLower.includes(sName)) return true;
            }
            return false;
          }

          // Student notifications
          if (n.studentId) {
            return allowedStudentIds.has(n.studentId.trim().toLowerCase());
          }
          if (n.studentName) {
            const sNameLower = n.studentName.toLowerCase().trim();
            return (
              allowedStudentNames.has(sNameLower) ||
              [...allowedStudentNames].some((asn) => sNameLower.includes(asn) || asn.includes(sNameLower))
            );
          }

          // RTO-tagged notifications
          if (n.rtoName) {
            const notifRtoLower = n.rtoName.toLowerCase().trim();
            return (
              allowedRtoNames.has(notifRtoLower) ||
              [...allowedRtoNames].some((arn) => notifRtoLower.includes(arn) || arn.includes(notifRtoLower))
            );
          }

          // If specifically targeted to RTOs without individual entity tags
          const targetsRto =
            (n.targetRoles || []).some((r) => ['rto', 'rto manager'].includes(String(r).toLowerCase())) ||
            ['rto', 'rto manager'].includes(String(n.targetRole).toLowerCase());

          if (targetsRto && !n.company && !n.studentName && !n.studentId && !n.rtoName) {
            return true;
          }

          // General broadcast notifications
          if (isBroad && !n.company && !n.studentName && !n.studentId && !n.rtoName && n.type === 'system') {
            return true;
          }

          return false;
        }

        return true;
      });
    }

    // Map isRead based on whether current user has read this notification
    const notifications = rawNotifications.map((n) => {
      const isReadByMe =
        (n.readBy || []).some((id) => String(id) === String(userId)) ||
        (n.recipient && String(n.recipient) === String(userId) && n.isRead);

      return {
        ...n,
        id: n._id,
        isRead: Boolean(isReadByMe),
      };
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return { notifications, unreadCount };
  }

  static async createNotification({
    title,
    desc,
    type = 'system',
    link = '',
    targetRoles = [],
    targetRole = null,
    recipient = null,
    sender = null,
    senderName = '',
    studentName = '',
    studentId = '',
    company = '',
    rtoName = '',
  }) {
    let roles = Array.isArray(targetRoles) ? [...targetRoles] : (targetRoles ? [targetRoles] : []);
    if (targetRole && !roles.includes(targetRole)) {
      roles.push(targetRole);
    }
    // If no roles specified and no specific recipient, default to 'All'
    if (roles.length === 0 && !recipient) {
      roles = ['All'];
    }

    return await NotificationModel.create({
      title,
      desc,
      type: type || 'system',
      link: link || '',
      targetRoles: roles,
      targetRole: roles[0] || null,
      recipient: recipient || null,
      sender: sender || null,
      senderName: senderName || '',
      studentName: studentName || '',
      studentId: studentId || '',
      company: company || '',
      rtoName: rtoName || '',
      isRead: false,
      readBy: [],
      clearedBy: [],
    });
  }

  static async markRead(id, user = null) {
    const update = { isRead: true };
    if (user?._id) {
      update.$addToSet = { readBy: user._id };
    }
    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    return notification;
  }

  static async markAllRead(user = null) {
    if (!user?._id) {
      await NotificationModel.updateMany({ isRead: false }, { isRead: true });
      return true;
    }

    const { notifications } = await this.getAllNotifications(user);
    const notifIds = notifications.map((n) => n._id || n.id);
    if (notifIds.length > 0) {
      await NotificationModel.updateMany(
        { _id: { $in: notifIds } },
        {
          $addToSet: { readBy: user._id },
          $set: { isRead: true },
        }
      );
    }
    return true;
  }

  static async deleteNotification(id, user = null) {
    if (!user?._id) {
      const notification = await NotificationModel.findByIdAndDelete(id);
      if (!notification) throw new NotFoundError('Notification not found');
      return true;
    }

    const canonicalRole = normalizeRole(user.role);
    if (canonicalRole === 'Admin') {
      // Admin can permanently remove notification
      const notification = await NotificationModel.findByIdAndDelete(id);
      if (!notification) throw new NotFoundError('Notification not found');
    } else {
      // Non-admin roles soft-delete for themselves so other recipients aren't affected
      await NotificationModel.findByIdAndUpdate(id, {
        $addToSet: { clearedBy: user._id },
      });
    }
    return true;
  }

  static async clearAllNotifications(user = null) {
    if (!user?._id) {
      await NotificationModel.deleteMany({});
      return true;
    }

    const canonicalRole = normalizeRole(user.role);
    if (canonicalRole === 'Admin') {
      await NotificationModel.deleteMany({});
    } else {
      const { notifications } = await this.getAllNotifications(user);
      const notifIds = notifications.map((n) => n._id || n.id);
      if (notifIds.length > 0) {
        await NotificationModel.updateMany(
          { _id: { $in: notifIds } },
          { $addToSet: { clearedBy: user._id } }
        );
      }
    }
    return true;
  }
}

