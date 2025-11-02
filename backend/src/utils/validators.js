// Validation utilities

export const validateEvent = (eventData) => {
  const errors = [];

  // Required fields
  if (!eventData.title || eventData.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!eventData.start_time) {
    errors.push('Start time is required');
  }

  if (!eventData.end_time) {
    errors.push('End time is required');
  }

  // Validate dates
  if (eventData.start_time && eventData.end_time) {
    const start = new Date(eventData.start_time);
    const end = new Date(eventData.end_time);

    if (isNaN(start.getTime())) {
      errors.push('Invalid start time format');
    }

    if (isNaN(end.getTime())) {
      errors.push('Invalid end time format');
    }

    if (start >= end) {
      errors.push('End time must be after start time');
    }
  }

  // Validate color format
  if (eventData.color && !/^#[0-9A-F]{6}$/i.test(eventData.color)) {
    errors.push('Invalid color format. Use hex format (#RRGGBB)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// XSS protection function
const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sanitizeEvent = (eventData) => {
  try {
    return {
      title: escapeHtml(eventData.title?.trim()),
      description: escapeHtml(eventData.description?.trim()) || null,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      location: escapeHtml(eventData.location?.trim()) || null,
      color: eventData.color || '#1967d2',
      is_all_day: Boolean(eventData.is_all_day),
      recurrence_rule: eventData.recurrence_rule || null,
      recurrence_end_date: eventData.recurrence_end_date || null,
      timezone: eventData.timezone || 'UTC',
      reminder_minutes: parseInt(eventData.reminder_minutes) || 30,
      user_email: escapeHtml(eventData.user_email) || 'default@user.com'
    };
  } catch (error) {
    console.error('Error sanitizing event data:', error.message);
    throw new Error('Invalid event data');
  }
};
