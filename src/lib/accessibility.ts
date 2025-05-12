import { useEffect, useRef, KeyboardEvent } from 'react';

/**
 * Hook to trap focus within a container
 * @param active Whether the focus trap is active
 * @returns Ref to attach to the container element
 */
export function useFocusTrap(active: boolean = true) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Find all focusable elements
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element when the trap becomes active
    firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } 
      // Tab
      else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    // Add event listener
    container.addEventListener('keydown', handleKeyDown as any);

    return () => {
      container.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [active]);

  return containerRef;
}

/**
 * Hook to handle escape key press
 * @param callback Function to call when escape is pressed
 */
export function useEscapeKey(callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [callback]);
}

/**
 * Utility to announce messages to screen readers
 * @param message Message to announce
 * @param politeness ARIA live region politeness setting
 */
export function announceToScreenReader(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  // Create or find the live region element
  let liveRegion = document.getElementById(`sr-live-region-${politeness}`);
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = `sr-live-region-${politeness}`;
    liveRegion.setAttribute('aria-live', politeness);
    liveRegion.setAttribute('aria-relevant', 'additions');
    liveRegion.setAttribute('aria-atomic', 'true');
    
    // Hide visually but keep available to screen readers
    Object.assign(liveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0'
    });
    
    document.body.appendChild(liveRegion);
  }
  
  // Update the content to trigger announcement
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion!.textContent = message;
  }, 50);
}

/**
 * Check if an element is visible to screen readers
 * @param element Element to check
 * @returns Whether the element is accessible to screen readers
 */
export function isAccessibleToScreenReaders(element: HTMLElement): boolean {
  // Check if element or any parent has aria-hidden="true"
  let current: HTMLElement | null = element;
  while (current) {
    if (current.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    current = current.parentElement;
  }
  
  // Check if element is visually hidden
  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    (style.position === 'absolute' && style.width === '1px' && style.height === '1px')
  ) {
    return false;
  }
  
  return true;
}

/**
 * Generate an accessible label for an element
 * @param labelText The visible label text
 * @param description Optional description for more context
 * @returns Object with aria attributes
 */
export function getAccessibleLabel(labelText: string, description?: string) {
  const id = `label-${Math.random().toString(36).substring(2, 9)}`;
  const descriptionId = description ? `desc-${Math.random().toString(36).substring(2, 9)}` : undefined;
  
  return {
    'aria-label': labelText,
    ...(description ? { 'aria-describedby': descriptionId } : {}),
    labelElement: <span id={id} className="sr-only">{labelText}</span>,
    descriptionElement: description ? (
      <span id={descriptionId} className="sr-only">{description}</span>
    ) : null
  };
}