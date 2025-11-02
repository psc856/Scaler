import EventModel from '../models/eventModel.js';
import db from '../config/database.js';

class AnalyticsService {
  // Get comprehensive calendar analytics
  static async getCalendarAnalytics(userEmail = 'default@user.com', timeRange = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - timeRange);

      const events = EventModel.getByDateRange(
        startDate.toISOString(),
        endDate.toISOString(),
        userEmail
      ) || [];

      return {
        summary: this.calculateSummaryStats(events),
        productivity: this.analyzeProductivityPatterns(events),
        timeDistribution: this.analyzeTimeDistribution(events),
        meetingPatterns: this.analyzeMeetingPatterns(events),
        recommendations: this.generateRecommendations(events)
      };
    } catch (error) {
      console.error('Error getting calendar analytics:', error.message);
      return {
        summary: { totalEvents: 0, totalHours: 0, avgDuration: 0, avgPerDay: 0 },
        productivity: { peakHours: [], busiestDay: 'Monday', hourlyDistribution: [], dailyDistribution: [] },
        timeDistribution: {},
        meetingPatterns: { conflictCount: 0, avgFreeTimeBlock: 0, longestFreeBlock: 0, recurringEventsCount: 0, recurringPercentage: 0 },
        recommendations: []
      };
    }
  }

  static calculateSummaryStats(events) {
    try {
      if (!Array.isArray(events)) return { totalEvents: 0, totalHours: 0, avgDuration: 0, avgPerDay: 0 };
      
      const totalEvents = events.length;
      const totalHours = events.reduce((sum, event) => {
        try {
          const duration = (new Date(event.end_time) - new Date(event.start_time)) / (1000 * 60 * 60);
          return sum + Math.max(0, duration);
        } catch {
          return sum;
        }
      }, 0);

      const avgDuration = totalEvents > 0 ? totalHours / totalEvents : 0;
      const avgPerDay = totalEvents / 30;

      return {
        totalEvents,
        totalHours: Math.round(totalHours * 10) / 10,
        avgDuration: Math.round(avgDuration * 10) / 10,
        avgPerDay: Math.round(avgPerDay * 10) / 10
      };
    } catch (error) {
      console.error('Error calculating summary stats:', error.message);
      return { totalEvents: 0, totalHours: 0, avgDuration: 0, avgPerDay: 0 };
    }
  }

  static analyzeProductivityPatterns(events) {
    const hourlyDistribution = new Array(24).fill(0);
    const dailyDistribution = new Array(7).fill(0);
    
    events.forEach(event => {
      try {
        const start = new Date(event.start_time);
        hourlyDistribution[start.getHours()]++;
        dailyDistribution[start.getDay()]++;
      } catch (error) {
        // Skip invalid dates
      }
    });

    const peakHours = hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    const busiestDay = dailyDistribution.indexOf(Math.max(...dailyDistribution));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      peakHours,
      busiestDay: dayNames[busiestDay],
      hourlyDistribution,
      dailyDistribution
    };
  }

  static analyzeTimeDistribution(events) {
    const categories = Object.create(null);
    categories['Short (< 30min)'] = 0;
    categories['Medium (30min - 1h)'] = 0;
    categories['Long (1h - 2h)'] = 0;
    categories['Extended (> 2h)'] = 0;

    events.forEach(event => {
      try {
        const duration = (new Date(event.end_time) - new Date(event.start_time)) / (1000 * 60);
        
        if (duration < 30) categories['Short (< 30min)']++;
        else if (duration <= 60) categories['Medium (30min - 1h)']++;
        else if (duration <= 120) categories['Long (1h - 2h)']++;
        else categories['Extended (> 2h)']++;
      } catch (error) {
        // Skip invalid events
      }
    });

    return categories;
  }

  static analyzeMeetingPatterns(events) {
    const conflicts = this.findTimeConflicts(events);
    const freeTimeBlocks = this.calculateFreeTime(events);
    const recurringEvents = events.filter(e => e.recurrence_rule).length;

    return {
      conflictCount: conflicts.length,
      avgFreeTimeBlock: freeTimeBlocks.avgBlock,
      longestFreeBlock: freeTimeBlocks.longest,
      recurringEventsCount: recurringEvents,
      recurringPercentage: events.length > 0 ? Math.round((recurringEvents / events.length) * 100) : 0
    };
  }

  static findTimeConflicts(events) {
    const conflicts = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        try {
          const start1 = new Date(event1.start_time);
          const end1 = new Date(event1.end_time);
          const start2 = new Date(event2.start_time);
          const end2 = new Date(event2.end_time);
          
          // Check for overlap
          if (start1 < end2 && start2 < end1) {
            conflicts.push({ event1: event1.id, event2: event2.id });
          }
        } catch (error) {
          // Skip invalid dates
        }
      }
    }
    
    return conflicts;
  }

  static calculateFreeTime(events) {
    if (events.length === 0) {
      return { avgBlock: 480, longest: 480 }; // 8 hours if no events
    }

    // Sort events by start time
    const sortedEvents = events
      .filter(e => {
        try {
          new Date(e.start_time);
          return true;
        } catch {
          return false;
        }
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    const freeBlocks = [];
    
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      try {
        const currentEnd = new Date(sortedEvents[i].end_time);
        const nextStart = new Date(sortedEvents[i + 1].start_time);
        const gap = (nextStart - currentEnd) / (1000 * 60); // minutes
        
        if (gap > 0) {
          freeBlocks.push(gap);
        }
      } catch (error) {
        // Skip invalid calculations
      }
    }

    const avgBlock = freeBlocks.length > 0 
      ? freeBlocks.reduce((sum, block) => sum + block, 0) / freeBlocks.length 
      : 0;
    
    const longest = freeBlocks.length > 0 ? Math.max(...freeBlocks) : 0;

    return {
      avgBlock: Math.round(avgBlock),
      longest: Math.round(longest)
    };
  }

  static generateRecommendations(events) {
    const recommendations = [];
    const stats = this.calculateSummaryStats(events);
    const patterns = this.analyzeProductivityPatterns(events);
    const meetingData = this.analyzeMeetingPatterns(events);

    // Meeting load recommendations
    if (stats.totalHours > 25) {
      recommendations.push({
        type: 'warning',
        category: 'workload',
        title: 'Heavy Meeting Load',
        message: `You have ${stats.totalHours}h of meetings. Consider blocking focus time.`,
        priority: 'high'
      });
    }

    // Productivity recommendations
    if (patterns.peakHours.length > 0) {
      const peakTime = patterns.peakHours[0];
      const period = peakTime >= 12 ? 'PM' : 'AM';
      const displayHour = peakTime % 12 || 12;
      
      recommendations.push({
        type: 'info',
        category: 'productivity',
        title: 'Optimize Peak Hours',
        message: `Your peak meeting time is ${displayHour}:00 ${period}. Schedule important tasks accordingly.`,
        priority: 'medium'
      });
    }

    // Conflict recommendations
    if (meetingData.conflictCount > 0) {
      recommendations.push({
        type: 'warning',
        category: 'scheduling',
        title: 'Schedule Conflicts',
        message: `You have ${meetingData.conflictCount} overlapping events. Review your calendar.`,
        priority: 'high'
      });
    }

    // Free time recommendations
    if (meetingData.avgFreeTimeBlock < 60) {
      recommendations.push({
        type: 'warning',
        category: 'balance',
        title: 'Limited Focus Time',
        message: 'Consider consolidating meetings to create longer focus blocks.',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  // Get user engagement metrics
  static async getUserEngagement(userEmail = 'default@user.com') {
    try {
      const events = EventModel.getAll(userEmail) || [];
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentEvents = events.filter(e => {
        try {
          return new Date(e.created_at) >= thirtyDaysAgo;
        } catch {
          return false;
        }
      });

      return {
        totalEvents: events.length,
        recentEvents: recentEvents.length,
        avgEventsPerWeek: Math.round((recentEvents.length / 4) * 10) / 10,
        lastActivity: events.length > 0 ? events[events.length - 1].created_at : null
      };
    } catch (error) {
      console.error('Error getting user engagement:', error.message);
      return {
        totalEvents: 0,
        recentEvents: 0,
        avgEventsPerWeek: 0,
        lastActivity: null
      };
    }
  }
}

export default AnalyticsService;