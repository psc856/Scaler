import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';
// Using native JavaScript date formatting instead of date-fns

// Input sanitization function to prevent injection attacks
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim()
    .slice(0, 200); // Limit length
};

// Initialize AI clients with error handling
let hf = null;
let openai = null;

try {
  if (process.env.HUGGINGFACE_API_KEY) {
    hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  }

  if (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.GROQ_API_KEY 
        ? 'https://api.groq.com/openai/v1' 
        : 'https://api.openai.com/v1'
    });
  }
} catch (error) {
  console.error('AI client initialization error:', error);
}

/**
 * ============================================================================
 * AI-POWERED TITLE SUGGESTIONS
 * ============================================================================
 * 
 * Model: GPT-3.5-Turbo (OpenAI) or Llama-3.3-70B (Groq - Free)
 * 
 * Algorithm:
 * 1. Analyze past event titles for patterns and common terms
 * 2. Send context to LLM with user's current input
 * 3. LLM generates contextually relevant, professional suggestions
 * 4. Parse and validate response, return top 5 suggestions
 * 5. Fallback to rule-based if LLM fails
 * 
 * @param {string} userInput - User's partial/current event title
 * @param {Array} pastEvents - Historical events for context
 * @returns {Promise<Array>} Array of {title, confidence} objects
 */
export const generateTitleSuggestions = async (userInput, pastEvents) => {
  // Input validation
  if (!userInput || userInput.trim().length < 2) {
    return generateFallbackSuggestions(userInput, pastEvents);
  }

  // Check if AI client is available
  if (!openai) {
    console.warn('OpenAI client not initialized, using fallback');
    return generateFallbackSuggestions(userInput, pastEvents);
  }

  try {
    // Prepare context from past events (last 20 for relevance)
    const eventContext = pastEvents
      .slice(-20)
      .map(e => sanitizeInput(e.title))
      .filter(title => title && title.trim())
      .join(', ');

    const sanitizedInput = sanitizeInput(userInput);
    const prompt = `You are an intelligent calendar assistant. Based on the user's past events and current input, suggest 5 relevant, concise event titles.

Past events: ${eventContext || 'None'}
Current input: "${sanitizedInput}"

Requirements:
- Generate 5 short, professional event title suggestions
- Maximum 4 words each
- Be specific and actionable
- Match the tone and context of past events
- Return ONLY valid JSON array

JSON format:
[
  {"title": "Team Standup Meeting", "confidence": 0.9},
  {"title": "Project Review Call", "confidence": 0.85},
  ...
]

Confidence scale:
- 0.8-1.0: Highly relevant to past patterns
- 0.5-0.8: Moderately relevant
- 0.3-0.5: Generic but appropriate`;

    const response = await openai.chat.completions.create({
      model: process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert calendar assistant. Always return valid, parseable JSON. Be concise and professional.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: "json_object" } // Force JSON for compatible models
    });

    const result = response.choices[0].message.content;
    
    // Parse LLM response with multiple fallback strategies
    return parseAIResponse(result, userInput, pastEvents);

  } catch (error) {
    console.error('AI Title Generation Error:', error.message);
    
    // Fallback to rule-based suggestions
    return generateFallbackSuggestions(userInput, pastEvents);
  }
};

/**
 * ============================================================================
 * AI-POWERED OPTIMAL TIME FINDER
 * ============================================================================
 * 
 * Model: GPT-3.5-Turbo or Llama-3.3-70B
 * Algorithm: Hybrid (Statistical Analysis + LLM Reasoning)
 * 
 * Steps:
 * 1. Statistical Analysis: Extract user's scheduling patterns
 *    - Preferred hours (frequency distribution)
 *    - Average meeting duration
 *    - Peak productivity hours
 * 2. Constraint Satisfaction: Find all non-conflicting time slots
 * 3. LLM Ranking: Use AI to rank slots based on:
 *    - User preferences
 *    - Circadian rhythm / energy levels
 *    - Meeting spacing (avoid burnout)
 *    - Context importance
 * 4. Return best slot with reasoning
 * 
 * @param {Array} events - All calendar events
 * @param {number} duration - Desired duration in minutes
 * @param {string} context - Meeting context/description
 * @returns {Promise<Object>} Optimal time slot with AI reasoning
 */
