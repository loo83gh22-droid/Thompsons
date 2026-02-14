"use client";

import { useEffect, useState, RefObject } from "react";

/**
 * Custom hook for scroll-triggered animations using Intersection Observer API
 *
 * @param elementRef - React ref to the element to observe
 * @param options - Optional IntersectionObserver options
 * @returns boolean indicating if element is visible in viewport
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const isVisible = useIntersectionObserver(ref);
 *
 * <div ref={ref} className={isVisible ? 'animate-fade-in' : 'opacity-0'}>
 *   Content
 * </div>
 */
export function useIntersectionObserver(
  elementRef: RefObject<Element | null>,
  options?: IntersectionObserverInit
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, stop observing for performance
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [elementRef, options]);

  return isVisible;
}
