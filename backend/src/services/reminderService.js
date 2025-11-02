import cron from 'node-cron';
import EventModel from '../models/eventModel.js';
import UserModel from '../models/userModel.js';
import emailService from './emailService.js';

const reminderTimers = new Map();

/**
 * Check and send reminders for upcoming events
 */
const checkReminders = async () => {
  try {
    const now = new Date();
    
    // Get all upcoming events that need reminders
    const events = EventModel.getUpcomingReminders() || [];

    for (const event of events) {
      try {
        if (!event || !event.start_time || !event.reminder_minutes) {
          continue;
        }

        const eventStart = new Date(event.start_time);
        const reminderMinutes = parseInt(event.reminder_minutes) || 0;
        
        if (isNaN(eventStart.getTime()) || reminderMinutes <= 0) {
          continue;
        }

        const reminderTime = new Date(eventStart.getTime() - reminderMinutes * 60000);

        // Check if reminder should be sent now (within 1 minute window)
        const timeDiff = reminderTime - now;
        const isReminderDue = timeDiff > 0 && timeDiff <= 60000;

        if (isReminderDue) {
          console.log(`📧 Sending reminder for: ${event.title}`);
          
          // Get user to check their email preferences
          const user = UserModel.findByEmail(event.user_email);
          
          if (user && user.gmail_connected) {
            // Send to connected Gmail
            const result = await emailService.sendEventReminder(event, user.email);
            
            if (result && result.success) {
              EventModel.markReminderSent(event.id);
              console.log(`✅ Reminder sent to: ${user.email}`);
            }
          } else {
            // Send to system email if configured
            const systemEmail = process.env.GMAIL_USER;
            if (systemEmail) {
              const result = await emailService.sendEventReminder(event, systemEmail);
              if (result && result.success) {
                EventModel.markReminderSent(event.id);
              }
            }
          }
        }
      } catch (eventError) {
        console.error(`Error processing reminder for event ${event.id}:`, eventError.message);
      }
    }
  } catch (error) {
    console.error('❌ Reminder check failed:', error.message);
  }
};

/**
 * Schedule a specific reminder for an event
 */
export const scheduleReminder = (event, userEmail) => {
  try {
    if (!event || !event.reminder_minutes || event.reminder_minutes === 0) {
      return { success: false, message: 'No reminder set' };
    }

    if (!event.start_time || !userEmail) {
      return { success: false, message: 'Invalid event data or user email' };
    }

    const eventStart = new Date(event.start_time);
    const reminderMinutes = parseInt(event.reminder_minutes) || 0;
    
    if (isNaN(eventStart.getTime()) || reminderMinutes <= 0) {
      return { success: false, message: 'Invalid event time or reminder minutes' };
    }

    const reminderTime = new Date(eventStart.getTime() - reminderMinutes * 60000);
    const now = new Date();

    if (reminderTime <= now) {
      return { success: false, message: 'Reminder time has passed' };
    }

    const timeDiff = reminderTime - now;

    // Prevent memory leaks with very long timeouts (max 24 hours)
    const maxTimeout = 24 * 60 * 60 * 1000; // 24 hours
    if (timeDiff > maxTimeout) {
      return { success: false, message: 'Reminder too far in the future' };
    }

    // Cancel existing timer if any
    const timerKey = `timer-${event.id}`;
    if (reminderTimers.has(timerKey)) {
      clearTimeout(reminderTimers.get(timerKey));
    }

    // Set timeout for reminder
    const timerId = setTimeout(async () => {
      try {
        console.log(`📧 Scheduled reminder triggered for: ${event.title}`);
        await emailService.sendEventReminder(event, userEmail);
        EventModel.markReminderSent(event.id);
      } catch (error) {
        console.error('Error sending scheduled reminder:', error.message);
      } finally {
        reminderTimers.delete(timerKey);
      }
    }, timeDiff);

    reminderTimers.set(timerKey, timerId);

    console.log(`⏰ Reminder scheduled for "${event.title}" at ${reminderTime.toLocaleString()}`);

    return {
      success: true,
      reminderTime: reminderTime.toISOString(),
      message: `Reminder scheduled for ${reminderMinutes} minutes before event`
    };
  } catch (error) {
    console.error('Schedule reminder error:', error.message);
    return { success: false, message: 'Failed to schedule reminder' };
  }
};

/**
 * Cancel a scheduled reminder
 */
export const cancelReminder = (eventId) => {
  const timerKey = `timer-${eventId}`;
  
  if (reminderTimers.has(timerKey)) {
    clearTimeout(reminderTimers.get(timerKey));
    reminderTimers.delete(timerKey);
    console.log(`🚫 Reminder cancelled for event ${eventId}`);
    return { success: true };
  }

  return { success: false, message: 'No active reminder found' };
};

/**
 * Initialize reminder service with cron jobs
 */
export const initializeReminderService = () => {
  console.log('🔔 Initializing reminder service...');

  // Check for reminders every minute
  cron.schedule('* * * * *', () => {
    checkReminders();
  });

  // Clean up old timers daily at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('🧹 Cleaning up old reminder timers...');
    reminderTimers.clear();
  });

  console.log('✅ Reminder service started');
  console.log('   - Checking reminders every minute');
  console.log('   - Cleaning timers daily at midnight\n');
};

export default {
  scheduleReminder,
  cancelReminder,
  initializeReminderService
};
