import { useEffect, useState } from 'react';
import { MINUTE_MS, todayInSaoPaulo } from '@lib/date';

export function useToday(): string {
  const [today, setToday] = useState(() => todayInSaoPaulo());
  useEffect(() => {
    const refresh = () => setToday(todayInSaoPaulo());
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const id = setInterval(refresh, MINUTE_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return today;
}
