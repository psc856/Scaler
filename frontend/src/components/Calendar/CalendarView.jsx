import React, { useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US'; // Import directly instead of require
import { useCalendar } from '@contexts/CalendarContext';
import EventCard from '@components/EventCard/EventCard';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.scss';

const locales = {
  'en-US': enUS, // Use direct import
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarView = () => {
  const { 
    events, 
    view, 
    currentDate, 
    setCurrentDate,
    openEventModal,
  } = useCalendar();

  // Custom event component
  const EventComponent = useCallback(({ event }) => {
    return (
      <div 
        className="calendar-event"
        style={{ 
          backgroundColor: event.color,
          borderLeft: `3px solid ${event.color}`
        }}
      >
        <span className="event-title">{event.title}</span>
        {event.location && (
          <span className="event-location">📍 {event.location}</span>
        )}
      </div>
    );
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event) => {
    openEventModal(event);
  }, [openEventModal]);

  // Handle slot selection (create new event)
  const handleSelectSlot = useCallback(({ start, end }) => {
    openEventModal({
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });
  }, [openEventModal]);

  // Custom date header
  const CustomDateHeader = ({ date, label }) => {
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    
    return (
      <div className={`custom-date-header ${isToday ? 'today' : ''}`}>
        <span className="date-label">{label}</span>
      </div>
    );
  };

  // Event style getter
  const eventStyleGetter = useCallback((event) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '4px',
        opacity: 0.95,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '13px',
        padding: '2px 5px',
      }
    };
  }, []);

  // Calendar formats
  const formats = useMemo(() => ({
    dayHeaderFormat: (date) => format(date, 'EEE M/d'),
    dayRangeHeaderFormat: ({ start, end }) => 
      `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`,
    agendaHeaderFormat: ({ start, end }) =>
      `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`,
    monthHeaderFormat: (date) => format(date, 'MMMM yyyy'),
    dayFormat: (date) => format(date, 'd'),
    weekdayFormat: (date) => format(date, 'EEEE'),
  }), []);

  return (
    <div className="calendar-view">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        date={currentDate}
        onNavigate={setCurrentDate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        popup
        components={{
          event: EventComponent,
          day: { header: CustomDateHeader },
        }}
        eventPropGetter={eventStyleGetter}
        formats={formats}
        style={{ height: 'calc(100vh - 120px)' }}
        views={['month', 'week', 'day']}
        step={30}
        showMultiDayTimes
        defaultView="month"
        tooltipAccessor={(event) => event.description || event.title}
      />
    </div>
  );
};

export default CalendarView;
