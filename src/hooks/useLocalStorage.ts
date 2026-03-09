import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Listen for changes from OTHER components in the same tab
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === key) {
        setStoredValue(detail.value);
      }
    };
    window.addEventListener('local-storage-sync', handler);
    return () => window.removeEventListener('local-storage-sync', handler);
  }, [key]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const nextValue = value instanceof Function ? value(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(nextValue));
        // Broadcast to other hooks using the same key in this tab
        window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key, value: nextValue } }));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
      return nextValue;
    });
  }, [key]);

  return [storedValue, setValue];
}
