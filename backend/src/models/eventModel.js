import db from '../config/database.js';

class EventModel {
  static getAll(userEmail = 'default@user.com') {
    const events = db.find('events', { user_email: userEmail });
    return events.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }

  static getById(id) {
    try {
      if (!id) {
        throw new Error('Event ID is required');
      }
      const eventId = parseInt(id);
      if (isNaN(eventId)) {
        throw new Error('Invalid event ID');
      }
      return db.get('events', eventId);
    } catch (error) {
      console.error('Error getting event by ID:', error.message);
      return null;
    }
  }

  static getByDateRange(startDate, endDate, userEmail = 'default@user.com') {
    try {
      if (!startDate || !endDate) {
        throw new Error('Start and end dates are required');
      }
      
      const events = db.find('events', { user_email: userEmail }) || [];
      return events
        .filter(event => {
          try {
            const eventStart = new Date(event.start_time);
            const rangeStart = new Date(startDate);
            const rangeEnd = new Date(endDate);
            
            if (isNaN(eventStart.getTime()) || isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
              return false;
            }
            
            return eventStart >= rangeStart && eventStart <= rangeEnd;
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            return new Date(a.start_time) - new Date(b.start_time);
          } catch {
            return 0;
          }
        });
    } catch (error) {
      console.error('Error getting events by date range:', error.message);
      return [];
    }
  }

  static create(eventData) {
    try {
      if (!eventData || !eventData.title || !eventData.start_time || !eventData.end_time) {
        throw new Error('Required event data missing: title, start_time, end_time');
      }

      // Validate dates
      const startTime = new Date(eventData.start_time);
      const endTime = new Date(eventData.end_time);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error('Invalid date format');
      }
      
      if (startTime >= endTime) {
        throw new Error('End time must be after start time');
      }

      const newEvent = {
        user_email: eventData.user_email || 'default@user.com',
        title: eventData.title,
        description: eventData.description || null,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        location: eventData.location || null,
        color: eventData.color || '#1967d2',
        is_all_day: eventData.is_all_day || false,
        recurrence_rule: eventData.recurrence_rule || null,
        timezone: eventData.timezone || 'UTC',
        reminder_minutes: Math.max(0, parseInt(eventData.reminder_minutes) || 30),
        reminder_sent: false
      };

      return db.insert('events', newEvent);
    } catch (error) {
      console.error('Error creating event:', error.message);
      return null;
    }
  }

  static update(id, eventData) {
    try {
      if (!id || !eventData) {
        throw new Error('Event ID and data are required');
      }

      const eventId = parseInt(id);
      if (isNaN(eventId)) {
        throw new Error('Invalid event ID');
      }

      // Validate dates if provided
      if (eventData.start_time && eventData.end_time) {
        const startTime = new Date(eventData.start_time);
        const endTime = new Date(eventData.end_time);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          throw new Error('Invalid date format');
        }
        
        if (startTime >= endTime) {
          throw new Error('End time must be after start time');
        }
      }

      const updates = {
        title: eventData.title,
        description: eventData.description || null,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        location: eventData.location || null,
        color: eventData.color || '#1967d2',
        is_all_day: eventData.is_all_day || false,
        recurrence_rule: eventData.recurrence_rule || null,
        timezone: eventData.timezone || 'UTC',
        reminder_minutes: Math.max(0, parseInt(eventData.reminder_minutes) || 30),
        reminder_sent: eventData.reminder_sent || false
      };

      return db.update('events', eventId, updates);
    } catch (error) {
      console.error('Error updating event:', error.message);
      return null;
    }
  }

  static delete(id) {
    return db.delete('events', parseInt(id));
  }

  static checkConflicts(startTime, endTime, excludeId = null, userEmail = 'default@user.com') {
    const events = db.find('events', { user_email: userEmail });
    
    return events.filter(event => {
      if (event.is_all_day) return false;
      if (excludeId && event.id === parseInt(excludeId)) return false;
      
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      const checkStart = new Date(startTime);
      const checkEnd = new Date(endTime);
      
      return (
        (eventStart < checkEnd && eventEnd > checkStart) ||
        (eventStart >= checkStart && eventStart < checkEnd) ||
        (eventEnd > checkStart && eventEnd <= checkEnd)
      );
    });
  }

  static getUpcomingReminders(userEmail = 'default@user.com') {
    const now = new Date();
    const events = db.find('events', { user_email: userEmail });
    
    return events
      .filter(event => {
        const eventStart = new Date(event.start_time);
        return eventStart > now && 
               event.reminder_minutes > 0 && 
               !event.reminder_sent;
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }

  static markReminderSent(id) {
    try {
      if (!id) {
        throw new Error('Event ID is required');
      }
      const eventId = parseInt(id);
      if (isNaN(eventId)) {
        throw new Error('Invalid event ID');
      }
      return db.update('events', eventId, { reminder_sent: true });
    } catch (error) {
      console.error('Error marking reminder sent:', error.message);
      return null;
    }
  }

  static addException(eventId, exceptionDate, modifications) {
    try {
      if (!eventId || !exceptionDate) {
        throw new Error('Event ID and exception date are required');
      }

      const parsedEventId = parseInt(eventId);
      if (isNaN(parsedEventId)) {
        throw new Error('Invalid event ID');
      }

      const exception = {
        event_id: parsedEventId,
        exception_date: exceptionDate,
        new_start_time: modifications?.new_start_time || null,
        new_end_time: modifications?.new_end_time || null,
        is_deleted: modifications?.is_deleted || false
      };

      return db.insert('event_exceptions', exception);
    } catch (error) {
      console.error('Error adding event exception:', error.message);
      return null;
    }
  }

  static getExceptions(eventId) {
    return db.find('event_exceptions', { event_id: parseInt(eventId) });
  }
}

export default EventModel;