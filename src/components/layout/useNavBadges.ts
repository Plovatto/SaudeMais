import { useQuery } from '@tanstack/react-query';
import type { NavBadge, Role } from '@constants/areas';
import { doctorHomeQuery } from '@features/doctor-agenda/doctor-api';
import { patientHomeQuery } from '@features/patient-home/patient-home-api';

export function useNavBadges(role: Role): Record<NavBadge, number | undefined> {
  const patient = useQuery({ ...patientHomeQuery, enabled: role === 'patient' }).data;
  const doctor = useQuery({ ...doctorHomeQuery, enabled: role === 'doctor' }).data;
  return { 'patient-upcoming': patient?.counts.upcoming, 'doctor-pending': doctor?.counts.pending };
}
