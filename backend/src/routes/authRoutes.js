import express from 'express';
import {
  getOrCreateUser,
  connectGmail,
  disconnectGmail,
  updateSettings,
  getUserByEmail
} from '../controllers/authController.js';

const router = express.Router();

// User management
router.post('/user', getOrCreateUser);
router.get('/user/:email', getUserByEmail);
router.put('/settings', updateSettings);

// Gmail routes
router.post('/gmail/connect', connectGmail);
router.post('/gmail/disconnect', disconnectGmail);
router.get('/gmail/status', (req, res) => {
  res.json({ success: true, connected: false, message: 'Gmail OAuth not configured' });
});
router.get('/gmail/auth-url', (req, res) => {
  res.json({ success: false, message: 'Gmail OAuth not configured' });
});

export default router;
