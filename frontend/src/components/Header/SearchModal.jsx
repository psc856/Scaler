import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Search, Calendar, MapPin, Clock, X } from 'lucide-react';
import { useCalendar } from '@contexts/CalendarContext';
import './SearchModal.scss';

const SearchModal = ({ isOpen, onClose, events }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const { openEventModal } = useCalendar();

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = events.filter(event => 
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
  }, [searchQuery, events]);

  const handleEventClick = (event) => {
    openEventModal(event);
    onClose();
  };

  const formatEventTime = (event) => {
    const start = new Date(event.start_time);
    return start.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="search-modal"
      overlayClassName="search-modal-overlay"
    >
      <div className="search-modal-content">
        <div className="search-header">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search events by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="clear-search">
                <X size={16} />
              </button>
            )}
          </div>
          <button onClick={onClose} className="close-search">
            <X size={24} />
          </button>
        </div>

        <div className="search-results">
          {searchQuery.trim() === '' ? (
            <div className="search-empty">
              <Search size={48} />
              <p>Start typing to search events</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="search-empty">
              <Search size={48} />
              <p>No events found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="results-list">
              <p className="results-count">
                Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              </p>
              {filteredEvents.map(event => (
                <div 
                  key={event.id} 
                  className="result-item"
                  onClick={() => handleEventClick(event)}
                >
                  <div 
                    className="event-color-indicator" 
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="event-details">
                    <h4>{event.title}</h4>
                    <div className="event-meta">
                      <span>
                        <Clock size={14} />
                        {formatEventTime(event)}
                      </span>
                      {event.location && (
                        <span>
                          <MapPin size={14} />
                          {event.location}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="event-description">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SearchModal;
