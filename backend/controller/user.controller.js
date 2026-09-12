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
