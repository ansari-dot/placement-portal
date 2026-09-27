import UserModel from '../model/user.model.js';
import NotificationModel from '../model/notification.model.js';

// GET /users - Fetch all users with search/filter and initial seeding
export const getAllUsersController = async (req, res) => {
  try {
    const { search, role, status, department } = req.query;
    const query = {};

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

    let users = await UserModel.find(query).sort({ createdAt: -1 });

    // Seed default administrative users if database is empty
    if (users.length === 0 && Object.keys(query).length === 0) {
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
          lastActive: new Date(Date.now() - 1000 * 60 * 2), // Active 2m ago
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

      // Use create to trigger pre-save password hashing
      for (const u of initialUsers) {
        await UserModel.create(u);
      }
      users = await UserModel.find(query).sort({ createdAt: -1 });
    }

    const onlineThresholdMs = 3 * 60 * 1000;
    const now = Date.now();
    const processedUsers = users.map(u => {
      const uObj = u.toObject ? u.toObject() : { ...u };
      const lastActiveTime = uObj.lastActive ? new Date(uObj.lastActive).getTime() : 0;
      const isRecentlyActive = (now - lastActiveTime) < onlineThresholdMs;
      uObj.isOnline = Boolean(uObj.isOnline) && isRecentlyActive;
      if (!uObj.lastSeen) {
        uObj.lastSeen = uObj.lastActive || uObj.lastLogin || uObj.updatedAt;
      }
      return uObj;
    });

    res.status(200).json({
      success: true,
      data: processedUsers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /users/stats - Aggregated metrics
export const getUserStatsController = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      coordinatorUsers,
      rtoManagerUsers,
      staffUsers,
      inactiveUsers
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ status: 'Active' }),
      UserModel.countDocuments({ role: 'Administrator' }),
      UserModel.countDocuments({ role: 'Coordinator' }),
      UserModel.countDocuments({ role: 'RTO Manager' }),
      UserModel.countDocuments({ role: 'Staff' }),
      UserModel.countDocuments({ status: { $ne: 'Active' } }),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await UserModel.countDocuments({ createdAt: { $gte: startOfMonth } });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        adminUsers,
        coordinatorUsers,
        rtoManagerUsers,
        staffUsers,
        inactiveUsers,
        newThisMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /users - Create new user
export const createUserController = async (req, res) => {
  try {
    const { name, email, password, role, department, status, phone, avatar } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password?.trim() || 'User@123',
      role: role || 'Staff',
      department: department || 'Placement Operations',
      status: status || 'Active',
      phone: phone || '',
      avatar: avatar || '',
      lastLogin: new Date(),
    });

    // Trigger System Notification
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

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT or PATCH /users/:id - Update user
export const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Don't overwrite password with empty string if not provided
    if (!updateData.password) {
      delete updateData.password;
    }

    // Check if updating email to another existing user's email
    if (updateData.email) {
      const existing = await UserModel.findOne({
        email: updateData.email.toLowerCase().trim(),
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Another user with this email already exists' });
      }
    }

    const updated = await UserModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /users/:id - Delete user
export const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting the last Administrator account
    if (user.role === 'Administrator') {
      const adminCount = await UserModel.countDocuments({ role: 'Administrator' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only Administrator account on the portal.',
        });
      }
    }

    await UserModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `${user.name} was deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /users/score-stats
// Returns coordinator progress rows for the Score tab.
//
// Admin  → one row per active user (all roles).
// Others → only their own row.
//
// Score formula (defined by product owner):
//   10 pts × placedStudents  (students with an Active internship)
//   50 pts × rtos            (distinct assignedRto values that match a real RTO in the DB)
//   30 pts × industries      (proper Industry records linked to coordinator, not random strings)
//
// All coordinator identification is ObjectId-based. Names are never used for filtering.
import StudentModel from '../model/student.model.js';
import WorkflowModel from '../model/workflow.model.js';
import IndustryModel from '../model/industry.model.js';
import RTOModel from '../model/rto.model.js';

export const getScoreStatsController = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'Administrator';

    // Determine which users to compute rows for
    let targetUsers;
    if (isAdmin) {
      targetUsers = await UserModel.find({ status: 'Active' }, { _id: 1, name: 1, role: 1, email: 1 }).lean();
    } else if (req.user) {
      targetUsers = [{ _id: req.user._id, name: req.user.name, role: req.user.role, email: req.user.email }];
    } else {
      return res.status(200).json({ success: true, data: [] });
    }

    // Pre-load all data once — avoids N+1 per coordinator
    // NOTE: include assignedCoordinatorName, status, placementStatus in projection
    const [allStudents, allWorkflows, allIndustries, allRtos] = await Promise.all([
      StudentModel.find({}, {
        _id: 1, studentId: 1, assignedCoordinator: 1, assignedCoordinatorName: 1,
        internshipPriority: 1, snoozed: 1, snoozeUntil: 1, status: 1, assignedRto: 1,
      }).lean(),
      WorkflowModel.find({}, {
        'internships.studentId': 1, 'internships.company': 1, 'internships.status': 1,
        'appointments.studentId': 1, 'appointments.company': 1,
        'requests.studentId': 1, 'requests.priority': 1, 'requests.status': 1, 'requests.contactedIndustries': 1,
      }).lean(),
      IndustryModel.find({}, { _id: 1, name: 1, createdBy: 1 }).lean(),
      RTOModel.find({}, { _id: 1, name: 1, createdBy: 1 }).lean(),
    ]);

    // Normalised set of real RTO names from the database (for "non-random" RTO scoring)
    const realRtoNames = new Set(
      allRtos.map(r => (r.name || '').trim().toLowerCase()).filter(Boolean)
    );

    // Build sets from workflows for Placed, Inactive requests, and Snoozed requests
    const activelyPlacedStudentIds = new Set();
    const workflowInactiveStudentIds = new Set();
    const workflowSnoozedStudentIds = new Set();

    // All statuses that mean a placement is active/in-progress
    const activePlacementStatuses = new Set([
      'active', 'waiting to join', 'joined', 'on hold', 'placement started',
    ]);

    for (const wf of allWorkflows) {
      for (const intern of (wf.internships || [])) {
        const internStatus = (intern.status || 'Active').trim().toLowerCase();
        if (activePlacementStatuses.has(internStatus) && intern.studentId) {
          activelyPlacedStudentIds.add(intern.studentId.trim().toLowerCase());
        }
      }
      for (const req of (wf.requests || [])) {
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

    const rows = targetUsers.map(user => {
      const uid = user._id.toString();
      const uName = (user.name || '').trim().toLowerCase();
      const uEmail = (user.email || '').trim().toLowerCase();

      // Students assigned to this user (matches ObjectId OR assignedCoordinatorName).
      // For Administrators we also include students with no coordinator assigned at all —
      // this mirrors the Workflow page Admin "All" view which shows every student,
      // including unassigned ones. Without this, unassigned students are invisible to
      // every row and their Inactive/Pending/Snoozed counts are silently dropped.
      const myStudents = allStudents.filter(s => {
        const coordId = s.assignedCoordinator ? s.assignedCoordinator.toString() : '';
        const coordName = (s.assignedCoordinatorName || '').trim().toLowerCase();
        const idMatch = coordId && coordId === uid;
        const nameMatch = coordName && (coordName === uName || coordName === uEmail);
        if (idMatch || nameMatch) return true;
        // Admin fallback: claim any student that has no coordinator assigned
        if (user.role === 'Administrator') {
          const isUnassigned = !coordId && !coordName;
          return isUnassigned;
        }
        return false;
      });

      const myStudentIdStrings = new Set(
        myStudents.map(s => (s.studentId || '').trim().toLowerCase()).filter(Boolean)
      );
      const myStudentDbIds = new Set(
        myStudents.map(s => s._id.toString().toLowerCase())
      );

      // Helper functions for student classification
      const isStudentPlaced = (s) => {
        const bizId = (s.studentId || '').trim().toLowerCase();
        const dbId = s._id.toString().toLowerCase();
        return (
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
        // Respect snoozeUntil expiry — if snooze period has passed, don't count as snoozed
        const snoozeActive = s.snoozed === true && (!s.snoozeUntil || new Date(s.snoozeUntil) > new Date());
        return (
          snoozeActive ||
          (s.internshipPriority || '').trim().toLowerCase() === 'snooze' ||
          workflowSnoozedStudentIds.has(bizId) ||
          workflowSnoozedStudentIds.has(dbId)
        );
      };

      // ── Placed ──
      const placedStudents = myStudents.filter(s => isStudentPlaced(s)).length;

      // ── Snooze (snoozed students are deferred, regardless of prior request status) ──
      const snoozedStudents = myStudents.filter(s => !isStudentPlaced(s) && isStudentSnoozed(s)).length;

      // ── Inactive (inactive and not currently snoozed) ──
      const inactiveStudents = myStudents.filter(s => !isStudentPlaced(s) && !isStudentSnoozed(s) && isStudentInactive(s)).length;

      // ── Pending Students: Not placed, not inactive, not snoozed ──
      const pendingStudents = myStudents.filter(s => !isStudentPlaced(s) && !isStudentSnoozed(s) && !isStudentInactive(s)).length;

      // ── RTOs: count of this user's students whose assignedRto matches a verified
      // RTO in the database, PLUS RTOs the user created directly.
      // Only verified (real) RTOs are counted — this is the same value used in the
      // score formula, so the column and the score are always in sync.
      const createdRtos = allRtos.filter(r => r.createdBy && r.createdBy.toString() === uid);
      const createdRtoNames = new Set(
        createdRtos.map(r => (r.name || '').trim().toLowerCase()).filter(Boolean)
      );
      // Names of RTOs assigned to this coordinator's students
      const rtoNamesOnStudents = new Set(
        myStudents.map(s => (s.assignedRto || '').trim().toLowerCase()).filter(Boolean)
      );
      // Union: RTOs created by user + RTOs on their students
      const allDistinctRtoNames = new Set([...createdRtoNames, ...rtoNamesOnStudents]);
      // Only count names that exist as verified records in the RTO collection
      const realRtosCount = [...allDistinctRtoNames].filter(n => realRtoNames.has(n)).length;

      // ── Industries: created by user OR linked to coordinator's students ──
      const createdByIndustryIds = new Set(
        allIndustries
          .filter(ind => ind.createdBy && ind.createdBy.toString() === uid)
          .map(ind => ind._id.toString())
      );

      const studentLinkedIndustryNames = new Set();
      if (myStudentIdStrings.size > 0 || myStudentDbIds.size > 0) {
        for (const wf of allWorkflows) {
          for (const intern of (wf.internships || [])) {
            const sid = (intern.studentId || '').trim().toLowerCase();
            if (!myStudentIdStrings.has(sid) && !myStudentDbIds.has(sid)) continue;
            const nm = (intern.company || '').trim().toLowerCase();
            if (nm) studentLinkedIndustryNames.add(nm);
          }
          for (const appt of (wf.appointments || [])) {
            const sid = (appt.studentId || '').trim().toLowerCase();
            if (!myStudentIdStrings.has(sid) && !myStudentDbIds.has(sid)) continue;
            const nm = (appt.company || '').trim().toLowerCase();
            if (nm && nm !== 'unknown company' && nm !== 'pending assignment') {
              studentLinkedIndustryNames.add(nm);
            }
          }
          for (const req of (wf.requests || [])) {
            const sid = (req.studentId || '').trim().toLowerCase();
            if (!myStudentIdStrings.has(sid) && !myStudentDbIds.has(sid)) continue;
            for (const c of (req.contactedIndustries || [])) {
              const nm = (c.organizationName || '').trim().toLowerCase();
              if (nm) studentLinkedIndustryNames.add(nm);
            }
          }
        }
      }

      const industries = allIndustries.filter(ind => {
        if (createdByIndustryIds.has(ind._id.toString())) return true;
        if (studentLinkedIndustryNames.has((ind.name || '').trim().toLowerCase())) return true;
        return false;
      }).length;

      // ── Score formula ──
      // 10 pts × placed students
      // 50 pts × real (non-random) RTOs onboarded
      // 30 pts × industries linked to this coordinator
      const score = (placedStudents * 10) + (realRtosCount * 50) + (industries * 30);

      return {
        userId:          uid,
        userName:        user.name,
        userRole:        user.role,
        userEmail:       user.email,
        pendingStudents,
        placedStudents,
        snoozedStudents,
        inactiveStudents,
        rtos:            realRtosCount,
        industries,
        score,
      };
    });

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getScoreStatsController error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
