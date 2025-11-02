// AI-powered helper functions

export const suggestEventTime = (events, duration = 60) => {
  try {
    if (!Array.isArray(events)) {
      throw new Error('Events must be an array');
    }

    // Find free time slots based on existing events
    const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM
    const today = new Date();
    today.setHours(workingHours.start, 0, 0, 0);

    const sortedEvents = events
      .filter(e => {
        try {
          return e && e.start_time && new Date(e.start_time) >= new Date();
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

  // Find first available slot
  let suggestedTime = new Date(today);

    for (const event of sortedEvents) {
      try {
        const eventStart = new Date(event.start_time);
        const eventEnd = new Date(event.end_time);

        if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
          continue;
        }

        if (suggestedTime < eventStart) {
          // Check if there's enough time before this event
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
      } catch (error) {
        console.warn('Error processing event in time suggestion:', error.message);
        continue;
      }
    }

    return {
      start: suggestedTime.toISOString(),
      end: new Date(suggestedTime.getTime() + duration * 60000).toISOString()
    };
  } catch (error) {
    console.error('Error suggesting event time:', error.message);
    // Return a default time slot
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return {
      start: now.toISOString(),
      end: new Date(now.getTime() + duration * 60000).toISOString()
    };
  }
};

export const analyzeEventPatterns = (events) => {
  try {
    if (!Array.isArray(events)) {
      throw new Error('Events must be an array');
    }

    // Analyze user's event patterns
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

  const mostCommonHour = Object.keys(hourCounts).reduce((a, b) => 
    hourCounts[a] > hourCounts[b] ? a : b
  );
  patterns.mostCommonTime = `${mostCommonHour}:00`;

  // Find busiest day
  const dayCounts = {};
  events.forEach(e => {
    const day = new Date(e.start_time).toLocaleDateString();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  if (Object.keys(dayCounts).length > 0) {
    patterns.busiestDay = Object.keys(dayCounts).reduce((a, b) =>
      dayCounts[a] > dayCounts[b] ? a : b
    );
  }

    return patterns;
  } catch (error) {
    console.error('Error analyzing event patterns:', error.message);
    return {
      mostCommonTime: null,
      averageDuration: 0,
      busiestDay: null,
      totalEvents: 0
    };
  }
};

export const generateSmartSuggestions = (events, userInput) => {
  const suggestions = [];

  // Suggest optimal meeting time
  const optimalTime = suggestEventTime(events, 60);
  suggestions.push({
    type: 'optimal_time',
    text: `Best available time: ${new Date(optimalTime.start).toLocaleTimeString()}`,
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
  const today = new Date().toLocaleDateString();
  const todayEvents = events.filter(e => 
    new Date(e.start_time).toLocaleDateString() === today
  );

  if (todayEvents.length > 5) {
    suggestions.push({
      type: 'warning',
      text: `You have ${todayEvents.length} events today. Consider rescheduling some.`,
      data: { count: todayEvents.length }
    });
  }

  return suggestions;
};
