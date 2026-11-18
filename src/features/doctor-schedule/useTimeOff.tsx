import { useRef, useState } from 'react';
import type { ScheduleWarning } from './schedule-api';
import { TimeOffCard } from './TimeOffCard';
import { TimeOffDrawer } from './TimeOffDrawer';

export function useTimeOff() {
  const addRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [warnings, setWarnings] = useState<ScheduleWarning[]>([]);
  const card = (
    <TimeOffCard
      warnings={warnings}
      addRef={addRef}
      onAdd={() => {
        setWarnings([]);
        setOpen(true);
      }}
      onRemoved={() => setWarnings([])}
    />
  );
  const drawer = (
    <TimeOffDrawer
      open={open}
      fallbackFocus={addRef}
      onClose={() => setOpen(false)}
      onCreated={setWarnings}
    />
  );
  return { card, drawer };
}
