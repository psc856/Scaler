import React, { useState } from 'react';
import { Plus, Calendar as CalendarIcon, Bell, Users, Sparkles } from 'lucide-react';
import { useCalendar } from '@contexts/CalendarContext';
import MiniCalendar from './MiniCalendar';
import './Sidebar.scss';

const Sidebar = () => {
  const { isSidebarCollapsed, openEventModal } = useCalendar();
  const [selectedDate, setSelectedDate] = useState(new Date());

  if (isSidebarCollapsed) {
    return null;
  }

  return (
    <aside className="sidebar">
      <button 
        className="create-event-button"
        onClick={() => openEventModal()}
      >
        <Plus size={20} />
        <span>Create</span>
      </button>

      <MiniCalendar 
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      <div className="sidebar-section">
        <h3 className="section-title">My calendars</h3>
        <div className="calendar-list">
          <div className="calendar-item active">
            <input type="checkbox" id="my-calendar" defaultChecked />
            <label htmlFor="my-calendar">
              <span className="calendar-color" style={{ backgroundColor: '#1967d2' }}></span>
              <span className="calendar-name">My Calendar</span>
            </label>
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">
          <Sparkles size={16} />
          AI Assistant
        </h3>
        <p className="section-description">
          Get smart suggestions for scheduling
        </p>
      </div>

      <div className="sidebar-shortcuts">
        <button className="shortcut-item">
          <CalendarIcon size={18} />
          <span>Events</span>
        </button>
        <button className="shortcut-item">
          <Bell size={18} />
          <span>Reminders</span>
        </button>
        <button className="shortcut-item">
          <Users size={18} />
          <span>Shared</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
