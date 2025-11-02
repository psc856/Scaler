import EventModel from '../models/eventModel.js';
import AIModel from '../models/aiModel.js';
import UserModel from '../models/userModel.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeEvent } from '../utils/validators.js';
import { generateRecurringInstances } from '../utils/recurrenceUtils.js';
import emailService from '../services/emailService.js';
import reminderService from '../services/reminderService.js';

/**
 * Get all events
 * GET /api/events?start=2025-01-01&end=2025-12-31&user_email=user@example.com
 */
export const getEvents = asyncHandler(async (req, res) => {
  const { start, end, user_email } = req.query;
  const userEmail = user_email || 'default@user.com';

  let events;
  
  if (start && end) {
    events = EventModel.getByDateRange(start, end, userEmail);
    
    const processedEvents = [];
    
    for (const event of events) {
      if (event.recurrence_rule) {
        const instances = generateRecurringInstances(event, start, end);
        processedEvents.push(...instances);
      } else {
        processedEvents.push(event);
      }
    }
    
    events = processedEvents;
  } else {
    events = EventModel.getAll(userEmail);
  }

  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
});

/**
 * Get single event
 * GET /api/events/:id
 */
export const getEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = EventModel.getById(id);

  if (!event) {
    throw new AppError(404, `Event not found with id: ${id}`);
  }

  if (event.recurrence_rule) {
    const exceptions = EventModel.getExceptions(id);
    event.exceptions = exceptions;
  }

  res.status(200).json({
    success: true,
    data: event
  });
});

/**
 * Create event
 * POST /api/events
 */
export const createEvent = asyncHandler(async (req, res) => {
  const eventData = sanitizeEvent(req.body);

  // Check for conflicts
  let conflicts = [];
  if (!eventData.is_all_day) {
    conflicts = EventModel.checkConflicts(
      eventData.start_time,
      eventData.end_time,
      null,
      eventData.user_email || 'default@user.com'
    );

    if (conflicts.length > 0) {
      conflicts.forEach(conflict => {
        try {
          AIModel.logConflict({
            event1_id: conflict.id,
            event1_title: conflict.title,
            event1_start: conflict.start_time,
            event2_title: eventData.title,
            event2_start: eventData.start_time,
            conflict_type: 'time_overlap',
            resolved: false
          });
        } catch (err) {
          console.error('Error logging conflict:', err);
        }
      });
    }
  }

  // Create event
  const newEvent = EventModel.create(eventData);

  // Get user for email
  const userEmail = eventData.user_email || 'default@user.com';
  const user = UserModel.findByEmail(userEmail);

  // Send email if Gmail connected or system email configured
  if (user && user.gmail_connected) {
    try {
      await emailService.sendEventCreatedEmail(newEvent, user.email);
      console.log('✅ Confirmation email sent to connected Gmail');
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
    }
  } else if (process.env.GMAIL_USER) {
    try {
      await emailService.sendEventCreatedEmail(newEvent, process.env.GMAIL_USER);
      console.log('✅ Confirmation email sent to system email');
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
    }
  }

  // Schedule reminder
  if (newEvent.reminder_minutes > 0) {
    const emailToUse = user?.email || process.env.GMAIL_USER;
    if (emailToUse) {
      reminderService.scheduleReminder(newEvent, emailToUse);
    }
  }

  if (conflicts.length > 0) {
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent,
      warning: `This event overlaps with ${conflicts.length} existing event(s)`,
      conflicts: conflicts.map(c => ({
        id: c.id,
        title: c.title,
        start_time: c.start_time,
        end_time: c.end_time
      }))
    });
  } else {
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });
  }
});

/**
 * Update event
 * PUT /api/events/:id
 */
