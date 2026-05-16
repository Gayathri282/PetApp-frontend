import { useEffect, useRef } from 'react';

export function useIntersectionObserver(callback, options = {}) {
  const ref = useRef(null);
  // ✅ Store latest callback in a ref — observer never needs to recreate
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // ✅ Observer created ONCE — calls latest callback via ref
    // This prevents the "observer recreates → fires immediately → overrides manual pause" bug
    const observer = new IntersectionObserver(
      ([entry]) => callbackRef.current(entry),
      { threshold: 0.6, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — observer lives for component lifetime

  return ref;
}