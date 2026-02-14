"use client";

import { useEffect, useState, RefObject } from "react";

/**
 * Hook for scroll-linked parallax effects
 * Element moves at a different speed than the scroll
 *
 * @param speed - Parallax speed multiplier (0.5 = half speed, 2 = double speed)
 * @returns Y offset to apply as transform
 */
export function useScrollParallax(speed: number = 0.5): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset * speed);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return offset;
}

/**
 * Hook for element-specific parallax based on element position
 *
 * @param elementRef - Ref to the element
 * @param speed - Parallax speed multiplier
 * @returns Y offset to apply as transform
 */
export function useElementParallax(
  elementRef: RefObject<HTMLElement>,
  speed: number = 0.5
): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);

      // Only apply parallax when element is in or near viewport
      if (scrollProgress > -0.1 && scrollProgress < 1.1) {
        setOffset(scrollProgress * rect.height * speed);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, [elementRef, speed]);

  return offset;
}
