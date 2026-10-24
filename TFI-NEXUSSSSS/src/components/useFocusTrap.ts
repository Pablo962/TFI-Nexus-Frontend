import { useEffect, useRef } from 'react';

export const useFocusTrap = <T extends HTMLElement>(enabled = true) => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const node = ref.current;
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusable = Array.from(node.querySelectorAll<HTMLElement>(focusableSelector));
    const first = focusable[0] ?? node;
    const previousActive = document.activeElement as HTMLElement | null;
    first.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const current = document.activeElement as HTMLElement | null;
      const elements = Array.from(node.querySelectorAll<HTMLElement>(focusableSelector));

      if (!elements.length) {
        event.preventDefault();
        node.focus();
        return;
      }

      if (event.shiftKey && current === elements[0]) {
        event.preventDefault();
        elements[elements.length - 1]?.focus();
        return;
      }

      if (!event.shiftKey && current === elements[elements.length - 1]) {
        event.preventDefault();
        elements[0]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActive && document.body.contains(previousActive)) previousActive.focus();
    };
  }, [enabled]);

  return ref;
};
