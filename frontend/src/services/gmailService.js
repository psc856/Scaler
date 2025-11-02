import api from './api';
import { toast } from 'react-toastify';

class GmailService {
  /**
   * Get Gmail authorization URL
   */
  async getAuthUrl() {
    try {
      const response = await api.get('/auth/gmail/auth-url');
      return response;
    } catch (error) {
      console.error('Failed to get Gmail auth URL:', error);
      throw error;
    }
  }

  /**
   * Check Gmail connection status
   */
  async getConnectionStatus(userEmail) {
    try {
      const response = await api.get(`/auth/gmail/status?user_email=${encodeURIComponent(userEmail)}`);
      return response;
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
      return { success: false, connected: false };
    }
  }

  /**
   * Disconnect Gmail
   */
  async disconnect(userEmail) {
    try {
      const response = await api.post('/auth/gmail/disconnect', {
        user_email: userEmail
      });
      
      if (response.success) {
        toast.success('Gmail disconnected successfully');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
      toast.error('Failed to disconnect Gmail');
      throw error;
    }
  }

  /**
   * Open Gmail authorization popup
   */
  async connectGmail(userEmail) {
    try {
      const authResponse = await this.getAuthUrl();
      
      if (!authResponse.success || !authResponse.authUrl) {
        throw new Error('Failed to get authorization URL');
      }

      // Open popup window
      const popup = window.open(
        authResponse.authUrl,
        'gmail-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Monitor popup for completion
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            
            // Check connection status after popup closes
            setTimeout(async () => {
              try {
                const status = await this.getConnectionStatus(userEmail);
                if (status.connected) {
                  toast.success('Gmail connected successfully!');
                  resolve(status);
                } else {
                  toast.info('Gmail connection was cancelled');
                  resolve({ success: false, connected: false });
                }
              } catch (error) {
                reject(error);
              }
            }, 1000);
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error('Gmail connection timeout'));
        }, 300000);
      });
    } catch (error) {
      console.error('Gmail connection error:', error);
      toast.error('Failed to connect Gmail');
      throw error;
    }
  }

  /**
   * Handle Gmail connection callback (for URL parameters)
   */
  handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('gmail_connected') === 'true') {
      toast.success('Gmail connected successfully!');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return { success: true, connected: true };
    }
    
    if (urlParams.get('gmail_error') === 'true') {
      toast.error('Gmail connection failed');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return { success: false, connected: false };
    }
    
    return null;
  }
}

export default new GmailService();