import type { StatusDisplay } from '@components/bookings/booking-display';
import type { ResultItem } from './ResultVersion';

export const flags: Record<ResultItem['flag'], Omit<StatusDisplay, 'icon'>> = {
  normal: { label: 'Normal', tone: 'success' },
  low: { label: 'Baixo', tone: 'warning' },
  high: { label: 'Alto', tone: 'danger' },
  critical: { label: 'Crítico', tone: 'danger' },
};
