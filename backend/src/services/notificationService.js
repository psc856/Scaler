import EventModel from '../models/eventModel.js';
import emailService from './emailService.js';
import cron from 'node-cron';

class NotificationService {
  constructor() {
    this.scheduledJobs = new Map();
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    
    // Check for reminders every minute
    cron.schedule('* * * * *', () => {
      this.processReminders();
    });

    // Daily digest at 8 AM
    cron.schedule('0 8 * * *', () => {
      this.sendDailyDigest();
    });

    // Weekly summary on Sunday at 6 PM
    cron.schedule('0 18 * * 0', () => {
      this.sendWeeklyDigest();
    });

    this.isInitialized = true;
    console.log('✅ Notification service initialized');
  }

  async processReminders() {
    try {
      const now = new Date();
      const upcomingEvents = EventModel.getUpcomingReminders() || [];

      for (const event of upcomingEvents) {
        try {
          const eventStart = new Date(event.start_time);
          const reminderMinutes = parseInt(event.reminder_minutes) || 15;
          const reminderTime = new Date(eventStart.getTime() - (reminderMinutes * 60 * 1000));

          // Check if it's time to send reminder
          if (now >= reminderTime && now < eventStart) {
            await this.sendEventReminder(event);
            EventModel.markReminderSent(event.id);
          }
        } catch (eventError) {
          console.error(`Error processing reminder for event ${event.id}:`, eventError.message);
        }
      }
    } catch (error) {
      console.error('Error processing reminders:', error.message);
    }
  }

  async sendEventReminder(event) {
    try {
      if (!event || !event.title || !event.start_time) {
        throw new Error('Invalid event data');
      }

      const reminderData = {
        eventTitle: event.title,
        eventStart: new Date(event.start_time).toLocaleString(),
        eventLocation: event.location || 'No location specified',
        reminderMinutes: event.reminder_minutes || 15
      };

      // Send email reminder
      if (process.env.GMAIL_USER) {
        const result = await emailService.sendEventReminder(event, process.env.GMAIL_USER);
        if (!result.success) {
          throw new Error(result.message || 'Failed to send email');
        }
      }

      console.log(`📧 Reminder sent for event: ${event.title}`);
    } catch (error) {
      console.error('Error sending reminder:', error.message);
    }
  }

  async sendDailyDigest(userEmail = 'default@user.com') {
    try {
      if (!userEmail || typeof userEmail !== 'string') {
        throw new Error('Invalid user email');
      }

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const todayEvents = EventModel.getByDateRange(
        today.toISOString(),
        tomorrow.toISOString(),
        userEmail
      ) || [];

      if (todayEvents.length === 0) {
        console.log('No events today, skipping daily digest');
        return;
      }

      const digestData = {
        date: today.toLocaleDateString(),
        eventCount: todayEvents.length,
        events: todayEvents.map(event => ({
          title: event.title,
          time: new Date(event.start_time).toLocaleTimeString(),
          location: event.location || 'No location'
        }))
      };

      // Send daily digest email
      if (process.env.GMAIL_USER) {
        await emailService.sendDailyDigest(digestData, process.env.GMAIL_USER);
      }

      console.log(`📊 Daily digest sent for ${todayEvents.length} events`);
    } catch (error) {
      console.error('Error sending daily digest:', error);
    }
  }

  async sendWeeklyDigest(userEmail = 'default@user.com') {
    try {
      if (!userEmail || typeof userEmail !== 'string') {
        throw new Error('Invalid user email');
      }

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekEvents = EventModel.getByDateRange(
        weekStart.toISOString(),
        weekEnd.toISOString(),
        userEmail
      ) || [];

      const totalHours = weekEvents.reduce((sum, event) => {
        const duration = (new Date(event.end_time) - new Date(event.start_time)) / (1000 * 60 * 60);
        return sum + Math.max(0, duration);
      }, 0);

      const weeklyData = {
        weekStart: weekStart.toLocaleDateString(),
        weekEnd: weekEnd.toLocaleDateString(),
        totalEvents: weekEvents.length,
        totalHours: Math.round(totalHours * 10) / 10,
        avgPerDay: Math.round((weekEvents.length / 7) * 10) / 10,
        busiestDay: this.findBusiestDay(weekEvents)
      };

      // Send weekly digest email
      if (process.env.GMAIL_USER) {
        await emailService.sendWeeklyDigest(weeklyData, process.env.GMAIL_USER);
      }

      console.log(`📈 Weekly digest sent: ${weekEvents.length} events, ${totalHours}h total`);
    } catch (error) {
      console.error('Error sending weekly digest:', error);
    }
  }

  findBusiestDay(events) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = new Array(7).fill(0);

    events.forEach(event => {
      try {
        const day = new Date(event.start_time).getDay();
        dayCounts[day]++;
      } catch (error) {
        // Skip invalid dates
      }
    });

    const busiestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    return dayNames[busiestDayIndex] || 'N/A';
  }

  // Smart notification preferences
  async updateNotificationPreferences(userEmail, preferences) {
    // This would typically be stored in user settings
    const defaultPrefs = {
      emailReminders: true,
      dailyDigest: true,
      weeklyDigest: true,
      conflictAlerts: true,
      reminderMinutes: [15, 30, 60] // Multiple reminder options
    };

    // Merge with user preferences
    return { ...defaultPrefs, ...preferences };
  }

  // Send smart conflict alerts
  async sendConflictAlert(conflictingEvents, userEmail) {
    try {
      if (!Array.isArray(conflictingEvents) || conflictingEvents.length === 0) {
        return;
      }

      const alertData = {
        conflicts: conflictingEvents.map(conflict => {
          try {
            return {
              event1: conflict.event1_title || 'Unknown Event',
              event2: conflict.event2_title || 'Unknown Event',
              time: conflict.event1_start ? new Date(conflict.event1_start).toLocaleString() : 'Unknown Time'
            };
          } catch {
            return {
              event1: 'Unknown Event',
              event2: 'Unknown Event',
              time: 'Unknown Time'
            };
          }
        })
      };

      if (process.env.GMAIL_USER) {
        await emailService.sendConflictAlert(alertData, process.env.GMAIL_USER);
      }

      console.log(`⚠️ Conflict alert sent for ${conflictingEvents.length} conflicts`);
    } catch (error) {
      console.error('Error sending conflict alert:', error.message);
    }
  }

  shutdown() {
    // Clean up scheduled jobs
    this.scheduledJobs.forEach(job => job.destroy());
    this.scheduledJobs.clear();
    console.log('🔄 Notification service shutdown');
  }
}

export default new NotificationService();