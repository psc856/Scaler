import React from 'react';
import { EVENT_COLORS } from '@utils/colorUtils';
import { Check } from 'lucide-react';
import './ColorPicker.scss';

const ColorPicker = ({ selectedColor, onColorSelect }) => {
  return (
    <div className="color-picker">
      {EVENT_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          className={`color-option ${selectedColor === color.value ? 'selected' : ''}`}
          style={{ backgroundColor: color.value }}
          onClick={() => onColorSelect(color.value)}
          title={color.name}
        >
          {selectedColor === color.value && (
            <Check size={16} color="white" />
          )}
        </button>
      ))}
    </div>
  );
};

export default ColorPicker;
