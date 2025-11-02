import React, { useState } from 'react';
import { 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Settings, 
  Search,
  Calendar,
  Bell,
  X
} from 'lucide-react';
import { useCalendar } from '@contexts/CalendarContext';
import { formatDate } from '@utils/dateUtils';
import SearchModal from './SearchModal';
import SettingsModal from './SettingsModal';
import './Header.scss';

const Header = () => {
  const {
    currentDate,
    view,
    toggleSidebar,
    navigateCalendar,
    goToToday,
    openEventModal,
    events,
  } = useCalendar();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getHeaderTitle = () => {
    switch (view) {
      case 'month':
        return formatDate(currentDate, 'MMMM yyyy');
      case 'week':
        return formatDate(currentDate, 'MMM dd, yyyy');
      case 'day':
        return formatDate(currentDate, 'EEEE, MMMM dd, yyyy');
      default:
        return formatDate(currentDate, 'MMMM yyyy');
    }
  };

  // Get upcoming events count for reminder badge
  const upcomingEventsCount = events.filter(event => {
    const eventDate = new Date(event.start_time);
    const now = new Date();
    return eventDate > now;
  }).length;

  return (
    <>
      <header className="calendar-header">
        <div className="header-left">
          <button 
            className="menu-button"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            title="Menu"
          >
            <Menu size={24} />
          </button>

          <div className="logo">
            <span className="logo-icon">📅</span>
            <span className="logo-text">Calendar</span>
          </div>

          <button 
            className="today-button"
            onClick={goToToday}
            title="Go to today"
          >
            Today
          </button>

          <div className="navigation-buttons">
            <button
              className="nav-button"
              onClick={() => navigateCalendar('prev')}
              aria-label="Previous"
              title="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="nav-button"
              onClick={() => navigateCalendar('next')}
              aria-label="Next"
              title="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <h1 className="header-title">{getHeaderTitle()}</h1>
        </div>

        <div className="header-right">
          {/* Search Button */}
          <button 
            className="header-icon-button" 
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search events"
            title="Search events"
          >
            <Search size={20} />
          </button>

          {/* Events Button */}
          <button 
            className="header-icon-button" 
            onClick={goToToday}
            aria-label="View events"
            title="View all events"
          >
            <Calendar size={20} />
            {events.length > 0 && (
              <span className="badge">{events.length}</span>
            )}
          </button>

          {/* Reminders Button */}
          <button 
            className="header-icon-button" 
            onClick={() => {
              const upcomingEvents = events.filter(event => {
                const eventDate = new Date(event.start_time);
                const now = new Date();
                return eventDate > now;
              });
              if (upcomingEvents.length > 0) {
                alert(`You have ${upcomingEvents.length} upcoming events:\n\n${upcomingEvents.slice(0, 3).map(e => `• ${e.title} - ${new Date(e.start_time).toLocaleDateString()}`).join('\n')}`);
              } else {
                alert('No upcoming events scheduled.');
              }
            }}
            aria-label="Reminders"
            title="View upcoming events"
          >
            <Bell size={20} />
            {upcomingEventsCount > 0 && (
              <span className="badge badge-warning">{upcomingEventsCount}</span>
            )}
          </button>


          {/* Settings Button */}
          <button 
            className="header-icon-button" 
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={20} />
          </button>

          {/* Create Event Button */}
          <button 
            className="create-button"
            onClick={() => openEventModal()}
            title="Create new event"
          >
            <Plus size={20} />
            <span>Create</span>
          </button>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        events={events}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default Header;
