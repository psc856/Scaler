import React from 'react';
import { Calendar, List, Clock, Grid3X3, BarChart3 } from 'lucide-react';
import { useCalendar } from '@contexts/CalendarContext';
import './ViewSwitcher.scss';

const ViewSwitcher = () => {
  const { view, setView, events } = useCalendar();

  const views = [
    { id: 'day', label: 'Day', icon: Clock, shortcut: 'D' },
    { id: 'week', label: 'Week', icon: List, shortcut: 'W' },
    { id: 'month', label: 'Month', icon: Calendar, shortcut: 'M' },
  ];

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start_time);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  return (
    <div className="view-switcher-container">
      <div className="view-switcher">
        {views.map(({ id, label, icon: Icon, shortcut }) => (
          <button
            key={id}
            className={`view-button ${view === id ? 'active' : ''}`}
            onClick={() => setView(id)}
            aria-label={`Switch to ${label} view`}
            title={`${label} view (${shortcut})`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      
      <div className="view-info">
        <div className="today-summary">
          <Grid3X3 size={16} />
          <span>Today: {todayEvents.length} events</span>
        </div>
        
        <div className="total-summary">
          <BarChart3 size={16} />
          <span>Total: {events.length} events</span>
        </div>
      </div>
    </div>
  );
};

export default ViewSwitcher;
