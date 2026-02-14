"use client";

import { useEffect, useState, RefObject } from "react";

interface MousePosition {
  x: number;
  y: number;
}

/**
 * Hook to track mouse position relative to an element
 * Used for 3D card tilt effects
 *
 * @param elementRef - Ref to the element to track mouse position relative to
 * @returns Object with x and y position (0-1 range, 0.5 is center)
 */
export function useMousePosition(elementRef: RefObject<HTMLElement>): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setPosition({ x, y });
    };

    const handleMouseLeave = () => {
      // Reset to center when mouse leaves
      setPosition({ x: 0.5, y: 0.5 });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [elementRef]);

  return position;
}

/**
 * Convert mouse position to rotation degrees for 3D tilt
 *
 * @param position - Mouse position from useMousePosition
 * @param maxRotation - Maximum rotation in degrees
 * @returns Object with rotateX and rotateY values
 */
export function positionToRotation(
  position: MousePosition,
  maxRotation: number = 10
): { rotateX: number; rotateY: number } {
  // Center is 0.5, 0.5
  // Convert to -1 to 1 range, then to rotation degrees
  const rotateY = (position.x - 0.5) * 2 * maxRotation;
  const rotateX = -(position.y - 0.5) * 2 * maxRotation;

  return { rotateX, rotateY };
}
