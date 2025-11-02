// Google Calendar color palette
export const EVENT_COLORS = [
  { name: 'Tomato', value: '#d50000', light: '#ff6659' },
  { name: 'Flamingo', value: '#e67c73', light: '#ffb0a3' },
  { name: 'Tangerine', value: '#f4511e', light: '#ff8752' },
  { name: 'Banana', value: '#f6bf26', light: '#fff357' },
  { name: 'Sage', value: '#33b679', light: '#6ce9ac' },
  { name: 'Basil', value: '#0b8043', light: '#3eb575' },
  { name: 'Peacock', value: '#039be5', light: '#5fd0ff' },
  { name: 'Blueberry', value: '#3f51b5', light: '#7986cb' },
  { name: 'Lavender', value: '#7986cb', light: '#abb2fe' },
  { name: 'Grape', value: '#8e24aa', light: '#c45ddc' },
  { name: 'Graphite', value: '#616161', light: '#8e8e8e' },
];

// Get color name from value
export const getColorName = (colorValue) => {
  const color = EVENT_COLORS.find(c => c.value === colorValue);
  return color ? color.name : 'Default';
};

// Get light variant of color
export const getLightColor = (colorValue) => {
  const color = EVENT_COLORS.find(c => c.value === colorValue);
  return color ? color.light : colorValue;
};

// Check if color is dark
export const isDarkColor = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
};

// Get contrasting text color
export const getContrastingTextColor = (hexColor) => {
  return isDarkColor(hexColor) ? '#ffffff' : '#000000';
};
