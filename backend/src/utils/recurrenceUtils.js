// Utility functions for handling recurring events

export const parseRecurrenceRule = (rrule) => {
  try {
    // Parse RRULE format: FREQ=DAILY;INTERVAL=1;COUNT=10
    if (!rrule || typeof rrule !== 'string') return null;

    const parts = rrule.split(';');
    const rules = {};

    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        rules[key] = value;
      }
    });

    return rules;
  } catch (error) {
    console.error('Error parsing recurrence rule:', error.message);
    return null;
  }
};

export const generateRecurringInstances = (event, startDate, endDate) => {
  try {
    const instances = [];
    
    if (!event || !event.recurrence_rule) {
      return event ? [event] : [];
    }

    const rules = parseRecurrenceRule(event.recurrence_rule);
    if (!rules || !rules.FREQ) {
      return [event];
    }

    const frequency = rules.FREQ; // DAILY, WEEKLY, MONTHLY, YEARLY
    const interval = parseInt(rules.INTERVAL) || 1;
    const count = Math.min(parseInt(rules.COUNT) || 100, 100); // Limit to 100 instances for performance
  
  const eventStart = new Date(event.start_time);
  const eventEnd = new Date(event.end_time);
  const duration = eventEnd - eventStart;

  let currentDate = new Date(eventStart);
  let instanceCount = 0;

  const queryStart = new Date(startDate);
  const queryEnd = new Date(endDate);

    while (instanceCount < count && currentDate <= queryEnd) {
      // Safety check to prevent infinite loops
      if (instanceCount > 1000) {
        console.warn('Recurrence generation stopped: too many instances');
        break;
      }

      if (currentDate >= queryStart) {
        const instanceEnd = new Date(currentDate.getTime() + duration);
        
        instances.push({
          ...event,
          id: `${event.id}_${currentDate.toISOString()}`,
          start_time: currentDate.toISOString(),
          end_time: instanceEnd.toISOString(),
          is_recurring_instance: true,
          parent_id: event.id
        });
      }

    // Increment based on frequency
    switch (frequency) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + (7 * interval));
        break;
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case 'YEARLY':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
      default:
        return instances;
    }

    instanceCount++;

    // Check end date
    if (event.recurrence_end_date && currentDate > new Date(event.recurrence_end_date)) {
      break;
    }
  }

    return instances;
  } catch (error) {
    console.error('Error generating recurring instances:', error.message);
    return event ? [event] : [];
  }
};

export const createRecurrenceRule = (frequency, interval = 1, count = null, until = null) => {
  try {
    if (!frequency || !['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(frequency)) {
      throw new Error('Invalid frequency');
    }

    const safeInterval = Math.max(1, Math.min(parseInt(interval) || 1, 365));
    let rule = `FREQ=${frequency};INTERVAL=${safeInterval}`;
    
    if (count && count > 0) {
      const safeCount = Math.min(parseInt(count), 1000);
      rule += `;COUNT=${safeCount}`;
    }
    
    if (until) {
      rule += `;UNTIL=${until}`;
    }
    
    return rule;
  } catch (error) {
    console.error('Error creating recurrence rule:', error.message);
    return null;
  }
};
