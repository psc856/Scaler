const express = require('express');
const router = express.Router();
const { validateRequest } = require('../middleware/validateRequest');
const reminderService = require('../services/reminderService');

// Get all shared reminders for the user
router.get('/shared', async (req, res) => {
  try {
    const reminders = await reminderService.getSharedReminders(req.user.id);
    res.json({ success: true, data: reminders });
  } catch (error) {
    console.error('Error fetching shared reminders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch shared reminders' });
  }
});

// Create a shared reminder
router.post('/', validateRequest(['title', 'date']), async (req, res) => {
  try {
    const reminder = await reminderService.createReminder({
      ...req.body,
      userId: req.user.id,
      isShared: true
    });
    res.json({ success: true, data: reminder });
  } catch (error) {
    console.error('Error creating shared reminder:', error);
    res.status(500).json({ success: false, error: 'Failed to create shared reminder' });
  }
});

// Update reminder status
router.patch('/:id/status', validateRequest(['status']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const reminder = await reminderService.updateReminderStatus(id, status, req.user.id);
    res.json({ success: true, data: reminder });
  } catch (error) {
    console.error('Error updating reminder status:', error);
    res.status(500).json({ success: false, error: 'Failed to update reminder status' });
  }
});

// Share reminder with users
router.post('/:id/share', validateRequest(['userEmails']), async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmails } = req.body;

    await reminderService.shareReminderWithUsers(id, userEmails, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sharing reminder:', error);
    res.status(500).json({ success: false, error: 'Failed to share reminder' });
  }
});

// Remove user from shared reminder
router.delete('/:id/share/:email', async (req, res) => {
  try {
    const { id, email } = req.params;

    await reminderService.removeUserFromReminder(id, email, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing user from reminder:', error);
    res.status(500).json({ success: false, error: 'Failed to remove user from reminder' });
  }
});

// Get reminder participants
router.get('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    
    const participants = await reminderService.getReminderParticipants(id, req.user.id);
    res.json({ success: true, data: participants });
  } catch (error) {
    console.error('Error fetching reminder participants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch participants' });
  }
});

// Subscribe to reminder notifications
router.post('/:id/subscribe', async (req, res) => {
  try {
    const { id } = req.params;
    
    await reminderService.subscribeToNotifications(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to subscribe to notifications' });
  }
});

// Unsubscribe from reminder notifications
router.post('/:id/unsubscribe', async (req, res) => {
  try {
    const { id } = req.params;
    
    await reminderService.unsubscribeFromNotifications(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to unsubscribe from notifications' });
  }
});

module.exports = router;