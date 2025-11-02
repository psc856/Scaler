import api from './api';
import { toast } from 'react-toastify';

class AIService {
  // Get smart suggestions
  async getSmartSuggestions(duration = null, date = null) {
    const params = {};
    if (duration) params.duration = duration;
    if (date) params.date = date;

    try {
      const response = await api.get('/ai/suggestions', { params });
      return response.data || response;
    } catch (error) {
      console.error('Get suggestions error:', error);
      return { success: false, data: [] };
    }
  }

  // Suggest optimal time for event
  async suggestOptimalTime(duration = 60, context = '') {
    const params = { duration };
    if (context) params.context = context;

    try {
      const response = await api.get('/ai/suggest-time', { params });
      return response;
    } catch (error) {
      console.error('Suggest optimal time error:', error);
      // Fallback to next hour
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      const end = new Date(now.getTime() + duration * 60000);
      
      return {
        success: true,
        data: {
          suggested_start: now.toISOString(),
          suggested_end: end.toISOString(),
          aiReasoning: 'Next available hour (AI unavailable)',
          confidence: 0.7
        }
      };
    }
  }

  // Suggest event title
  async suggestEventTitle(context = '', time = null) {
    if (!context || context.length < 2) {
      return this.generateFallbackSuggestions(context);
    }

    const params = { context };
    if (time) params.time = time;

    try {
      const response = await api.get('/ai/suggest-title', { params });
      console.log('Title suggestion response:', response);
      
      if (response.success && response.data) {
        return response;
      }
      
      return {
        success: true,
        data: this.generateFallbackSuggestions(context)
      };
    } catch (error) {
      console.error('Suggest title error:', error);
      return {
        success: true,
        data: this.generateFallbackSuggestions(context)
      };
    }
  }

  // Generate fallback suggestions
  generateFallbackSuggestions(context) {
    const baseSuggestions = [
      { title: 'Team Meeting', confidence: 0.8 },
      { title: 'Project Review', confidence: 0.7 },
      { title: 'Client Call', confidence: 0.7 },
      { title: 'Planning Session', confidence: 0.6 },
      { title: 'Status Update', confidence: 0.6 }
    ];

    if (context) {
      const contextLower = context.toLowerCase();
      if (contextLower.includes('team')) {
        return [
          { title: 'Team Meeting', confidence: 0.9 },
          { title: 'Team Standup', confidence: 0.8 },
          { title: 'Team Review', confidence: 0.7 }
        ];
      }
      if (contextLower.includes('client')) {
        return [
          { title: 'Client Call', confidence: 0.9 },
          { title: 'Client Meeting', confidence: 0.8 },
          { title: 'Client Review', confidence: 0.7 }
        ];
      }
      if (contextLower.includes('project')) {
        return [
          { title: 'Project Meeting', confidence: 0.9 },
          { title: 'Project Review', confidence: 0.8 },
          { title: 'Project Planning', confidence: 0.7 }
        ];
      }
    }

    return baseSuggestions.slice(0, 3);
  }

  // Recommend time slots
  async recommendTimeSlots(date, duration = 60, count = 3) {
    const params = { date, duration, count };
    
    try {
      const response = await api.get('/ai/recommend-slots', { params });
      return response.data || response;
    } catch (error) {
      console.error('Recommend slots error:', error);
      throw error;
    }
  }

  // Analyze calendar patterns
  async analyzePatterns(startDate = null, endDate = null) {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    try {
      const response = await api.get('/ai/analyze-patterns', { params });
      return response.data || response;
    } catch (error) {
      console.error('Analyze patterns error:', error);
      throw error;
    }
  }

  // Get suggestions history
  async getSuggestionsHistory() {
    try {
      const response = await api.get('/ai/suggestions-history');
      return response.data || response;
    } catch (error) {
      console.error('Get history error:', error);
      throw error;
    }
  }

  // Get all conflicts
  async getConflicts() {
    try {
      const response = await api.get('/ai/conflicts');
      return response.data || response;
    } catch (error) {
      console.error('Get conflicts error:', error);
      throw error;
    }
  }
}

export default new AIService();
