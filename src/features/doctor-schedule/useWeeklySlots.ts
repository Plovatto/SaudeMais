import { useWatch, type Control } from 'react-hook-form';
import { weeklySlots, type ScheduleValues } from './schedule-schema';

export function useWeeklySlots(control: Control<ScheduleValues>): number {
  const [days, appointmentDurationMin] = useWatch({ control, name: ['days', 'appointmentDurationMin'] });
  return weeklySlots({ days, appointmentDurationMin });
}
