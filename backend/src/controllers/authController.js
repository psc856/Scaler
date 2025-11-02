import { asyncHandler } from '../middleware/errorHandler.js';
import UserModel from '../models/userModel.js';

/**
 * Get or create user
 * POST /api/auth/user
 */
export const getOrCreateUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const user = UserModel.getOrCreate(email);

  res.status(200).json({
    success: true,
    data: {
      ...user,
      settings: JSON.parse(user.settings || '{}')
    }
  });
});

/**
 * Connect Gmail account
 * POST /api/auth/gmail/connect
 */
export const connectGmail = asyncHandler(async (req, res) => {
  const { email, accessToken, refreshToken } = req.body;

  if (!email || !accessToken) {
    return res.status(400).json({
      success: false,
      message: 'Email and access token are required'
    });
  }

  const user = UserModel.connectGmail(email, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Gmail connected successfully',
    data: {
      ...user,
      settings: JSON.parse(user.settings || '{}')
    }
  });
});

/**
 * Disconnect Gmail account
 * POST /api/auth/gmail/disconnect
 */
export const disconnectGmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const user = UserModel.disconnectGmail(email);

  res.status(200).json({
    success: true,
    message: 'Gmail disconnected successfully',
    data: {
      ...user,
      settings: JSON.parse(user.settings || '{}')
    }
  });
});

/**
 * Update user settings
 * PUT /api/auth/settings
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const { email, settings } = req.body;

  if (!email || !settings) {
    return res.status(400).json({
      success: false,
      message: 'Email and settings are required'
    });
  }

  const user = UserModel.updateSettings(email, settings);

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: {
      ...user,
      settings: JSON.parse(user.settings || '{}')
    }
  });
});

/**
 * Get user by email
 * GET /api/auth/user/:email
 */
export const getUserByEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;

  const user = UserModel.findByEmail(email);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...user,
      settings: JSON.parse(user.settings || '{}')
    }
  });
});

export default {
  getOrCreateUser,
  connectGmail,
  disconnectGmail,
  updateSettings,
  getUserByEmail
};
