import { useState, useRef, useLayoutEffect } from 'react';

/**
 * Detects whether a line-clamped element actually overflows its box — i.e.
 * whether there is more text hidden than what's shown. Use it to only render a
 * "Show More" toggle when the text is genuinely truncated.
 *
 * Pass a `key` that changes whenever the content changes (e.g. the era name) and
 * the current `expanded` state. While expanded the element is no longer clamped,
 * so we keep the last measured value instead of re-measuring (which would read as
 * "not overflowing" and wrongly hide the "Show Less" toggle).
 *
 * Returns [ref, isClamped]. Attach `ref` to the clamped element.
 */
export function useIsClamped<T extends HTMLElement>(
  key: unknown,
  expanded: boolean,
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isClamped, setIsClamped] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      setIsClamped(false);
      return;
    }
    const measure = () => {
      if (expanded) return; // element isn't clamped while expanded; keep last value
      setIsClamped(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [key, expanded]);

  return [ref, isClamped];
}
