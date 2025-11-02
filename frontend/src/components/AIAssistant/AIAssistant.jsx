import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, TrendingUp, AlertCircle, X, Lightbulb } from 'lucide-react';
import { useCalendar } from '@contexts/CalendarContext';
import aiService from '@services/aiService';
import { formatTime } from '@utils/dateUtils';
import './AIAssistant.scss';

const AIAssistant = () => {
  const { events, openEventModal } = useCalendar();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [patterns, setPatterns] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');

  useEffect(() => {
    if (isOpen) {
      loadAIData();
    }
  }, [isOpen]);

  const loadAIData = async () => {
    setLoading(true);
    try {
      // Load suggestions
      const suggestionsResponse = await aiService.getSmartSuggestions();
      console.log('Suggestions Response:', suggestionsResponse);
      
      // Handle different response formats
      const suggestionsData = Array.isArray(suggestionsResponse) 
        ? suggestionsResponse 
        : suggestionsResponse.data || [];
      
      setSuggestions(suggestionsData);

      // Load patterns
      const patternsResponse = await aiService.analyzePatterns();
      console.log('Patterns Response:', patternsResponse);
      
      // Extract insights from patterns response
      const patternsData = patternsResponse.data?.insights || patternsResponse.insights || [];
      setPatterns(patternsData);

      // Load conflicts
      const conflictsResponse = await aiService.getConflicts();
      console.log('Conflicts Response:', conflictsResponse);
      
      const conflictsData = Array.isArray(conflictsResponse)
        ? conflictsResponse
        : conflictsResponse.data || [];
      
      setConflicts(conflictsData);
    } catch (error) {
      console.error('Failed to load AI data:', error);
      // Set empty arrays to avoid rendering errors
      setSuggestions([]);
      setPatterns([]);
      setConflicts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseSuggestion = async (suggestion) => {
    if (suggestion.data?.start && suggestion.data?.end) {
      openEventModal({
        start_time: suggestion.data.start,
        end_time: suggestion.data.end,
      });
      setIsOpen(false);
    }
  };

  const getIconForInsightType = (type) => {
    switch (type) {
      case 'warning':
        return <AlertCircle size={20} color="#d93025" />;
      case 'success':
        return <Lightbulb size={20} color="#0b8043" />;
      case 'info':
      default:
        return <Lightbulb size={20} color="#1967d2" />;
    }
  };

  const getCardClassForType = (type) => {
    switch (type) {
      case 'warning':
        return 'insight-card warning';
      case 'success':
        return 'insight-card success';
      case 'info':
      default:
        return 'insight-card info';
    }
  };

  if (!isOpen) {
    return (
      <button 
        className="ai-assistant-trigger"
        onClick={() => setIsOpen(true)}
        title="AI Assistant"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className="ai-assistant-panel">
      <div className="ai-assistant-header">
        <div className="header-title">
          <Sparkles size={20} />
          <h3>AI Assistant</h3>
        </div>
        <button 
          className="close-button"
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <div className="ai-assistant-tabs">
        <button
          className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          <Lightbulb size={16} />
          <span>Suggestions</span>
        </button>
        <button
          className={`tab ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          <TrendingUp size={16} />
          <span>Insights</span>
        </button>
        <button
          className={`tab ${activeTab === 'conflicts' ? 'active' : ''}`}
          onClick={() => setActiveTab('conflicts')}
        >
          <AlertCircle size={16} />
          <span>Conflicts</span>
          {conflicts.length > 0 && (
            <span className="badge">{conflicts.length}</span>
          )}
        </button>
      </div>

      <div className="ai-assistant-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Analyzing your calendar...</p>
          </div>
        ) : (
          <>
            {activeTab === 'suggestions' && (
              <div className="suggestions-tab">
                {!suggestions || suggestions.length === 0 ? (
                  <div className="empty-state">
                    <Lightbulb size={48} />
                    <p>No suggestions available</p>
                    <button 
                      className="refresh-button"
                      onClick={loadAIData}
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <div className="suggestions-list">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className={getCardClassForType(suggestion.type)}>
                        <div className="suggestion-icon">
                          {getIconForInsightType(suggestion.type)}
                        </div>
                        <div className="suggestion-content">
                          <h4>{suggestion.title}</h4>
                          <p className="suggestion-text">{suggestion.message}</p>
                          {suggestion.data?.start && (
                            <button
                              className="use-suggestion-button"
                              onClick={() => handleUseSuggestion(suggestion)}
                            >
                              Use this time
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'patterns' && (
              <div className="patterns-tab">
                {!patterns || patterns.length === 0 ? (
                  <div className="empty-state">
                    <TrendingUp size={48} />
                    <p>No insights available yet</p>
                    <button 
                      className="refresh-button"
                      onClick={loadAIData}
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <div className="insights-list">
                    {patterns.map((insight, index) => (
                      <div key={index} className={getCardClassForType(insight.type)}>
                        <div className="insight-header">
                          {getIconForInsightType(insight.type)}
                          <h4>{insight.title}</h4>
                          <span className="priority-badge">
                            Priority: {insight.priority}/5
                          </span>
                        </div>
                        <p className="insight-message">{insight.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'conflicts' && (
              <div className="conflicts-tab">
                {conflicts.length === 0 ? (
                  <div className="empty-state success">
                    <AlertCircle size={48} />
                    <p>No conflicts detected! 🎉</p>
                    <small>Your calendar is conflict-free</small>
                  </div>
                ) : (
                  <div className="conflicts-list">
                    {conflicts.map((conflict, index) => (
                      <div key={index} className="conflict-card">
                        <div className="conflict-header">
                          <AlertCircle size={16} color="#d93025" />
                          <span className="conflict-type">{conflict.conflict_type}</span>
                        </div>
                        <div className="conflict-events">
                          <div className="conflict-event">
                            <strong>{conflict.event1_title}</strong>
                            <span>{formatTime(conflict.event1_start)}</span>
                          </div>
                          <span className="conflict-divider">overlaps with</span>
                          <div className="conflict-event">
                            <strong>{conflict.event2_title}</strong>
                            <span>{formatTime(conflict.event2_start)}</span>
                          </div>
                        </div>
                        <span className="conflict-time">
                          Detected: {new Date(conflict.detected_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
