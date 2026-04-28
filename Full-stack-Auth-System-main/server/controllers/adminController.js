import User from '../models/User.js';
import crypto from 'crypto';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password -twoFactorSecret')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

export const assignHardToken = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Generate secure random token
    const hardToken = crypto.randomBytes(16).toString('hex');
    const hardTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.hardToken = hardToken;
    user.hardTokenExpires = hardTokenExpires;
    await user.save();

    res.json({
      message: 'Hard token assigned successfully',
      hardToken,
      expiresAt: hardTokenExpires
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign hard token', error: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle user status', error: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
    const users2FA = await User.countDocuments({ role: 'user', twoFactorEnabled: true });
    const recentLogins = await User.countDocuments({
      role: 'user',
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalUsers,
      activeUsers,
      users2FA,
      recentLogins
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};