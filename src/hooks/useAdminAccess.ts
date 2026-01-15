
import { useState, useEffect } from 'react';
import { isAdmin } from '../services/admin';

export const useAdminAccess = (userId: string | null | undefined) => {
  const [showAdmin, setShowAdmin] = useState(false);
  const isUserAdmin = isAdmin(userId);

  useEffect(() => {
    // Security: If not the admin user, do not even attach the event listener.
    if (!isUserAdmin) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Secret Shortcut: CTRL + SHIFT + K
      if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
        e.preventDefault();
        setShowAdmin(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isUserAdmin]);

  return { showAdmin, setShowAdmin, isUserAdmin };
};
