import React from 'react';
import { Clock, MapPin, Repeat } from 'lucide-react';
import { formatTime, formatDuration, calculateDuration } from '@utils/dateUtils';
import { getContrastingTextColor } from '@utils/colorUtils';
import './EventCard.scss';

const EventCard = ({ event, onClick }) => {
  const duration = calculateDuration(event.start_time, event.end_time);
  const textColor = getContrastingTextColor(event.color);

  return (
    <div 
      className="event-card"
      style={{ 
        backgroundColor: event.color,
        color: textColor,
      }}
      onClick={() => onClick(event)}
    >
      <div className="event-card-header">
        <h3 className="event-title">{event.title}</h3>
        {event.recurrence_rule && (
          <Repeat size={14} className="recurring-icon" />
        )}
      </div>

      <div className="event-card-details">
        <div className="event-time">
          <Clock size={14} />
          <span>
            {formatTime(event.start_time)} - {formatTime(event.end_time)}
          </span>
          <span className="event-duration">({formatDuration(duration)})</span>
        </div>

        {event.location && (
          <div className="event-location">
            <MapPin size={14} />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {event.description && (
        <p className="event-description">{event.description}</p>
      )}
    </div>
  );
};

export default EventCard;
