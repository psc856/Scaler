import api from './api';

class EventService {
  // Get all events (optionally filtered by date range)
  async getEvents(startDate = null, endDate = null) {
    const params = {};
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;

    const response = await api.get('/events', { params });
    return response.data;
  }

  // Get single event by ID
  async getEventById(id) {
    const response = await api.get(`/events/${id}`);
    return response.data;
  }

  // Create new event
  async createEvent(eventData) {
    const response = await api.post('/events', eventData);
    return response;
  }

  // Update event
  async updateEvent(id, eventData) {
    const response = await api.put(`/events/${id}`, eventData);
    return response;
  }

  // Delete event
  async deleteEvent(id) {
    const response = await api.delete(`/events/${id}`);
    return response;
  }

  // Update recurring event instance
  async updateRecurringInstance(id, instanceDate, modifications) {
    const response = await api.put(`/events/${id}/recurring-instance`, {
      instance_date: instanceDate,
      ...modifications,
    });
    return response;
  }

  // Delete recurring event instance
  async deleteRecurringInstance(id, instanceDate) {
    const response = await api.delete(`/events/${id}/recurring-instance`, {
      data: { instance_date: instanceDate },
    });
    return response;
  }

  // Check for conflicts
  async checkConflicts(startTime, endTime, excludeId = null) {
    const params = {
      start_time: startTime,
      end_time: endTime,
    };
    if (excludeId) params.exclude_id = excludeId;

    const response = await api.get('/events/conflicts', { params });
    return response;
  }

  // Bulk delete events
  async bulkDeleteEvents(eventIds) {
    const response = await api.post('/events/bulk-delete', { event_ids: eventIds });
    return response;
  }
}

export default new EventService();
