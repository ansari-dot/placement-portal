import jwt from 'jsonwebtoken';
import UserModel from '../model/user.model.js';
import StudentModel from '../model/student.model.js';
import RtoModel from '../model/rto.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mantis_portal_super_secret_key_2026';

// POST /auth/login - Secure Admin Login
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user with hidden password field selected
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact administration.' });
    }

    // Verify password with bcryptjs
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update last login & set online
    user.lastLogin = new Date();
    user.isOnline = true;
    user.lastActive = new Date();
    user.lastSeen = new Date();
    await user.save();

    // Mark matching student as online
    try {
      await StudentModel.updateMany(
        { emailAddress: email.toLowerCase().trim() },
        { $set: { isOnline: true, lastActive: new Date(), lastSeen: new Date() } }
      );
    } catch (stErr) {
      console.log('Student online update:', stErr?.message);
    }

    // Mark matching RTO as online
    try {
      await RtoModel.updateMany(
        { contactEmail: email.toLowerCase().trim() },
        { $set: { isOnline: true, lastActive: new Date(), lastSeen: new Date() } }
      );
    } catch (rtoErr) {
      console.log('RTO online update:', rtoErr?.message);
    }

    // Create JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '5h' }
    );

    // Store token exclusively in secure HttpOnly Cookie
    res.cookie('portal_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 60 * 1000, // 5 hours
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /auth/logout - Clear HttpOnly Session Cookie & Mark Offline
export const logoutController = async (req, res) => {
  try {
    if (req.user?._id) {
      try {
        await UserModel.findByIdAndUpdate(req.user._id, {
          isOnline: false,
          lastSeen: new Date(),
        });
      } catch (uErr) {}
    }

    if (req.user?.email) {
      const userEmail = req.user.email.toLowerCase().trim();
      try {
        await StudentModel.updateMany(
          { emailAddress: userEmail },
          { $set: { isOnline: false, lastSeen: new Date() } }
        );
      } catch (stErr) {}

      try {
        await RtoModel.updateMany(
          { contactEmail: userEmail },
          { $set: { isOnline: false, lastSeen: new Date() } }
        );
      } catch (rtoErr) {}
    }

    res.clearCookie('portal_token', {
      httpOnly: true,
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /auth/me - Retrieve current logged-in user profile
export const getMeController = async (req, res) => {
  try {
    if (req.user?._id) {
      // Keep presence updated
      await UserModel.findByIdAndUpdate(req.user._id, {
        isOnline: true,
        lastActive: new Date(),
        lastSeen: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /auth/heartbeat - Real-time activity pulse from active browser session
export const heartbeatController = async (req, res) => {
  try {
    const now = new Date();
    if (req.user?._id) {
      await UserModel.findByIdAndUpdate(req.user._id, {
        isOnline: true,
        lastActive: now,
        lastSeen: now,
      });
    }

    if (req.user?.email) {
      const userEmail = req.user.email.toLowerCase().trim();
      await StudentModel.updateMany(
        { emailAddress: userEmail },
        { $set: { isOnline: true, lastActive: now, lastSeen: now } }
      );
      await RtoModel.updateMany(
        { contactEmail: userEmail },
        { $set: { isOnline: true, lastActive: now, lastSeen: now } }
      );
    }

    res.status(200).json({
      success: true,
      timestamp: now.getTime(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /auth/presence - Comprehensive live presence metrics for Super Admin & all users
export const getPresenceController = async (req, res) => {
  try {
    const onlineThresholdMs = 3 * 60 * 1000; // 3 minutes
    const now = Date.now();
    const currentUserId = req.user?._id?.toString();

    // Fetch all users
    const allUsers = await UserModel.find().sort({ createdAt: -1 }).lean();
    // Fetch all students (lean)
    const allStudents = await StudentModel.find(
      {},
      'firstName lastName preferredName emailAddress assignedRto courseQualification studentId avatar isOnline lastActive lastSeen'
    ).sort({ createdAt: -1 }).lean();
    // Fetch all RTOs (lean)
    const allRtos = await RtoModel.find(
      {},
      'name code loc contactName contactEmail logo isOnline lastActive lastSeen'
    ).sort({ createdAt: -1 }).lean();

    // Map users with dynamic isOnline check
    const mappedUsers = allUsers.map(u => {
      const isCurrentUser = currentUserId && u._id.toString() === currentUserId;
      const lastActiveTime = u.lastActive ? new Date(u.lastActive).getTime() : 0;
      const isRecentlyActive = (now - lastActiveTime) < onlineThresholdMs;
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
        lastSeen: online ? new Date() : (u.lastSeen || u.lastActive || u.lastLogin || u.updatedAt),
      };
    });

    // Map students with dynamic isOnline check
    const mappedStudents = allStudents.map(s => {
      const isCurrent = req.user?.email && s.emailAddress && req.user.email.toLowerCase().trim() === s.emailAddress.toLowerCase().trim();
      const lastActiveTime = s.lastActive ? new Date(s.lastActive).getTime() : 0;
      const isRecentlyActive = (now - lastActiveTime) < onlineThresholdMs;
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
        lastSeen: online ? new Date() : (s.lastSeen || s.lastActive || s.updatedAt),
      };
    });

    // Map RTOs with dynamic isOnline check
    const mappedRtos = allRtos.map(r => {
      const isCurrent = req.user?.email && r.contactEmail && req.user.email.toLowerCase().trim() === r.contactEmail.toLowerCase().trim();
      const lastActiveTime = r.lastActive ? new Date(r.lastActive).getTime() : 0;
      const isRecentlyActive = (now - lastActiveTime) < onlineThresholdMs;
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
        lastSeen: online ? new Date() : (r.lastSeen || r.lastActive || r.updatedAt),
      };
    });

    const adminsOnline = mappedUsers.filter(u => u.isOnline && u.role === 'Administrator').length;
    const coordinatorsOnline = mappedUsers.filter(u => u.isOnline && u.role === 'Coordinator').length;
    const staffOnline = mappedUsers.filter(u => u.isOnline && u.role === 'Staff').length;
    const studentsOnline = mappedStudents.filter(s => s.isOnline).length + mappedUsers.filter(u => u.isOnline && u.role === 'Student').length;
    const rtosOnline = mappedRtos.filter(r => r.isOnline).length + mappedUsers.filter(u => u.isOnline && u.role === 'RTO Manager').length;
    const totalOnline = mappedUsers.filter(u => u.isOnline).length + mappedStudents.filter(s => s.isOnline).length + mappedRtos.filter(r => r.isOnline).length;

    res.status(200).json({
      success: true,
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
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

