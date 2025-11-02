import UserModel from '../models/userModel.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

let google = null;
let oauth2Client = null;

// Initialize Google APIs only if credentials are available
try {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Dynamic import for googleapis
    import('googleapis').then(({ google: googleApis }) => {
      google = googleApis;
      oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5002/api/auth/gmail/callback'
      );
      console.log('✅ Google OAuth initialized');
    }).catch(error => {
      console.warn('⚠️  Google APIs import failed:', error.message);
    });
  } else {
    console.warn('⚠️  Google OAuth credentials not configured');
  }
} catch (error) {
  console.warn('⚠️  Google APIs initialization error:', error.message);
}

/**
 * Get Gmail authorization URL
 */
export const getGmailAuthUrl = asyncHandler(async (req, res) => {
  if (!oauth2Client) {
    throw new AppError(503, 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  }

  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.status(200).json({
    success: true,
    authUrl,
    message: 'Visit this URL to authorize Gmail access'
  });
});

/**
 * Handle Gmail OAuth callback
 */
export const handleGmailCallback = asyncHandler(async (req, res) => {
  if (!oauth2Client || !google) {
    return res.redirect(`${process.env.FRONTEND_URL}?gmail_error=oauth_not_configured`);
  }

  const { code } = req.query;

  if (!code) {
    throw new AppError(400, 'Authorization code is required');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Save user with Gmail connection
    const userData = {
      email: userInfo.data.email,
      name: userInfo.data.name,
      gmail_connected: true,
      gmail_tokens: tokens,
      connected_at: new Date().toISOString()
    };

    UserModel.createOrUpdate(userData);

    res.redirect(`${process.env.FRONTEND_URL}?gmail_connected=true`);
  } catch (error) {
    console.error('Gmail OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?gmail_error=true`);
  }
});

/**
 * Check Gmail connection status
 */
export const getGmailStatus = asyncHandler(async (req, res) => {
  const { user_email } = req.query;

  if (!user_email) {
    return res.status(200).json({
      success: true,
      connected: false,
      message: 'No user email provided'
    });
  }

  const user = UserModel.findByEmail(user_email);

  res.status(200).json({
    success: true,
    connected: user?.gmail_connected || false,
    email: user?.email,
    connectedAt: user?.connected_at
  });
});

/**
 * Disconnect Gmail
 */
export const disconnectGmail = asyncHandler(async (req, res) => {
  const { user_email } = req.body;

  if (!user_email) {
    throw new AppError(400, 'User email is required');
  }

  const user = UserModel.findByEmail(user_email);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Revoke tokens if they exist
  if (user.gmail_tokens?.refresh_token) {
    try {
      oauth2Client.setCredentials(user.gmail_tokens);
      await oauth2Client.revokeCredentials();
    } catch (error) {
      console.warn('Token revocation failed:', error.message);
    }
  }

  // Update user record
  UserModel.update(user.id, {
    gmail_connected: false,
    gmail_tokens: null,
    connected_at: null
  });

  res.status(200).json({
    success: true,
    message: 'Gmail disconnected successfully'
  });
});

export default {
  getGmailAuthUrl,
  handleGmailCallback,
  getGmailStatus,
  disconnectGmail
};