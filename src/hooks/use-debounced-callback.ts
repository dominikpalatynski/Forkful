/**
 * @see https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/hooks/src/use-debounced-callback/use-debounced-callback.ts
 */

import { useCallback, useEffect, useRef } from "react";

import { useCallbackRef } from "./use-callback-ref";

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  options:
    | number
    | { delay: number; flushOnUnmount?: boolean; leading?: boolean },
) {
  const delay = typeof options === "number" ? options : options.delay;
  const flushOnUnmount =
    typeof options === "number" ? false : options.flushOnUnmount;
  const leading = typeof options === "number" ? false : options.leading;

  const handleCallback = useCallbackRef(callback);
  const debounceTimerRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const flushRef = useRef(() => {});
  const leadingRef = useRef(leading);

  const lastCallback = Object.assign(
    useCallback(
      (...args: Parameters<T>) => {
        window.clearTimeout(debounceTimerRef.current);

        if (leading && leadingRef.current) {
          leadingRef.current = false;
          handleCallback(...args);
          return;
        }

        const flush = () => {
          if (debounceTimerRef.current !== 0) {
            debounceTimerRef.current = 0;
            leadingRef.current = true;
            handleCallback(...args);
          }
        };

        flushRef.current = flush;
        lastCallback.flush = flush;
        debounceTimerRef.current = window.setTimeout(flush, delay);
        leadingRef.current = false;
      },
      // eslint-disable-next-line react-hooks/react-compiler
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [handleCallback, delay, leading],
    ),
    { flush: flushRef.current },
  );

  useEffect(
    () => () => {
      window.clearTimeout(debounceTimerRef.current);
      if (flushOnUnmount) {
        lastCallback.flush();
      }
    },
    [lastCallback, flushOnUnmount],
  );

  return lastCallback;
}
