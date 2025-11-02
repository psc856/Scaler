import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import useClickOutside from '@hooks/useClickOutside';
import './LocationPicker.scss';

const LocationPicker = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useClickOutside(() => setShowSuggestions(false));

  // Common location suggestions
  const commonLocations = [
    { name: 'Home', icon: '🏠' },
    { name: 'Office', icon: '🏢' },
    { name: 'Conference Room', icon: '👥' },
    { name: 'Coffee Shop', icon: '☕' },
    { name: 'Restaurant', icon: '🍽️' },
    { name: 'Gym', icon: '💪' },
    { name: 'Library', icon: '📚' },
    { name: 'Park', icon: '🌳' },
  ];

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.length > 2) {
      // Filter common locations
      const filtered = commonLocations.filter(loc =>
        loc.name.toLowerCase().includes(newValue.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion.name);
    onChange(suggestion.name);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
  };

  const handleFocus = () => {
    if (inputValue.length === 0) {
      setSuggestions(commonLocations);
      setShowSuggestions(true);
    }
  };

  return (
    <div className="location-picker" ref={dropdownRef}>
      <div className="location-input-wrapper">
        <MapPin size={18} className="location-icon" />
        <input
          type="text"
          placeholder="Add location (e.g., Office, Home, Coffee Shop)"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className="location-input"
        />
        {inputValue && (
          <button
            type="button"
            className="clear-button"
            onClick={handleClear}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="location-suggestions">
          <p className="suggestions-header">Suggestions</p>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="location-suggestion-item"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <span className="suggestion-icon">{suggestion.icon}</span>
              <span className="suggestion-name">{suggestion.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
