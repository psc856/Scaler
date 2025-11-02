import React, { useState } from 'react';
import './RecurrencePicker.scss';

const RecurrencePicker = ({ value, onChange }) => {
  const [frequency, setFrequency] = useState('DAILY');
  const [interval, setInterval] = useState(1);
  const [count, setCount] = useState(10);

  const handleApply = () => {
    const rule = `FREQ=${frequency};INTERVAL=${interval};COUNT=${count}`;
    onChange(rule);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="recurrence-picker">
      {value ? (
        <div className="recurrence-display">
          <span>{parseRecurrenceRule(value)}</span>
          <button type="button" onClick={handleClear} className="clear-button">
            Clear
          </button>
        </div>
      ) : (
        <details className="recurrence-details">
          <summary>Add recurrence</summary>
          <div className="recurrence-form">
            <div className="form-field">
              <label>Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div className="form-field">
              <label>Every</label>
              <input
                type="number"
                min="1"
                max="30"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value))}
              />
              <span>{frequency === 'DAILY' ? 'day(s)' : frequency === 'WEEKLY' ? 'week(s)' : frequency === 'MONTHLY' ? 'month(s)' : 'year(s)'}</span>
            </div>

            <div className="form-field">
              <label>Number of occurrences</label>
              <input
                type="number"
                min="1"
                max="365"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
              />
            </div>

            <button type="button" onClick={handleApply} className="apply-button">
              Apply
            </button>
          </div>
        </details>
      )}
    </div>
  );
};

const parseRecurrenceRule = (rule) => {
  if (!rule) return 'Does not repeat';
  
  const parts = rule.split(';').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {});

  const freq = parts.FREQ?.toLowerCase() || 'daily';
  const interval = parts.INTERVAL || '1';
  const count = parts.COUNT || '';

  let text = interval === '1' ? freq : `Every ${interval} ${freq}`;
  if (count) {
    text += `, ${count} times`;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default RecurrencePicker;
