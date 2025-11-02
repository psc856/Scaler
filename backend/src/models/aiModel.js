import db from '../config/database.js';

class AIModel {
  // Save AI suggestion
  static saveSuggestion(suggestionData) {
    const {
      suggestion_text,
      suggested_time,
      suggested_duration,
      context
    } = suggestionData;

    const newSuggestion = {
      suggestion_text,
      suggested_time: suggested_time || null,
      suggested_duration: suggested_duration || null,
      context: context || null,
      was_accepted: false
    };

    return db.insert('ai_suggestions', newSuggestion);
  }

  // Get all suggestions
  static getAllSuggestions() {
    const suggestions = db.all('ai_suggestions');
    return suggestions
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50);
  }

  // Mark suggestion as applied
  static markAsApplied(id) {
    return db.update('ai_suggestions', parseInt(id), { was_accepted: true });
  }

  // Log conflict
  static logConflict(conflictData) {
    const {
      event1_id,
      event1_title,
      event1_start,
      event2_id,
      event2_title,
      event2_start,
      conflict_type
    } = conflictData;

    const newConflict = {
      event1_id: parseInt(event1_id),
      event1_title,
      event1_start,
      event2_id: parseInt(event2_id),
      event2_title,
      event2_start,
      conflict_type,
      resolved: false
    };

    return db.insert('conflicts', newConflict);
  }

  // Get all conflicts
  static getAllConflicts() {
    const conflicts = db.all('conflicts');
    return conflicts.sort((a, b) => new Date(b.detected_at || b.created_at) - new Date(a.detected_at || a.created_at));
  }

  // Resolve conflict
  static resolveConflict(id) {
    return db.update('conflicts', parseInt(id), { resolved: true });
  }
}

export default AIModel;