export const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const eventData = sanitizeEvent(req.body);

  const existingEvent = EventModel.getById(id);
  if (!existingEvent) {
    throw new AppError(404, `Event not found with id: ${id}`);
  }

  // Cancel old reminder
  if (existingEvent.reminder_minutes > 0) {
    reminderService.cancelReminder(id);
  }

  // Check conflicts
  let conflicts = [];
  if (!eventData.is_all_day) {
    conflicts = EventModel.checkConflicts(
      eventData.start_time,
      eventData.end_time,
      id,
      existingEvent.user_email
    );
  }

  // Update event
  const updatedEvent = EventModel.update(id, eventData);

  // Reschedule reminder
  if (updatedEvent.reminder_minutes > 0) {
    const user = UserModel.findByEmail(updatedEvent.user_email);
    const emailToUse = user?.email || process.env.GMAIL_USER;
    if (emailToUse) {
      reminderService.scheduleReminder(updatedEvent, emailToUse);
    }
  }

  if (conflicts.length > 0) {
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent,
      warning: `This event overlaps with ${conflicts.length} existing event(s)`,
      conflicts: conflicts.map(c => ({
        id: c.id,
        title: c.title,
        start_time: c.start_time,
        end_time: c.end_time
      }))
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });
  }
});

/**
 * Delete event
 * DELETE /api/events/:id
 */
export const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = EventModel.getById(id);
  if (!event) {
    throw new AppError(404, `Event not found with id: ${id}`);
  }

  // Cancel reminder
  if (event.reminder_minutes > 0) {
    reminderService.cancelReminder(id);
  }

  EventModel.delete(id);

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully',
    data: { id }
  });
});

/**
 * Check conflicts
 * GET /api/events/check-conflicts?start_time=...&end_time=...
 */
export const checkConflicts = asyncHandler(async (req, res) => {
  const { start_time, end_time, exclude_id, user_email } = req.query;

  if (!start_time || !end_time) {
    throw new AppError(400, 'start_time and end_time are required');
  }

  const conflicts = EventModel.checkConflicts(
    start_time,
    end_time,
    exclude_id ? parseInt(exclude_id) : null,
    user_email || 'default@user.com'
  );

  res.status(200).json({
    success: true,
    hasConflicts: conflicts.length > 0,
    count: conflicts.length,
    data: conflicts
  });
});

/**
 * Bulk delete events
 * POST /api/events/bulk-delete
 */
export const bulkDeleteEvents = asyncHandler(async (req, res) => {
  const { eventIds } = req.body;

  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    throw new AppError(400, 'eventIds array is required');
  }

  const deletedEvents = [];
  const notFoundIds = [];

  for (const id of eventIds) {
    const event = EventModel.getById(id);
    if (event) {
      // Cancel reminder
      if (event.reminder_minutes > 0) {
        reminderService.cancelReminder(id);
      }
      EventModel.delete(id);
      deletedEvents.push({ id, title: event.title });
    } else {
      notFoundIds.push(id);
    }
  }

  res.status(200).json({
    success: true,
    message: `Successfully deleted ${deletedEvents.length} event(s)`,
    data: {
      deleted: deletedEvents,
      notFound: notFoundIds
    }
  });
});

/**
 * Update recurring instance
 * PUT /api/events/:id/recurring-instance
 */
export const updateRecurringInstance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { exception_date, modifications } = req.body;

  if (!exception_date) {
    throw new AppError(400, 'exception_date is required');
  }

  const event = EventModel.getById(id);
  if (!event) {
    throw new AppError(404, `Event not found with id: ${id}`);
  }

  if (!event.recurrence_rule) {
    throw new AppError(400, 'Event is not recurring');
  }

  EventModel.addException(id, exception_date, modifications || {});

  res.status(200).json({
    success: true,
    message: 'Recurring instance updated successfully',
    data: { id, exception_date, modifications }
  });
});

/**
 * Delete recurring instance
 * DELETE /api/events/:id/recurring-instance
 */
export const deleteRecurringInstance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { exception_date } = req.body;

  if (!exception_date) {
    throw new AppError(400, 'exception_date is required');
  }

  const event = EventModel.getById(id);
  if (!event) {
    throw new AppError(404, `Event not found with id: ${id}`);
  }

  if (!event.recurrence_rule) {
    throw new AppError(400, 'Event is not recurring');
  }

  EventModel.addException(id, exception_date, { is_deleted: true });

  res.status(200).json({
    success: true,
    message: 'Recurring instance deleted successfully',
    data: { id, exception_date }
  });
});

export default {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  checkConflicts,
  bulkDeleteEvents,
  updateRecurringInstance,
  deleteRecurringInstance
};
