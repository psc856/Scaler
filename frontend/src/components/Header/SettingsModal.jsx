import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Settings, Mail, Bell, Calendar, X, Check, Link, Unlink } from 'lucide-react';
import { toast } from 'react-toastify';
import gmailService from '../../services/gmailService';
import './SettingsModal.scss';

const SettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    emailAddress: localStorage.getItem('userEmail') || '',
    reminderTime: 30,
    weekStart: 'sunday',
    timeFormat: '12h',
    theme: 'light'
  });
  
  const [gmailStatus, setGmailStatus] = useState({
    connected: false,
    loading: false
  });

  useEffect(() => {
    if (isOpen && settings.emailAddress) {
      checkGmailStatus();
    }
    
    // Handle Gmail callback
    const callback = gmailService.handleCallback();
    if (callback) {
      setGmailStatus(prev => ({ ...prev, connected: callback.connected }));
    }
  }, [isOpen, settings.emailAddress]);

  const checkGmailStatus = async () => {
    try {
      const status = await gmailService.getConnectionStatus(settings.emailAddress);
      setGmailStatus(prev => ({ ...prev, connected: status.connected }));
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
    }
  };

  const handleGmailConnect = async () => {
    if (!settings.emailAddress) {
      toast.error('Please enter your email address first');
      return;
    }

    setGmailStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await gmailService.connectGmail(settings.emailAddress);
      setGmailStatus({ connected: result.connected, loading: false });
    } catch (error) {
      setGmailStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleGmailDisconnect = async () => {
    setGmailStatus(prev => ({ ...prev, loading: true }));
    
    try {
      await gmailService.disconnect(settings.emailAddress);
      setGmailStatus({ connected: false, loading: false });
    } catch (error) {
      setGmailStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSave = () => {
    localStorage.setItem('userEmail', settings.emailAddress);
    localStorage.setItem('calendarSettings', JSON.stringify(settings));
    toast.success('Settings saved successfully!');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="settings-modal"
      overlayClassName="settings-modal-overlay"
    >
      <div className="settings-modal-content">
        <div className="settings-header">
          <div className="header-title">
            <Settings size={24} />
            <h2>Settings</h2>
          </div>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>

        <div className="settings-body">
          {/* Email Settings */}
          <div className="settings-section">
            <div className="section-header">
              <Mail size={20} />
              <h3>Email Notifications</h3>
            </div>
            
            <div className="setting-item">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                />
                <span className="switch-slider"></span>
                <span>Enable email notifications</span>
              </label>
            </div>

            {settings.emailNotifications && (
              <>
                <div className="setting-item">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="your.email@gmail.com"
                    value={settings.emailAddress}
                    onChange={(e) => setSettings({...settings, emailAddress: e.target.value})}
                  />
                  <small>We'll send reminders to this email</small>
                </div>
                
                <div className="setting-item gmail-connection">
                  <div className="gmail-status">
                    <span className={`status-indicator ${gmailStatus.connected ? 'connected' : 'disconnected'}`}></span>
                    <span>Gmail {gmailStatus.connected ? 'Connected' : 'Not Connected'}</span>
                  </div>
                  
                  {gmailStatus.connected ? (
                    <button 
                      className="gmail-button disconnect"
                      onClick={handleGmailDisconnect}
                      disabled={gmailStatus.loading}
                    >
                      <Unlink size={16} />
                      {gmailStatus.loading ? 'Disconnecting...' : 'Disconnect Gmail'}
                    </button>
                  ) : (
                    <button 
                      className="gmail-button connect"
                      onClick={handleGmailConnect}
                      disabled={gmailStatus.loading || !settings.emailAddress}
                    >
                      <Link size={16} />
                      {gmailStatus.loading ? 'Connecting...' : 'Connect Gmail'}
                    </button>
                  )}
                </div>
                
                {gmailStatus.connected && (
                  <div className="gmail-info">
                    <small>✅ Gmail connected! You'll receive email notifications for events and reminders.</small>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Reminder Settings */}
          <div className="settings-section">
            <div className="section-header">
              <Bell size={20} />
              <h3>Default Reminder</h3>
            </div>
            
            <div className="setting-item">
              <label>Remind me before</label>
              <select
                value={settings.reminderTime}
                onChange={(e) => setSettings({...settings, reminderTime: parseInt(e.target.value)})}
              >
                <option value={0}>No reminder</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={1440}>1 day</option>
              </select>
            </div>
          </div>

          {/* Calendar Settings */}
          <div className="settings-section">
            <div className="section-header">
              <Calendar size={20} />
              <h3>Calendar Preferences</h3>
            </div>
            
            <div className="setting-item">
              <label>Week starts on</label>
              <select
                value={settings.weekStart}
                onChange={(e) => setSettings({...settings, weekStart: e.target.value})}
              >
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
              </select>
            </div>

            <div className="setting-item">
              <label>Time format</label>
              <select
                value={settings.timeFormat}
                onChange={(e) => setSettings({...settings, timeFormat: e.target.value})}
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            <Check size={18} />
            Save Settings
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
