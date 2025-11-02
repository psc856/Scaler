import api from './api';
import { toast } from 'react-toastify';

class ReminderService {
  /**
   * Create a shared reminder
   */
  async createSharedReminder(reminderData) {
    try {
      const response = await api.post('/reminders', {
        ...reminderData,
        isShared: true
      });
      
      if (response.success) {
        toast.success('Reminder shared successfully');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to create shared reminder:', error);
      toast.error('Failed to share reminder');
      throw error;
    }
  }

  /**
   * Get shared reminders for a user
   */
  async getSharedReminders() {
    try {
      const response = await api.get('/reminders/shared');
      return response.data;
    } catch (error) {
      console.error('Failed to get shared reminders:', error);
      throw error;
    }
  }

  /**
   * Update shared reminder status
   */
  async updateReminderStatus(reminderId, status) {
    try {
      const response = await api.patch(`/reminders/${reminderId}/status`, {
        status
      });
      
      if (response.success) {
        toast.success('Reminder status updated');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to update reminder status:', error);
      toast.error('Failed to update reminder');
      throw error;
    }
  }

  /**
   * Share reminder with other users
   */
  async shareReminderWith(reminderId, userEmails) {
    try {
      const response = await api.post(`/reminders/${reminderId}/share`, {
        userEmails
      });
      
      if (response.success) {
        toast.success('Reminder shared with users successfully');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to share reminder:', error);
      toast.error('Failed to share reminder with users');
      throw error;
    }
  }

  /**
   * Remove user from shared reminder
   */
  async removeUserFromReminder(reminderId, userEmail) {
    try {
      const response = await api.delete(`/reminders/${reminderId}/share/${encodeURIComponent(userEmail)}`);
      
      if (response.success) {
        toast.success('User removed from reminder');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to remove user from reminder:', error);
      toast.error('Failed to remove user from reminder');
      throw error;
    }
  }

  /**
   * Get reminder participants
   */
  async getReminderParticipants(reminderId) {
    try {
      const response = await api.get(`/reminders/${reminderId}/participants`);
      return response.data;
    } catch (error) {
      console.error('Failed to get reminder participants:', error);
      throw error;
    }
  }

  /**
   * Subscribe to reminder notifications
   */
  async subscribeToNotifications(reminderId) {
    try {
      const response = await api.post(`/reminders/${reminderId}/subscribe`);
      
      if (response.success) {
        toast.success('Subscribed to reminder notifications');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      toast.error('Failed to subscribe to notifications');
      throw error;
    }
  }

  /**
   * Unsubscribe from reminder notifications
   */
  async unsubscribeFromNotifications(reminderId) {
    try {
      const response = await api.post(`/reminders/${reminderId}/unsubscribe`);
      
      if (response.success) {
        toast.success('Unsubscribed from reminder notifications');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
      toast.error('Failed to unsubscribe from notifications');
      throw error;
    }
  }
}

export default new ReminderService();