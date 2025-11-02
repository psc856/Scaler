import EventModel from '../models/eventModel.js';
import AIModel from '../models/aiModel.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import aiService from '../services/aiService.js';

/**
 * ============================================================================
 * 🔹 LLM-POWERED ENDPOINTS (Production AI Features)
 * ============================================================================
 */

/**
 * AI-powered title suggestions using LLM
 * POST /api/ai/suggest-title?context=team
 */
export const suggestEventTitle = asyncHandler(async (req, res) => {
  const { context } = req.query;
  
  if (!context || context.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Context must be at least 2 characters'
    });
  }

  const allEvents = EventModel.getAll();
  
  // Call AI service (LLM + fallback)
  const suggestions = await aiService.generateTitleSuggestions(context, allEvents);

  // Save suggestions to database for learning
  if (suggestions && suggestions.length > 0) {
    suggestions.forEach(suggestion => {
      try {
        AIModel.saveSuggestion({
          suggestion_text: suggestion.title,
          context: JSON.stringify({ 
            userInput: context, 
            confidence: suggestion.confidence 
          })
        });
      } catch (err) {
        console.error('Error saving suggestion:', err);
      }
    });
  }

  res.status(200).json({
    success: true,
    count: suggestions.length,
    data: suggestions,
    aiModel: process.env.GROQ_API_KEY ? 'Llama-3.3-70B' : (process.env.OPENAI_API_KEY ? 'GPT-3.5-Turbo' : 'Rule-Based')
  });
});

/**
 * AI-powered optimal time finder
 * GET /api/ai/suggest-time?duration=60&context=meeting
 */
export const suggestOptimalTime = asyncHandler(async (req, res) => {
  const { duration = 60, context } = req.query;
  const events = EventModel.getAll();

  // Call AI service with LLM reasoning
  const optimalSlot = await aiService.findOptimalTimeSlot(
    events,
    parseInt(duration),
    context || ''
  );

  // Save suggestion
  try {
    AIModel.saveSuggestion({
      suggestion_text: `Optimal time: ${optimalSlot.aiReasoning || 'Next available slot'}`,
      suggested_time: optimalSlot.start,
      suggested_duration: parseInt(duration),
      context: JSON.stringify({
        confidence: optimalSlot.confidence || 0.7,
        reasoning: optimalSlot.aiReasoning || 'Rule-based suggestion'
      })
    });
  } catch (err) {
    console.error('Error saving suggestion:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Optimal time calculated using AI',
    data: {
      suggested_start: optimalSlot.start,
      suggested_end: optimalSlot.end,
      duration: parseInt(duration),
      aiReasoning: optimalSlot.aiReasoning || 'Next available time slot',
      confidence: optimalSlot.confidence || 0.7,
      alternatives: optimalSlot.alternatives || []
    },
    aiModel: process.env.GROQ_API_KEY ? 'Llama-3.3-70B' : (process.env.OPENAI_API_KEY ? 'GPT-3.5-Turbo' : 'Rule-Based')
  });
});

/**
 * AI-powered calendar insights (NEW - Best endpoint)
 * GET /api/ai/insights
 */
export const getSmartInsights = asyncHandler(async (req, res) => {
  const events = EventModel.getAll();
  const insights = await aiService.generateSmartInsights(events);

  res.status(200).json({
    success: true,
    count: insights.length,
    data: insights,
    aiModel: process.env.GROQ_API_KEY ? 'Llama-3.3-70B' : (process.env.OPENAI_API_KEY ? 'GPT-3.5-Turbo' : 'Rule-Based')
  });
});

/**
 * ============================================================================
 * 🔹 BACKWARD COMPATIBLE ENDPOINTS (Legacy Support)
 * ============================================================================
 */

/**
 * Legacy smart suggestions endpoint
 * GET /api/ai/suggestions
 */
export const getSmartSuggestions = asyncHandler(async (req, res) => {
  const events = EventModel.getAll();
  const insights = await aiService.generateSmartInsights(events);

  res.status(200).json({
    success: true,
    count: insights.length,
    data: insights,
    aiModel: process.env.GROQ_API_KEY ? 'Llama-3.3-70B' : 'Rule-Based'
  });
});

/**
 * Analyze calendar patterns with AI
 * GET /api/ai/analyze-patterns?start_date=2025-01-01&end_date=2025-12-31
 */
export const analyzePatterns = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;
  let events = EventModel.getAll();

  // Filter by date range if provided
  if (start_date && end_date) {
    events = events.filter(e => {
      try {
        const eventDate = new Date(e.start_time);
        const start = new Date(start_date);
        const end = new Date(end_date);
        return eventDate >= start && eventDate <= end;
      } catch {
        return false;
      }
    });
  }

  // Use AI service for analysis
  const insights = await aiService.generateSmartInsights(events);

  res.status(200).json({
    success: true,
    message: 'Calendar patterns analyzed with AI',
    data: {
      insights: insights, // Array of insights
      totalEvents: events.length,
      dateRange: start_date && end_date ? { start_date, end_date } : null
    },
    aiModel: process.env.GROQ_API_KEY ? 'Llama-3.3-70B' : 'Rule-Based'
  });
});

