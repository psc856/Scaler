import { useEffect } from 'react';

const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Check each shortcut
      for (const [combo, callback] of Object.entries(shortcuts)) {
        const parts = combo.toLowerCase().split('+');
        const requiredKey = parts[parts.length - 1];
        const requiresCtrl = parts.includes('ctrl') || parts.includes('cmd');
        const requiresShift = parts.includes('shift');
        const requiresAlt = parts.includes('alt');

        if (
          key === requiredKey &&
          ctrl === requiresCtrl &&
          shift === requiresShift &&
          alt === requiresAlt
        ) {
          event.preventDefault();
          callback(event);
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};

export default useKeyboardShortcuts;
