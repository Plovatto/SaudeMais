import { useEffect, useRef } from 'react';

export function useLeaveSignal() {
  const leaving = useRef(new AbortController());
  useEffect(() => {
    const controller = new AbortController();
    leaving.current = controller;
    return () => controller.abort();
  }, []);
  return leaving;
}