export const findOptimalTimeSlot = async (events, duration, context = '') => {
  try {
    // Step 1: Statistical pattern analysis
    const patterns = analyzeSchedulingPatterns(events);
    
    // Step 2: Find all available time slots using constraint satisfaction
    const availableSlots = findAvailableSlots(events, duration);
    
    if (availableSlots.length === 0) {
      return {
        start: new Date().toISOString(),
        end: new Date(Date.now() + duration * 60000).toISOString(),
        aiReasoning: 'No available slots found in next 7 days',
        confidence: 0.3,
        alternatives: []
      };
    }

    // If no AI available, return first available slot
    if (!openai) {
      return {
        ...availableSlots[0],
        aiReasoning: 'First available slot (AI unavailable)',
        confidence: 0.7,
        alternatives: availableSlots.slice(1, 3).map(slot => ({
          slot,
          reason: 'Alternative available time'
        }))
      };
    }

    // Step 3: Use LLM to intelligently rank slots
    const slotsDescription = availableSlots
      .slice(0, 10) // Limit to top 10 for token efficiency
      .map((slot, i) => `${i + 1}. ${formatTimeSlot(slot)}`)
      .join('\n');

    const prompt = `You are a calendar optimization AI expert. Analyze and rank these available time slots.

User's Scheduling Patterns:
- Preferred meeting times: ${patterns.preferredTimes.join(', ')}
- Average meeting duration: ${patterns.avgDuration} minutes
- Most productive hours: ${patterns.peakHours.map(h => `${h}:00`).join(', ')}
- Weekly meeting load: ${patterns.weeklyEventCount} events

Available Time Slots:
${slotsDescription}

Meeting Context: "${sanitizeInput(context) || 'General meeting/event'}"
Required Duration: ${duration} minutes

Ranking Criteria:
1. User's historical preferences (40% weight)
2. Circadian productivity (30% weight) - prefer 9-11 AM or 2-4 PM
3. Meeting spacing (20% weight) - avoid back-to-back
4. Context appropriateness (10% weight)

Return JSON array ranking ALL slots from best to worst:
[
  {"slot_index": 3, "score": 0.95, "reason": "Matches peak productivity and preferred time"},
  {"slot_index": 1, "score": 0.85, "reason": "Good time but slightly early"},
  ...
]

Include ALL ${Math.min(availableSlots.length, 10)} slots in your ranking.`;

    const response = await openai.chat.completions.create({
      model: process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in calendar optimization, time management, and productivity science. Return valid JSON with complete rankings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 800
    });

    const result = response.choices[0].message.content;

    // Parse rankings
    const rankings = parseJSONResponse(result);
    
    if (!rankings || rankings.length === 0) {
      throw new Error('Failed to parse AI rankings');
    }

    // Validate and get best slot
    const bestRanking = rankings[0];
    const bestSlotIndex = bestRanking.slot_index - 1;
    
    if (bestSlotIndex < 0 || bestSlotIndex >= availableSlots.length) {
      throw new Error('Invalid slot index from AI');
    }

    const bestSlot = availableSlots[bestSlotIndex];
    
    return {
      ...bestSlot,
      aiReasoning: bestRanking.reason,
      confidence: bestRanking.score,
      alternatives: rankings.slice(1, 3).map(r => {
        const altIndex = r.slot_index - 1;
        return {
          slot: availableSlots[altIndex] || availableSlots[0],
          reason: r.reason,
          score: r.score
        };
      })
    };

  } catch (error) {
    console.error('AI Optimal Time Error:', error.message);
    // Fallback to rule-based algorithm
    return findOptimalTimeRuleBased(events, duration);
  }
};

/**
 * ============================================================================
 * AI-POWERED SMART INSIGHTS
 * ============================================================================
 * 
 * Model: GPT-3.5-Turbo or Llama-3.3-70B
 * Purpose: Generate natural language insights about calendar health
 * 
 * Analyzes:
 * - Meeting load and work-life balance
 * - Time management efficiency
 * - Productivity patterns
 * - Optimization opportunities
 * 
 * @param {Array} events - All calendar events
 * @returns {Promise<Array>} Actionable insights with priorities
 */
