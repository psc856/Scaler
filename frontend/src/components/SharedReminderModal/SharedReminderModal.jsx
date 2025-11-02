import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { X, Users, Send, Bell, Loader, Plus, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import reminderService from '@services/reminderService';
import './SharedReminderModal.scss';

Modal.setAppElement('#root');

const SharedReminderModal = ({ isOpen, onClose, reminder, onShare }) => {
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (isOpen && reminder) {
      loadParticipants();
    }
  }, [isOpen, reminder]);

  const loadParticipants = async () => {
    if (!reminder) return;

    try {
      setLoading(true);
      const data = await reminderService.getReminderParticipants(reminder.id);
      setParticipants(data);
      // Check if current user is subscribed
      setIsSubscribed(data.some(p => p.isSubscribed));
    } catch (error) {
      console.error('Failed to load participants:', error);
      toast.error('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !reminder) return;

    try {
      setLoading(true);
      await reminderService.shareReminderWith(reminder.id, [newEmail]);
      setNewEmail('');
      await loadParticipants();
    } catch (error) {
      console.error('Failed to add participant:', error);
      toast.error('Failed to add participant');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (email) => {
    if (!reminder) return;

    try {
      setLoading(true);
      await reminderService.removeUserFromReminder(reminder.id, email);
      await loadParticipants();
    } catch (error) {
      console.error('Failed to remove participant:', error);
      toast.error('Failed to remove participant');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubscription = async () => {
    if (!reminder) return;

    try {
      setLoading(true);
      if (isSubscribed) {
        await reminderService.unsubscribeFromNotifications(reminder.id);
      } else {
        await reminderService.subscribeToNotifications(reminder.id);
      }
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const filteredParticipants = searchQuery
    ? participants.filter(p => 
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : participants;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="shared-reminder-modal"
      overlayClassName="shared-reminder-modal-overlay"
      closeTimeoutMS={200}
    >
      <div className="shared-reminder-modal-header">
        <h2>
          <Users size={24} />
          <span>Shared Reminder</span>
        </h2>
        <button 
          className="close-button"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      <div className="shared-reminder-modal-content">
        {/* Subscription Toggle */}
        <div className="subscription-section">
          <button 
            className={`subscription-toggle ${isSubscribed ? 'subscribed' : ''}`}
            onClick={handleToggleSubscription}
            disabled={loading}
          >
            <Bell size={18} />
            <span>
              {isSubscribed ? 'Subscribed to notifications' : 'Subscribe to notifications'}
            </span>
          </button>
        </div>

        {/* Add Participant Form */}
        <form className="add-participant-form" onSubmit={handleAddParticipant}>
          <input
            type="email"
            placeholder="Enter email to share with..."
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="add-button"
            disabled={loading || !newEmail.trim()}
          >
            {loading ? <Loader size={18} className="spinning" /> : <Plus size={18} />}
            <span>Add</span>
          </button>
        </form>

        {/* Search Participants */}
        <div className="search-section">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Participants List */}
        <div className="participants-list">
          {loading && !participants.length ? (
            <div className="loading-state">
              <Loader size={24} className="spinning" />
              <span>Loading participants...</span>
            </div>
          ) : filteredParticipants.length > 0 ? (
            filteredParticipants.map((participant) => (
              <div key={participant.email} className="participant-item">
                <div className="participant-info">
                  <div className="avatar">
                    {participant.name ? participant.name[0].toUpperCase() : participant.email[0].toUpperCase()}
                  </div>
                  <div className="details">
                    <span className="name">{participant.name || 'Unknown'}</span>
                    <span className="email">{participant.email}</span>
                  </div>
                </div>
                {!participant.isOwner && (
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveParticipant(participant.email)}
                    disabled={loading}
                    title="Remove participant"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Users size={48} />
              <p>No participants yet</p>
              <span>Share this reminder with others to collaborate</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SharedReminderModal;