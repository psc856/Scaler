import { useState, useEffect, useCallback } from 'react';
import { toISOString } from '@utils/dateUtils';

const useEventForm = (initialEvent = null) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    color: '#1967d2',
    is_all_day: false,
    recurrence_rule: '',
    timezone: 'UTC',
    reminder_minutes: 30,
  });

  const [errors, setErrors] = useState({});

  // Initialize form with event data if editing - FIXED: Proper dependency
  useEffect(() => {
    if (initialEvent && initialEvent.id) {
      setFormData({
        title: initialEvent.title || '',
        description: initialEvent.description || '',
        start_time: initialEvent.start_time || initialEvent.start?.toISOString() || '',
        end_time: initialEvent.end_time || initialEvent.end?.toISOString() || '',
        location: initialEvent.location || '',
        color: initialEvent.color || '#1967d2',
        is_all_day: initialEvent.is_all_day || false,
        recurrence_rule: initialEvent.recurrence_rule || '',
        timezone: initialEvent.timezone || 'UTC',
        reminder_minutes: initialEvent.reminder_minutes || 30,
      });
    }
  }, [initialEvent?.id]); // Only depend on ID to avoid infinite loops

  // Handle input change
  const handleChange = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  }, [errors]);

  // Validate form
  const validate = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      
      if (start >= end) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Reset form - FIXED: Use useCallback
  const reset = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      color: '#1967d2',
      is_all_day: false,
      recurrence_rule: '',
      timezone: 'UTC',
      reminder_minutes: 30,
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    handleChange,
    validate,
    reset,
    setFormData,
  };
};

export default useEventForm;
