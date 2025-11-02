import React from 'react';
import { ChevronLeft, ChevronRight, Bell, Users } from 'lucide-react';
import SharedReminderModal from '../SharedReminderModal/SharedReminderModal';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import './MiniCalendar.scss';

const MiniCalendar = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [isTooltipVisible, setIsTooltipVisible] = React.useState(false);
  const [tooltipContent, setTooltipContent] = React.useState('');
  const [isSharedReminderModalOpen, setIsSharedReminderModalOpen] = React.useState(false);
  const [selectedReminder, setSelectedReminder] = React.useState(null);
  const tooltipRef = React.useRef(null);

  const handleMonthChange = (direction) => {
    setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
    onDateSelect(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
  };

  const showTooltip = (content, event) => {
    setTooltipContent(content);
    setIsTooltipVisible(true);
    if (tooltipRef.current) {
      const rect = event.target.getBoundingClientRect();
      tooltipRef.current.style.top = `${rect.bottom + window.scrollY + 5}px`;
      tooltipRef.current.style.left = `${rect.left + window.scrollX}px`;
    }
  };

  const renderHeader = () => {
    return (
      <div className="mini-calendar-header">
        <div className="navigation-section">
          <button 
            onClick={() => handleMonthChange('prev')}
            onMouseEnter={(e) => showTooltip('Previous month', e)}
            onMouseLeave={() => setIsTooltipVisible(false)}
            aria-label="Previous month"
            className="nav-button"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="month-label">{format(currentMonth, 'MMMM yyyy')}</span>
          <button 
            onClick={() => handleMonthChange('next')}
            onMouseEnter={(e) => showTooltip('Next month', e)}
            onMouseLeave={() => setIsTooltipVisible(false)}
            aria-label="Next month"
            className="nav-button"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="actions-section">
          <button
            className="action-button"
            onClick={() => {
              // Handle reminders view
              setSelectedReminder(null);
              setIsSharedReminderModalOpen(true);
            }}
            onMouseEnter={(e) => showTooltip('Shared reminders', e)}
            onMouseLeave={() => setIsTooltipVisible(false)}
          >
            <Users size={16} />
          </button>
          <button
            className="action-button"
            onClick={() => {
              // Handle notifications
              const hasReminders = true; // Replace with actual check
              if (hasReminders) {
                setSelectedReminder({ id: 'new', date: selectedDate });
                setIsSharedReminderModalOpen(true);
              }
            }}
            onMouseEnter={(e) => showTooltip('Set reminder', e)}
            onMouseLeave={() => setIsTooltipVisible(false)}
          >
            <Bell size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return (
      <div className="mini-calendar-days">
        {days.map((day, index) => (
          <div key={index} className="day-label">{day}</div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        days.push(
          <div
            key={day}
            className={`mini-calendar-cell ${
              !isSameMonth(day, monthStart) ? 'disabled' : ''
            } ${isSameDay(day, selectedDate) ? 'selected' : ''} ${
              isSameDay(day, new Date()) ? 'today' : ''
            }`}
            onClick={() => onDateSelect(cloneDay)}
          >
            <span>{format(day, 'd')}</span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day} className="mini-calendar-row">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="mini-calendar-body">{rows}</div>;
  };

  return (
    <>
      <div className="mini-calendar">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
        {isTooltipVisible && (
          <div 
            className="calendar-tooltip" 
            ref={tooltipRef}
          >
            {tooltipContent}
          </div>
        )}
      </div>

      <SharedReminderModal 
        isOpen={isSharedReminderModalOpen}
        onClose={() => setIsSharedReminderModalOpen(false)}
        reminder={selectedReminder}
        onShare={(emails) => {
          // Handle sharing reminder with emails
          console.log('Sharing reminder with:', emails);
        }}
      />
    </>
  );
};

export default MiniCalendar;
