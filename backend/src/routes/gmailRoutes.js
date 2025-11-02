const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Gmail API routes
router.get('/auth-url', (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    });
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ success: false, error: 'Failed to generate auth URL' });
  }
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in your database associated with the user
    // This is just an example - implement your own token storage
    await storeUserTokens(req.user.id, tokens);

    res.redirect(`${process.env.FRONTEND_URL}?gmail_connected=true`);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}?gmail_error=true`);
  }
});

router.get('/status', async (req, res) => {
  try {
    const tokens = await getUserTokens(req.user.id);
    if (!tokens) {
      return res.json({ success: true, connected: false });
    }

    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Test the connection by getting user profile
    await gmail.users.getProfile({ userId: 'me' });
    
    res.json({ success: true, connected: true });
  } catch (error) {
    console.error('Error checking Gmail status:', error);
    res.json({ success: true, connected: false });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    await removeUserTokens(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect Gmail' });
  }
});

router.post('/sync-events', async (req, res) => {
  try {
    const tokens = await getUserTokens(req.user.id);
    if (!tokens) {
      return res.status(401).json({ success: false, error: 'Not connected to Gmail' });
    }

    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events from user's primary calendar
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items.map(event => ({
      id: event.id,
      title: event.summary,
      description: event.description,
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      location: event.location,
      is_all_day: !event.start.dateTime,
      color: event.colorId,
      source: 'gmail'
    }));

    // Store or update events in your database
    await syncCalendarEvents(req.user.id, events);

    res.json({ success: true, events });
  } catch (error) {
    console.error('Error syncing events:', error);
    res.status(500).json({ success: false, error: 'Failed to sync events' });
  }
});

// Helper functions for token management (implement these according to your database structure)
async function storeUserTokens(userId, tokens) {
  // Store tokens in your database
  // Example: await db.userTokens.upsert({ userId, tokens })
}

async function getUserTokens(userId) {
  // Retrieve tokens from your database
  // Example: return await db.userTokens.findOne({ where: { userId } })
}

async function removeUserTokens(userId) {
  // Remove tokens from your database
  // Example: await db.userTokens.destroy({ where: { userId } })
}

async function syncCalendarEvents(userId, events) {
  // Sync events with your database
  // Example: await db.events.bulkUpsert(events.map(e => ({ ...e, userId })))
}

module.exports = router;