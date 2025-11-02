import React, { useState, useEffect } from 'react';
import './TimePicker.scss';

const TimePicker = ({ value, onChange, error, minDate }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [period, setPeriod] = useState('AM');

  useEffect(() => {
    if (value) {
      const dateObj = new Date(value);
      
      // Set date (YYYY-MM-DD)
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      
      // Set time (12-hour format)
      let hours = dateObj.getHours();
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      
      // Determine AM/PM
      const newPeriod = hours >= 12 ? 'PM' : 'AM';
      setPeriod(newPeriod);
      
      // Convert to 12-hour format
      hours = hours % 12 || 12;
      setTime(`${String(hours).padStart(2, '0')}:${minutes}`);
    } else {
      // Default to now
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      
      let hours = now.getHours();
      const minutes = String(Math.round(now.getMinutes() / 15) * 15).padStart(2, '0');
      
      const newPeriod = hours >= 12 ? 'PM' : 'AM';
      setPeriod(newPeriod);
      
      hours = hours % 12 || 12;
      setTime(`${String(hours).padStart(2, '0')}:${minutes}`);
    }
  }, [value]);

  const handleUpdate = (newDate, newTime, newPeriod) => {
    if (!newDate || !newTime) return;
    
    const [hours24, minutes] = newTime.split(':').map(Number);
    let adjustedHours = hours24;
    
    // Convert 12-hour to 24-hour format
    if (newPeriod === 'PM' && hours24 !== 12) {
      adjustedHours = hours24 + 12;
    } else if (newPeriod === 'AM' && hours24 === 12) {
      adjustedHours = 0;
    }
    
    const dateObj = new Date(newDate);
    dateObj.setHours(adjustedHours, minutes, 0, 0);
    
    onChange(dateObj.toISOString());
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    handleUpdate(newDate, time, period);
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);
    handleUpdate(date, newTime, period);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    handleUpdate(date, time, newPeriod);
  };

  // Generate time options (15-minute intervals)
  const timeOptions = [];
  for (let hour = 1; hour <= 12; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const hourStr = String(hour).padStart(2, '0');
      const minStr = String(min).padStart(2, '0');
      timeOptions.push(`${hourStr}:${minStr}`);
    }
  }

  const minDateStr = minDate ? new Date(minDate).toISOString().split('T')[0] : '';

  return (
    <div className={`time-picker ${error ? 'error' : ''}`}>
      <input
        type="date"
        value={date}
        onChange={handleDateChange}
        min={minDateStr}
        className="date-input"
      />
      <div className="time-input-group">
        <select 
          value={time} 
          onChange={handleTimeChange}
          className="time-select"
        >
          {timeOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="period-toggle">
          <button
            type="button"
            className={`period-button ${period === 'AM' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('AM')}
          >
            AM
          </button>
          <button
            type="button"
            className={`period-button ${period === 'PM' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('PM')}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimePicker;
