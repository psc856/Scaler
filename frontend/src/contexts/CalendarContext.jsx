import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import eventService from '@services/eventService';
import aiService from '@services/aiService';
import { toast } from 'react-toastify';
import { toISOString } from '@utils/dateUtils';

const CalendarContext = createContext();

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within CalendarProvider');
  }
  return context;
};

export const CalendarProvider = ({ children }) => {
  // State
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [loading, setLoading] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  // Fetch events
  const fetchEvents = useCallback(async (startDate = null, endDate = null) => {
    setLoading(true);
    try {
      const data = await eventService.getEvents(
        startDate ? toISOString(startDate) : null,
        endDate ? toISOString(endDate) : null
      );
      
      // Transform events for react-big-calendar
      const transformedEvents = data.map(event => ({
        ...event,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        title: event.title,
      }));
      
      setEvents(transformedEvents);
    } catch (error) {
      toast.error('Failed to fetch events');
      console.error('Fetch events error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create event
  const createEvent = useCallback(async (eventData) => {
    try {
      const response = await eventService.createEvent(eventData);
      
      // Show warning if there are conflicts
      if (response.conflicts && response.conflicts.length > 0) {
        toast.warning(response.warning);
        setConflicts(response.conflicts);
      } else {
        toast.success('Event created successfully');
      }
      
      await fetchEvents();
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
      throw error;
    }
  }, [fetchEvents]);

  // Update event
  const updateEvent = useCallback(async (id, eventData) => {
    try {
      const response = await eventService.updateEvent(id, eventData);
      
      if (response.conflicts && response.conflicts.length > 0) {
        toast.warning(response.warning);
        setConflicts(response.conflicts);
      } else {
        toast.success('Event updated successfully');
      }
      
      await fetchEvents();
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update event');
      throw error;
    }
  }, [fetchEvents]);

  // Delete event
  const deleteEvent = useCallback(async (id) => {
    try {
      await eventService.deleteEvent(id);
      toast.success('Event deleted successfully');
      await fetchEvents();
    } catch (error) {
      toast.error('Failed to delete event');
      throw error;
    }
  }, [fetchEvents]);

  // Get AI suggestions
  const getAISuggestions = useCallback(async (duration = null, date = null) => {
    try {
      const data = await aiService.getSmartSuggestions(duration, date);
      setAiSuggestions(data);
      return data;
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      return [];
    }
  }, []);

  // Open event modal
  const openEventModal = useCallback((event = null) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  }, []);

  // Close event modal
  const closeEventModal = useCallback(() => {
    setSelectedEvent(null);
    setIsEventModalOpen(false);
  }, []);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  // Navigate calendar
  const navigateCalendar = useCallback((direction) => {
    setCurrentDate(prevDate => {
      const date = new Date(prevDate);
      
      switch (view) {
        case 'month':
          return direction === 'next' 
            ? new Date(date.setMonth(date.getMonth() + 1))
            : new Date(date.setMonth(date.getMonth() - 1));
        
        case 'week':
          return direction === 'next'
            ? new Date(date.setDate(date.getDate() + 7))
            : new Date(date.setDate(date.getDate() - 7));
        
        case 'day':
          return direction === 'next'
            ? new Date(date.setDate(date.getDate() + 1))
            : new Date(date.setDate(date.getDate() - 1));
        
        default:
          return date;
      }
    });
  }, [view]);

  // Go to today
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const value = {
    // State
    events,
    selectedEvent,
    currentDate,
    view,
    loading,
    isEventModalOpen,
    isSidebarCollapsed,
    aiSuggestions,
    conflicts,
    
    // Actions
    setEvents,
    setSelectedEvent,
    setCurrentDate,
    setView,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    openEventModal,
    closeEventModal,
    toggleSidebar,
    navigateCalendar,
    goToToday,
    getAISuggestions,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
