import { useEffect, useRef } from 'react';

export function useIntersectionObserver(callback, options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => callback(entry),
      { threshold: 0.6, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [callback, JSON.stringify(options)]);

  return ref;
}