/**
 * Fetch AI suggestion history from database
 * GET /api/ai/suggestions-history
 */
export const getSuggestionsHistory = asyncHandler(async (req, res) => {
  const suggestions = AIModel.getAllSuggestions();

  res.status(200).json({
    success: true,
    count: suggestions.length,
    data: suggestions
  });
});

/**
 * Get all conflict records
 * GET /api/ai/conflicts
 */
export const getConflicts = asyncHandler(async (req, res) => {
  const conflicts = AIModel.getAllConflicts();

  res.status(200).json({
    success: true,
    count: conflicts.length,
    data: conflicts
  });
});

/**
 * ============================================================================
 * 🔹 ALTERNATIVE ENDPOINTS (Classic/Fallback Methods)
 * ============================================================================
 */

/**
 * Simple heuristic-based title suggestion (no AI)
 * GET /api/ai/suggest-title-classic?context=team
 */
export const suggestEventTitleClassic = asyncHandler(async (req, res) => {
  const { context } = req.query;
  const allEvents = EventModel.getAll();

  // Frequency analysis of past titles
  const titleWords = {};
  allEvents.forEach(event => {
    if (event.title) {
      const words = event.title.toLowerCase().split(' ');
      words.forEach(word => {
        const cleanWord = word.replace(/[^a-z]/g, '');
        if (cleanWord.length > 3) {
          titleWords[cleanWord] = (titleWords[cleanWord] || 0) + 1;
        }
      });
    }
  });

  // Get top 5 most common words
  let suggestions = Object.entries(titleWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({
      suggestion: word.charAt(0).toUpperCase() + word.slice(1),
      frequency: count
    }));

  // Add context-based suggestions
  if (context) {
    const contextLower = context.toLowerCase();
    const contextSuggestions = [];
    
    if (contextLower.includes('meet')) {
      contextSuggestions.push({ suggestion: 'Team Meeting', frequency: 0 });
    }
    if (contextLower.includes('call')) {
      contextSuggestions.push({ suggestion: 'Phone Call', frequency: 0 });
    }
    if (contextLower.includes('review')) {
      contextSuggestions.push({ suggestion: 'Review Session', frequency: 0 });
    }
    if (contextLower.includes('standup')) {
      contextSuggestions.push({ suggestion: 'Daily Standup', frequency: 0 });
    }
    
    suggestions = [...contextSuggestions, ...suggestions].slice(0, 5);
  }

  res.status(200).json({
    success: true,
    count: suggestions.length,
    data: suggestions,
    method: 'frequency-analysis'
  });
});

/**
 * Recommend time slots (heuristic-based)
 * GET /api/ai/recommend-slots?date=2025-11-05&duration=60&count=3
 */
export const recommendTimeSlots = asyncHandler(async (req, res) => {
  const { date, duration = 60, count = 3 } = req.query;
  
  // Parse target date
  const targetDate = date ? new Date(date) : new Date();
  if (isNaN(targetDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  const events = EventModel.getAll();
  const recommendations = [];
  const workingHours = { start: 9, end: 17 };
  const parsedDuration = parseInt(duration);
  const maxCount = parseInt(count);

  // Check each hour in working hours
  for (let hour = workingHours.start; hour < workingHours.end; hour++) {
    const slotStart = new Date(targetDate);
    slotStart.setHours(hour, 0, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + parsedDuration);

    // Skip if slot extends beyond working hours
    if (slotEnd.getHours() >= workingHours.end) {
      continue;
    }

    // Check for conflicts
    const conflicts = EventModel.checkConflicts(
      slotStart.toISOString(),
      slotEnd.toISOString()
    );

    if (conflicts.length === 0) {
      recommendations.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        day: slotStart.toLocaleDateString('en-US', { weekday: 'long' }),
        time: slotStart.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        score: 100,
        reason: 'No conflicts - Available slot'
      });

      if (recommendations.length >= maxCount) {
        break;
      }
    }
  }

  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: recommendations,
    method: 'constraint-satisfaction'
  });
});

/**
 * ============================================================================
 * EXPORTS
 * ============================================================================
 */

export default {
  // AI-Powered (Primary)
  suggestEventTitle,
  suggestOptimalTime,
  getSmartInsights,
  
  // Legacy/Backward Compatible
  getSmartSuggestions,
  analyzePatterns,
  getSuggestionsHistory,
  getConflicts,
  
  // Classic/Fallback
  suggestEventTitleClassic,
  recommendTimeSlots
};
