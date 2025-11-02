import express from 'express';
import {
  getCalendarAnalytics,
  getUserEngagement,
  getProductivityInsights
} from '../controllers/analyticsController.js';

const router = express.Router();

// Analytics routes
router.get('/calendar', getCalendarAnalytics);
router.get('/engagement', getUserEngagement);
router.get('/productivity', getProductivityInsights);

export default router;