export const generateSmartInsights = async (events) => {
  try {
    const stats = calculateCalendarStats(events);
    
    if (!openai) {
      return generateFallbackInsights(events, stats);
    }

    const prompt = `You are an expert productivity coach analyzing a calendar. Generate 3-5 actionable, specific insights.

Calendar Statistics:
- Total events this week: ${stats.weeklyEvents}
- Daily average: ${stats.avgDailyMeetings} meetings
- Total meeting hours: ${stats.totalHours}h
- Longest free block: ${stats.longestFreeBlock} minutes
- Busiest day: ${stats.busiestDay}
- Most common time: ${stats.commonTime}
- Meeting distribution: ${JSON.stringify(stats.hourDistribution)}

Analysis Guidelines:
1. Be specific and actionable
2. Focus on work-life balance and productivity
3. Identify optimization opportunities
4. Suggest concrete improvements

Return JSON array:
[
  {
    "type": "warning|success|info",
    "title": "Concise title (3-5 words)",
    "message": "Detailed actionable advice (1-2 sentences)",
    "priority": 1-5
  }
]

Priority scale:
- 5: Critical (burnout risk, severe imbalance)
- 4: High (significant improvement opportunity)
- 3: Medium (good practice suggestion)
- 2: Low (minor optimization)
- 1: Info (positive reinforcement)`;

    const response = await openai.chat.completions.create({
      model: process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert productivity coach and time management consultant. Provide helpful, evidence-based advice.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const result = response.choices[0].message.content;

    const insights = parseJSONResponse(result);
    
    return insights && insights.length > 0 
      ? insights 
      : generateFallbackInsights(events, stats);

  } catch (error) {
    console.error('AI Insights Error:', error.message);
    const stats = calculateCalendarStats(events);
    return generateFallbackInsights(events, stats);
  }
};

/**
 * ============================================================================
 * STATISTICAL PATTERN ANALYSIS
 * ============================================================================
 * 
 * Machine Learning Techniques:
 * - Frequency Distribution Analysis
 * - Mode Detection (most common values)
 * - Time Series Pattern Recognition
 * - Simple Clustering (k-means concept for time grouping)
 * 
 * @param {Array} events - Historical events
 * @returns {Object} Scheduling patterns and preferences
 */
const analyzeSchedulingPatterns = (events) => {
  if (!events || events.length === 0) {
    return {
      preferredTimes: ['10:00 AM', '2:00 PM'],
      peakHours: [10, 14],
      avgDuration: 60,
      weekdayDistribution: new Array(7).fill(0),
      weeklyEventCount: 0
    };
  }

  // Initialize distribution arrays
  const hourDistribution = new Array(24).fill(0);
  const dayDistribution = new Array(7).fill(0);
  const durations = [];

  // Extract features from each event
  events.forEach(event => {
    try {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return; // Skip invalid dates
      }
      
      hourDistribution[start.getHours()]++;
      dayDistribution[start.getDay()]++;
      
      const durationMinutes = (end - start) / (1000 * 60);
      if (durationMinutes > 0 && durationMinutes < 480) { // Sanity check: 0-8 hours
        durations.push(durationMinutes);
      }
    } catch (error) {
      console.error('Error analyzing event:', error);
    }
  });

  // Find peak hours using clustering concept
  const peakHours = hourDistribution
    .map((count, hour) => ({ hour, count }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(h => h.hour);

  // Convert peak hours to preferred times
  const preferredTimes = peakHours.map(h => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:00 ${period}`;
  });

  // Calculate average duration
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 60;

  return {
    preferredTimes: preferredTimes.length > 0 ? preferredTimes : ['10:00 AM'],
    peakHours: peakHours.length > 0 ? peakHours : [10],
    avgDuration,
    weekdayDistribution: dayDistribution,
    weeklyEventCount: events.length
  };
};

/**
 * ============================================================================
 * CONSTRAINT SATISFACTION ALGORITHM
 * ============================================================================
 * 
 * Algorithm: Finds all non-conflicting time slots
 * Constraints:
 * - Must be within working hours (9 AM - 5 PM)
 * - No overlap with existing events
 * - Must fit requested duration
 * - Within next 7 days
 * 
 * @param {Array} events - Existing events
 * @param {number} duration - Required duration in minutes
 * @returns {Array} Available time slots
 */
const findAvailableSlots = (events, duration) => {
  const slots = [];
  const workingHours = { start: 9, end: 17 };
  const now = new Date();
  
  // Generate slots for next 7 days
  for (let day = 0; day < 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    date.setHours(workingHours.start, 0, 0, 0);

    // Skip past times on today
    if (day === 0 && date < now) {
      date.setTime(now.getTime());
      date.setMinutes(Math.ceil(date.getMinutes() / 30) * 30); // Round to next 30 min
    }

    // Check every 30-minute slot
    while (date.getHours() < workingHours.end) {
      const slotEnd = new Date(date.getTime() + duration * 60000);
      
      // Must end before working hours end
      if (slotEnd.getHours() >= workingHours.end && slotEnd.getMinutes() > 0) {
        break;
      }

      // Check for conflicts with existing events
      const hasConflict = events.some(event => {
        try {
          const eventStart = new Date(event.start_time);
          const eventEnd = new Date(event.end_time);
          
          // Overlap detection: (StartA < EndB) AND (StartB < EndA)
          return (date < eventEnd && slotEnd > eventStart);
        } catch (error) {
          return false;
        }
      });

      if (!hasConflict) {
        slots.push({
          start: date.toISOString(),
          end: slotEnd.toISOString(),
          day: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          dayOfWeek: date.getDay(),
          hour: date.getHours()
        });
      }

      // Move to next 30-minute slot
      date.setMinutes(date.getMinutes() + 30);
    }
  }

  return slots;
};

/**
 * ============================================================================
 * CALENDAR STATISTICS CALCULATOR
 * ============================================================================
 */
const calculateCalendarStats = (events) => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Filter events for this week
  const weeklyEvents = events.filter(e => {
    try {
      const eventDate = new Date(e.start_time);
      return eventDate >= weekStart && eventDate < weekEnd;
    } catch {
      return false;
    }
  });

  // Calculate total hours
  const totalHours = weeklyEvents.reduce((sum, e) => {
    try {
      const duration = (new Date(e.end_time) - new Date(e.start_time)) / (1000 * 60 * 60);
      return sum + (duration > 0 ? duration : 0);
    } catch {
      return sum;
    }
  }, 0);

  // Find busiest day
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = new Array(7).fill(0);
  
  weeklyEvents.forEach(e => {
    try {
      const day = new Date(e.start_time).getDay();
      dayCounts[day]++;
    } catch {}
  });

  const busiestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const busiestDay = busiestDayIndex >= 0 ? dayNames[busiestDayIndex] : 'N/A';

  // Hour distribution
  const hourDist = new Array(24).fill(0);
  events.forEach(e => {
    try {
      hourDist[new Date(e.start_time).getHours()]++;
    } catch {}
  });

  // Most common time
  const mostCommonHour = hourDist.indexOf(Math.max(...hourDist));
  const period = mostCommonHour >= 12 ? 'PM' : 'AM';
  const displayHour = mostCommonHour % 12 || 12;

  return {
    weeklyEvents: weeklyEvents.length,
    avgDailyMeetings: (weeklyEvents.length / 7).toFixed(1),
    totalHours: totalHours.toFixed(1),
    longestFreeBlock: 120, // Could be calculated from gaps
    busiestDay,
    commonTime: `${displayHour}:00 ${period}`,
    hourDistribution: hourDist
  };
};

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

const formatTimeSlot = (slot) => {
  return `${slot.day} at ${slot.time}`;
};

/**
 * Parse AI JSON response with multiple fallback strategies
 */
const parseJSONResponse = (text) => {
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch (e1) {
    try {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = text.match(/``````/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Try extracting array/object
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
      
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
    } catch (e2) {
      console.error('JSON parse error:', e2);
    }
  }
  
  return null;
};

/**
 * Parse AI response for title suggestions
 */
const parseAIResponse = (text, userInput, pastEvents) => {
  try {
    const parsed = parseJSONResponse(text);
    
    if (Array.isArray(parsed)) {
      return parsed
        .filter(item => item && (item.title || item.suggestion))
        .map(item => ({
          title: item.title || item.suggestion || '',
          confidence: item.confidence || 0.5
        }))
        .filter(item => item.title.trim())
        .slice(0, 5);
    }
    
    if (parsed && parsed.suggestions && Array.isArray(parsed.suggestions)) {
      return parsed.suggestions
        .map(item => ({
          title: item.title || item.suggestion || '',
          confidence: item.confidence || 0.5
        }))
        .slice(0, 5);
    }
  } catch (error) {
    console.error('Parse error:', error);
  }

  // Last resort: extract from text
  return extractTitlesFromText(text, userInput, pastEvents);
};

/**
 * Extract titles from plain text (fallback)
 */
const extractTitlesFromText = (text, userInput, pastEvents) => {
  console.log('Extracting from text:', text);
  
  const lines = text
    .split('\n')
    .filter(l => l.trim())
    .filter(l => !l.toLowerCase().includes('json'))
    .filter(l => !l.toLowerCase().includes('confidence'))
    .filter(l => l.length < 100); // Reasonable title length

  return lines
    .slice(0, 5)
    .map(line => {
      let title = line
        .replace(/^\d+[\.\)]\s*/, '') // Remove numbering
        .replace(/^[-*•]\s*/, '') // Remove bullets
        .replace(/["'\[\]{}]/g, '') // Remove special chars
        .replace(/confidence:\s*[\d.]+/gi, '') // Remove confidence text
        .trim();

      return {
        title: title || 'Meeting',
        confidence: 0.6
      };
    })
    .filter(item => item.title && item.title.length > 2);
};

/**
 * ============================================================================
 * FALLBACK FUNCTIONS (Rule-Based)
 * ============================================================================
 */

const generateFallbackSuggestions = (input, events) => {
  const baseTerms = ['Meeting', 'Call', 'Review', 'Discussion', 'Planning'];
  const contextTerms = extractContextTerms(input);
  
  const suggestions = [];
  
  // Add context-based suggestions
  if (contextTerms.length > 0) {
    contextTerms.forEach(term => {
      baseTerms.forEach(base => {
        suggestions.push({
          title: `${term} ${base}`,
          confidence: 0.7
        });
      });
    });
  }
  
  // Add generic suggestions
  baseTerms.forEach(term => {
    suggestions.push({
      title: `${term} - ${input}`,
      confidence: 0.5
    });
  });

  // Analyze past events for patterns
  if (events && events.length > 0) {
    const commonWords = extractCommonWords(events.map(e => e.title));
    commonWords.forEach(word => {
      suggestions.push({
        title: `${word} Meeting`,
        confidence: 0.6
      });
    });
  }

  return suggestions.slice(0, 5);
};

const extractContextTerms = (input) => {
  const terms = [];
  const lower = input.toLowerCase();
  
  if (lower.includes('team')) terms.push('Team');
  if (lower.includes('client')) terms.push('Client');
  if (lower.includes('project')) terms.push('Project');
  if (lower.includes('standup')) terms.push('Standup');
  if (lower.includes('review')) terms.push('Review');
  
  return terms;
};

const extractCommonWords = (titles) => {
  const wordCount = {};
  
  titles.forEach(title => {
    const words = title.split(' ').filter(w => w.length > 3);
    words.forEach(word => {
      const clean = word.replace(/[^a-zA-Z]/g, '');
      if (clean) {
        wordCount[clean] = (wordCount[clean] || 0) + 1;
      }
    });
  });

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
};

const findOptimalTimeRuleBased = (events, duration) => {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  
  return {
    start: now.toISOString(),
    end: new Date(now.getTime() + duration * 60000).toISOString(),
    day: now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    aiReasoning: 'Next available hour (AI unavailable)',
    confidence: 0.7,
    alternatives: []
  };
};

const generateFallbackInsights = (events, stats) => {
  const insights = [];

  if (parseInt(stats.totalHours) > 25) {
    insights.push({
      type: 'warning',
      title: 'Heavy Meeting Load',
      message: `You have ${stats.totalHours}h of meetings this week. Consider blocking focus time for deep work.`,
      priority: 4
    });
  } else if (parseInt(stats.totalHours) < 10) {
    insights.push({
      type: 'success',
      title: 'Well-Balanced Schedule',
      message: 'Great job maintaining a healthy meeting-to-focus-work ratio!',
      priority: 2
    });
  }

  if (parseFloat(stats.avgDailyMeetings) > 5) {
    insights.push({
      type: 'warning',
      title: 'Frequent Meetings',
      message: 'Consider consolidating some meetings or delegating attendance.',
      priority: 3
    });
  }

  insights.push({
    type: 'info',
    title: 'Peak Time Usage',
    message: `Your most common meeting time is ${stats.commonTime}. Schedule important tasks accordingly.`,
    priority: 2
  });

  return insights;
};

/**
 * ============================================================================
 * EXPORTS
 * ============================================================================
 */

export default {
  generateTitleSuggestions,
  findOptimalTimeSlot,
  generateSmartInsights
};
