import React, { useState } from 'react';
import Modal from 'react-modal';
import { Mail, X, Loader } from 'lucide-react';
import './GmailIntegration.scss';

Modal.setAppElement('#root');

const GmailIntegration = ({ isOpen, onClose, onConnect }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Initialize Google Sign-In
      const auth2 = window.gapi.auth2.getAuthInstance();
      const googleUser = await auth2.signIn({
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar'
      });
      
      const token = googleUser.getAuthResponse().access_token;
      await onConnect(token);
      onClose();
    } catch (err) {
      console.error('Gmail integration error:', err);
      setError('Failed to connect to Gmail. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="gmail-modal"
      overlayClassName="gmail-modal-overlay"
      closeTimeoutMS={200}
    >
      <div className="gmail-modal-header">
        <h2>
          <Mail size={24} />
          <span>Connect Gmail</span>
        </h2>
        <button 
          className="close-button"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      <div className="gmail-modal-content">
        <div className="integration-info">
          <h3>Why connect Gmail?</h3>
          <ul>
            <li>Automatically create events from email invitations</li>
            <li>Get calendar notifications in your Gmail</li>
            <li>Easily share your calendar with others</li>
            <li>Sync events across devices</li>
          </ul>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="gmail-modal-actions">
          <button 
            className="cancel-button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="connect-button"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={18} className="spinning" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Mail size={18} />
                <span>Connect Gmail</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GmailIntegration;