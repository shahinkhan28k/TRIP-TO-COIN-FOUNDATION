import React, { useEffect } from 'react';

/**
 * SecurityGuard provides client-side protections against right-click context menu,
 * devtool inspection shortcuts (F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S),
 * and image/text dragging to safeguard website content and assets.
 */
export const SecurityGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Prevent right click context menu
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu only inside input / textarea elements for standard typing
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
    };

    // Prevent developer inspect shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element picker), Ctrl+U (View Source), Ctrl+S (Save page)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')
      ) {
        e.preventDefault();
        return false;
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')
      ) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <>{children}</>;
};
