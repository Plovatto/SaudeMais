import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { queryKeys } from './query-keys';
import { refreshPatientBookings } from './refresh-patient-bookings';

describe('refresh patient bookings', () => {
  it('invalidates bookings and notifications and resets the availability', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.patient.bookings({}), []);
    queryClient.setQueryData(queryKeys.notifications.unread('patient'), 2);
    queryClient.setQueryData(queryKeys.booking.availability('d1'), []);

    await refreshPatientBookings(queryClient);

    expect(queryClient.getQueryState(queryKeys.patient.bookings({}))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.notifications.unread('patient'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(queryKeys.booking.availability('d1'))).toBeUndefined();
  });
});
