import { useState, useEffect } from 'react';

/**
 * Delays updating the returned value until `delay` ms have passed
 * since the last change. Used to debounce search inputs.
 */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
