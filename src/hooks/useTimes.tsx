import { useCallback, useEffect, useRef, useMemo } from "react";

const useTimes = (fn: () => void, delay?: number, times?: number) => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  useEffect(() => {
    if (delay < 0) {
      return;
    }
    timerRef.current = setInterval(() => {
      if (countRef.current >= times) {
        clear();
      }
      fn();
      countRef.current += 1;
    }, delay);
    return clear;
  }, [delay, times]);

  return clear;
};

export default useTimes;
