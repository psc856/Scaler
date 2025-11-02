import { format } from 'date-fns';

/**
 * AI Helper Functions for Smart Calendar Features
 * 
 * These functions analyze user's calendar patterns and suggest optimal times
 * using simple heuristic algorithms (no ML model required).
 */

/**
 * Find optimal time slot for a new event
 * Algorithm: Finds the first available time slot during working hours
 * that doesn't conflict with existing events
 * 
 * @param {Array} events - Existing calendar events
 * @param {number} duration - Desired event duration in minutes
 * @returns {Object} - Suggested start and end times
 */
export const suggestEventTime = (events, duration = 60) => {
  const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM
  const today = new Date();
  today.setHours(workingHours.start, 0, 0, 0);

  // Filter and sort upcoming events
  const sortedEvents = events
    .filter(e => new Date(e.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  let suggestedTime = new Date(today);
  
  // Ensure we start at the next available hour
  if (suggestedTime < new Date()) {
    suggestedTime = new Date();
    suggestedTime.setMinutes(0, 0, 0);
    suggestedTime.setHours(suggestedTime.getHours() + 1);
  }

  // Find first available slot
  for (const event of sortedEvents) {
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);

    // Check if there's enough time before this event
    if (suggestedTime < eventStart) {
      const availableMinutes = (eventStart - suggestedTime) / (1000 * 60);
      if (availableMinutes >= duration) {
        return {
          start: suggestedTime.toISOString(),
          end: new Date(suggestedTime.getTime() + duration * 60000).toISOString()
        };
      }
    }

    // Move to after this event
    suggestedTime = new Date(Math.max(suggestedTime, eventEnd));
  }

  // No conflicts found, return the suggested time
  return {
    start: suggestedTime.toISOString(),
    end: new Date(suggestedTime.getTime() + duration * 60000).toISOString()
  };
};

/**
 * Analyze user's calendar patterns
 * Extracts insights like most common meeting times, average duration, etc.
 * 
 * @param {Array} events - Calendar events to analyze
 * @returns {Object} - Pattern analysis results
 */
export const analyzeEventPatterns = (events) => {
  const patterns = {
    mostCommonTime: null,
    averageDuration: 0,
    busiestDay: null,
    totalEvents: events.length
  };

  if (events.length === 0) return patterns;

  // Calculate average duration
  const durations = events.map(e => {
    const start = new Date(e.start_time);
    const end = new Date(e.end_time);
    return (end - start) / (1000 * 60); // minutes
  });

  patterns.averageDuration = Math.round(
    durations.reduce((a, b) => a + b, 0) / durations.length
  );

  // Find most common hour
  const hourCounts = {};
  events.forEach(e => {
    const hour = new Date(e.start_time).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  if (Object.keys(hourCounts).length > 0) {
    const mostCommonHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b
    );
    const period = mostCommonHour >= 12 ? 'PM' : 'AM';
    const displayHour = mostCommonHour % 12 || 12;
    patterns.mostCommonTime = `${displayHour}:00 ${period}`;
  }

  // Find busiest day
  const dayCounts = {};
  events.forEach(e => {
    const day = format(new Date(e.start_time), 'EEEE, MMM d');
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  if (Object.keys(dayCounts).length > 0) {
    patterns.busiestDay = Object.keys(dayCounts).reduce((a, b) =>
      dayCounts[a] > dayCounts[b] ? a : b
    );
  }

  return patterns;
};

/**
 * Generate smart suggestions based on calendar analysis
 * 
 * @param {Array} events - Calendar events
 * @param {Object} userInput - Additional context from user
 * @returns {Array} - List of suggestions
 */
export const generateSmartSuggestions = (events, userInput) => {
  const suggestions = [];

  // Suggest optimal meeting time
  const optimalTime = suggestEventTime(events, 60);
  const startTime = new Date(optimalTime.start);
  const hour = startTime.getHours();
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  suggestions.push({
    type: 'optimal_time',
    text: `Best available time slot: ${displayHour}:${String(startTime.getMinutes()).padStart(2, '0')} ${period}`,
    data: optimalTime
  });

  // Analyze patterns
  const patterns = analyzeEventPatterns(events);
  if (patterns.averageDuration > 0) {
    suggestions.push({
      type: 'duration_suggestion',
      text: `Your typical meetings last ${patterns.averageDuration} minutes`,
      data: { duration: patterns.averageDuration }
    });
  }

  // Check for overbooked days
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEvents = events.filter(e => 
    format(new Date(e.start_time), 'yyyy-MM-dd') === today
  );

  if (todayEvents.length > 5) {
    suggestions.push({
      type: 'warning',
      text: `⚠️ You have ${todayEvents.length} events today. Consider rescheduling some to avoid burnout.`,
      data: { count: todayEvents.length }
    });
  }

  // Free time suggestion
  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.start_time) > now);
  
  if (upcomingEvents.length === 0) {
    suggestions.push({
      type: 'info',
      text: '✨ You have no upcoming events. Great time to schedule important tasks!',
      data: {}
    });
  }

  return suggestions;
};
