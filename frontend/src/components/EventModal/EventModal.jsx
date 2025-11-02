import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  AlignLeft, 
  Repeat,
  Bell,
  Trash2,
  Sparkles,
  Loader
} from 'lucide-react';
import { useCalendar } from '@contexts/CalendarContext';
import useEventForm from '@hooks/useEventForm';
import ColorPicker from './ColorPicker';
import RecurrencePicker from './RecurrencePicker';
import TimePicker from './TimePicker';
import LocationPicker from './LocationPicker';
import aiService from '@services/aiService';
import { toast } from 'react-toastify';
import './EventModal.scss';

Modal.setAppElement('#root');

const EventModal = () => {
  const { 
    isEventModalOpen, 
    closeEventModal, 
    selectedEvent,
    createEvent,
    updateEvent,
    deleteEvent
  } = useCalendar();

  const { formData, errors, handleChange, validate, reset } = useEventForm(selectedEvent);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingOptimalTime, setLoadingOptimalTime] = useState(false);
  const [aiModelInfo, setAiModelInfo] = useState('');

  const isEditMode = !!selectedEvent;

  // Reset form when modal closes - FIXED: Proper cleanup
  useEffect(() => {
    if (!isEventModalOpen) {
      // Small delay to allow modal animation to complete
      const timer = setTimeout(() => {
        reset();
        setAiSuggestions([]);
        setShowAISuggestions(false);
        setAiModelInfo('');
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isEventModalOpen]); // Don't include reset in dependencies

  // Get AI suggestions for title - FIXED: Better error handling
  const handleGetTitleSuggestions = useCallback(async () => {
    if (!formData.title || formData.title.length < 2) {
      toast.info('Type at least 2 characters to get suggestions');
      return;
    }

    setLoadingSuggestions(true);
    setShowAISuggestions(false);
    setAiSuggestions([]);

    try {
      const response = await aiService.suggestEventTitle(formData.title);
      console.log('AI Response:', response);
      
      // Handle different response formats
      let suggestions = [];
      
      if (Array.isArray(response)) {
        suggestions = response;
      } else if (response.data && Array.isArray(response.data)) {
        suggestions = response.data;
      } else if (response.success && Array.isArray(response.data)) {
        suggestions = response.data;
      }

      // Validate suggestion format
      const validSuggestions = suggestions
        .filter(s => s && (s.title || s.suggestion))
        .map(s => ({
          title: s.title || s.suggestion || '',
          confidence: s.confidence || 0.5
        }));

      if (validSuggestions.length > 0) {
        setAiSuggestions(validSuggestions);
        setShowAISuggestions(true);
        
        // Set AI model info if available
        if (response.aiModel) {
          setAiModelInfo(response.aiModel);
        }
        
        toast.success(`${validSuggestions.length} AI suggestions generated!`);
      } else {
        toast.info('No suggestions available for this title');
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      toast.error('Failed to get AI suggestions. Please try again.');
    } finally {
      setLoadingSuggestions(false);
    }
  }, [formData.title]);

  // Get optimal time suggestion - FIXED
  const handleGetOptimalTime = useCallback(async () => {
    setLoadingOptimalTime(true);
    
    try {
      // Calculate duration from existing times or default to 1 hour
      let duration = 60;
      if (formData.start_time && formData.end_time) {
        const start = new Date(formData.start_time);
        const end = new Date(formData.end_time);
        duration = Math.round((end - start) / (1000 * 60));
      }

      const response = await aiService.suggestOptimalTime(duration, formData.title);
      console.log('Optimal Time Response:', response);
      
      // Handle response format
      const data = response.data || response;
      
      if (data.suggested_start && data.suggested_end) {
        handleChange('start_time', data.suggested_start);
        handleChange('end_time', data.suggested_end);
        
        const startTime = new Date(data.suggested_start).toLocaleString();
        const reasoning = data.aiReasoning || 'Next available slot';
        
        toast.success(`✨ ${reasoning}\nTime: ${startTime}`);
        
        if (data.confidence) {
          toast.info(`Confidence: ${(data.confidence * 100).toFixed(0)}%`);
        }
      } else {
        toast.info('No optimal time slot found');
      }
    } catch (error) {
      console.error('Failed to get optimal time:', error);
      toast.error('Failed to find optimal time');
    } finally {
      setLoadingOptimalTime(false);
    }
  }, [formData.start_time, formData.end_time, formData.title, handleChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await updateEvent(selectedEvent.id, formData);
      } else {
        await createEvent(formData);
      }
      closeEventModal();
    } catch (error) {
      console.error('Failed to save event:', error);
      // Error toast is handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteEvent(selectedEvent.id);
      closeEventModal();
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (field, value) => {
    handleChange(field, value);
    
    // Auto-adjust end time if start time changes
    if (field === 'start_time' && !formData.end_time) {
      const start = new Date(value);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // Add 1 hour
      handleChange('end_time', end.toISOString());
    }
  };

  return (
    <Modal
      isOpen={isEventModalOpen}
      onRequestClose={closeEventModal}
      className="event-modal"
      overlayClassName="event-modal-overlay"
      closeTimeoutMS={200}
    >
      <div className="event-modal-header">
        <h2>{isEditMode ? 'Edit Event' : 'Create Event'}</h2>
        <button 
          className="close-button"
          onClick={closeEventModal}
          aria-label="Close modal"
          type="button"
        >
          <X size={24} />
        </button>
      </div>

      <form className="event-modal-form" onSubmit={handleSubmit}>
        {/* Title with AI */}
        <div className="form-group">
          <div className="input-with-ai">
            <input
              type="text"
              placeholder="Add title *"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={errors.title ? 'error' : ''}
              autoFocus
            />
            <button
              type="button"
              className="ai-button"
              onClick={handleGetTitleSuggestions}
              title={`Get AI suggestions ${aiModelInfo ? `(${aiModelInfo})` : ''}`}
              disabled={loadingSuggestions}
            >
              {loadingSuggestions ? (
                <Loader size={18} className="spinning" />
              ) : (
                <Sparkles size={18} />
              )}
            </button>
          </div>
          {errors.title && <span className="error-message">{errors.title}</span>}
          
          {/* AI Suggestions - FIXED: Proper rendering */}
          {showAISuggestions && aiSuggestions.length > 0 && (
            <div className="ai-suggestions">
              <div className="suggestions-header">
                <p className="suggestions-label">
                  💡 AI Suggestions {aiModelInfo && `(${aiModelInfo})`}
                </p>
                <button 
                  type="button"
                  className="close-suggestions"
                  onClick={() => setShowAISuggestions(false)}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="suggestions-list">
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => {
                      handleChange('title', suggestion.title);
                      setShowAISuggestions(false);
                    }}
                  >
                    <span>{suggestion.title}</span>
                    {suggestion.confidence > 0 && (
                      <span className="confidence-badge">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date & Time with Time Picker */}
        <div className="form-group">
          <div className="form-row">
            <div className="form-col">
              <label>
                <Calendar size={18} />
                <span>Start *</span>
              </label>
              <TimePicker
                value={formData.start_time}
                onChange={(value) => handleTimeChange('start_time', value)}
                error={errors.start_time}
              />
              {errors.start_time && <span className="error-message">{errors.start_time}</span>}
            </div>

            <div className="form-col">
              <label>
                <Clock size={18} />
                <span>End *</span>
              </label>
              <TimePicker
                value={formData.end_time}
                onChange={(value) => handleChange('end_time', value)}
                error={errors.end_time}
                minDate={formData.start_time}
              />
              {errors.end_time && <span className="error-message">{errors.end_time}</span>}
            </div>
          </div>

          <button
            type="button"
            className="ai-time-button"
            onClick={handleGetOptimalTime}
            disabled={loadingOptimalTime}
          >
            {loadingOptimalTime ? (
              <>
                <Loader size={16} className="spinning" />
                <span>Finding optimal time...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Suggest optimal time (AI finds free slots)</span>
              </>
            )}
          </button>
        </div>

        {/* All Day */}
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.is_all_day}
              onChange={(e) => handleChange('is_all_day', e.target.checked)}
            />
            <span>All day event</span>
          </label>
        </div>

        {/* Location with Autocomplete */}
        <div className="form-group">
          <label>
            <MapPin size={18} />
            <span>Location</span>
          </label>
          <LocationPicker
            value={formData.location}
            onChange={(value) => handleChange('location', value)}
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label>
            <AlignLeft size={18} />
            <span>Description</span>
          </label>
          <textarea
            placeholder="Add description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
          />
        </div>

        {/* Color */}
        <div className="form-group">
          <label>
            <span>Color</span>
          </label>
          <ColorPicker
            selectedColor={formData.color}
            onColorSelect={(color) => handleChange('color', color)}
          />
        </div>

        {/* Recurrence */}
        <div className="form-group">
          <label>
            <Repeat size={18} />
            <span>Repeat</span>
          </label>
          <RecurrencePicker
            value={formData.recurrence_rule}
            onChange={(value) => handleChange('recurrence_rule', value)}
          />
        </div>

        {/* Reminder */}
        <div className="form-group">
          <label>
            <Bell size={18} />
            <span>Reminder</span>
          </label>
          <select
            value={formData.reminder_minutes}
            onChange={(e) => handleChange('reminder_minutes', parseInt(e.target.value))}
          >
            <option value={0}>No reminder</option>
            <option value={5}>5 minutes before</option>
            <option value={10}>10 minutes before</option>
            <option value={15}>15 minutes before</option>
            <option value={30}>30 minutes before</option>
            <option value={60}>1 hour before</option>
            <option value={120}>2 hours before</option>
            <option value={1440}>1 day before</option>
          </select>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <div className="actions-left">
            {isEditMode && (
              <button
                type="button"
                className="delete-button"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="actions-right">
            <button
              type="button"
              className="cancel-button"
              onClick={closeEventModal}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={18} className="spinning" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Update Event' : 'Create Event'}</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EventModal;
