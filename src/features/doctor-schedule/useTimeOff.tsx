import { useRef, useState } from 'react';
import type { ScheduleWarning } from './schedule-api';
import { TimeOffCard } from './TimeOffCard';
import { TimeOffDrawer } from './TimeOffDrawer';

interface DateWarnings {
  date: string;
  warnings: ScheduleWarning[];
}

export function useTimeOff() {
  const addRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<DateWarnings | null>(null);
  const card = (
    <TimeOffCard
      warnings={created?.warnings ?? []}
      addRef={addRef}
      onAdd={() => {
        setCreated(null);
        setOpen(true);
      }}
      onRemoved={(date) => setCreated((current) => (current?.date === date ? null : current))}
    />
  );
  const drawer = (
    <TimeOffDrawer
      open={open}
      fallbackFocus={addRef}
      onClose={() => setOpen(false)}
      onCreated={(date, warnings) => setCreated({ date, warnings })}
    />
  );
  return { card, drawer };
}
