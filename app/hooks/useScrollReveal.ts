"use client";

import { useEffect, useState, RefObject } from "react";

/**
 * Hook for scroll-triggered reveal animations
 * Triggers once when element enters viewport
 *
 * @param elementRef - Ref to the element to observe
 * @param threshold - Percentage of element that must be visible (0-1)
 * @returns boolean indicating if element has been revealed
 */
export function useScrollReveal(
  elementRef: RefObject<Element>,
  threshold: number = 0.1
): boolean {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isRevealed) {
          setIsRevealed(true);
          // Keep observing in case we want to track visibility
        }
      },
      { threshold }
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
  }, [elementRef, threshold, isRevealed]);

  return isRevealed;
}

/**
 * Hook for visibility tracking (can re-trigger)
 *
 * @param elementRef - Ref to the element to observe
 * @param threshold - Percentage of element that must be visible (0-1)
 * @returns boolean indicating current visibility
 */
export function useIsVisible(
  elementRef: RefObject<Element>,
  threshold: number = 0.1
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
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
  }, [elementRef, threshold]);

  return isVisible;
}
