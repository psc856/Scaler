import AnalyticsService from '../services/analyticsService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import cacheService from '../services/cacheService.js';

/**
 * Get calendar analytics
 * GET /api/analytics/calendar?timeRange=30&user_email=user@example.com
 */
export const getCalendarAnalytics = asyncHandler(async (req, res) => {
  const { timeRange = 30, user_email = 'default@user.com' } = req.query;
  
  const cacheKey = `analytics:calendar:${user_email}:${timeRange}`;
  
  const analytics = await cacheService.cached(
    cacheKey,
    () => AnalyticsService.getCalendarAnalytics(user_email, parseInt(timeRange)),
    10 * 60 * 1000 // Cache for 10 minutes
  );

  res.status(200).json({
    success: true,
    data: analytics,
    meta: {
      timeRange: parseInt(timeRange),
      userEmail: user_email,
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * Get user engagement metrics
 * GET /api/analytics/engagement?user_email=user@example.com
 */
export const getUserEngagement = asyncHandler(async (req, res) => {
  const { user_email = 'default@user.com' } = req.query;
  
  const cacheKey = `analytics:engagement:${user_email}`;
  
  const engagement = await cacheService.cached(
    cacheKey,
    () => AnalyticsService.getUserEngagement(user_email),
    15 * 60 * 1000 // Cache for 15 minutes
  );

  res.status(200).json({
    success: true,
    data: engagement,
    meta: {
      userEmail: user_email,
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * Get productivity insights
 * GET /api/analytics/productivity?user_email=user@example.com
 */
export const getProductivityInsights = asyncHandler(async (req, res) => {
  const { user_email = 'default@user.com' } = req.query;
  
  const analytics = await AnalyticsService.getCalendarAnalytics(user_email, 30);
  
  const insights = {
    workloadBalance: {
      status: analytics.summary.totalHours > 25 ? 'overloaded' : 
              analytics.summary.totalHours < 10 ? 'light' : 'balanced',
      totalHours: analytics.summary.totalHours,
      recommendation: analytics.summary.totalHours > 25 
        ? 'Consider reducing meeting load and blocking focus time'
        : 'Good work-life balance maintained'
    },
    meetingEfficiency: {
      avgDuration: analytics.summary.avgDuration,
      shortMeetings: analytics.timeDistribution['Short (< 30min)'],
      longMeetings: analytics.timeDistribution['Extended (> 2h)'],
      recommendation: analytics.summary.avgDuration > 90 
        ? 'Consider shorter, more focused meetings'
        : 'Meeting durations are well-managed'
    },
    scheduleHealth: {
      conflicts: analytics.meetingPatterns.conflictCount,
      avgFreeTime: analytics.meetingPatterns.avgFreeTimeBlock,
      status: analytics.meetingPatterns.conflictCount > 0 ? 'needs-attention' : 'healthy'
    },
    peakProductivity: {
      hours: analytics.productivity.peakHours,
      busiestDay: analytics.productivity.busiestDay,
      recommendation: 'Schedule important tasks during peak hours for maximum efficiency'
    }
  };

  res.status(200).json({
    success: true,
    data: insights,
    meta: {
      userEmail: user_email,
      analysisDate: new Date().toISOString()
    }
  });
});

export default {
  getCalendarAnalytics,
  getUserEngagement,
  getProductivityInsights
};