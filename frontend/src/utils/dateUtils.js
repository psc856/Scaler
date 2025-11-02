import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO
} from 'date-fns';

// Format date for display
export const formatDate = (date, formatStr = 'PPP') => {
  return format(new Date(date), formatStr);
};

// Format time for display
export const formatTime = (date, formatStr = 'p') => {
  return format(new Date(date), formatStr);
};

// Get start and end of month
export const getMonthBoundaries = (date) => {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
};

// Get start and end of week
export const getWeekBoundaries = (date) => {
  return {
    start: startOfWeek(date, { weekStartsOn: 0 }),
    end: endOfWeek(date, { weekStartsOn: 0 }),
  };
};

// Navigation helpers
export const navigateMonth = (date, direction) => {
  return direction === 'next' ? addMonths(date, 1) : subMonths(date, 1);
};

export const navigateWeek = (date, direction) => {
  return direction === 'next' ? addWeeks(date, 1) : subWeeks(date, 1);
};

export const navigateDay = (date, direction) => {
  return direction === 'next' ? addDays(date, 1) : subDays(date, 1);
};

// Check if dates are same
export const isSameDayUtil = (date1, date2) => {
  return isSameDay(new Date(date1), new Date(date2));
};

export const isSameMonthUtil = (date1, date2) => {
  return isSameMonth(new Date(date1), new Date(date2));
};

export const isTodayUtil = (date) => {
  return isToday(new Date(date));
};

// Parse ISO string to Date
export const parseISOUtil = (dateString) => {
  return parseISO(dateString);
};

// Get ISO string for API
export const toISOString = (date) => {
  return new Date(date).toISOString();
};

// Calculate duration in minutes
export const calculateDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end - start) / (1000 * 60));
};

// Format duration
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};
