import { useActiveSpecialties, useActiveUnits } from '@hooks/useActiveCatalog';
import type { AdminUserDetail } from './users-api';

interface Choice {
  id: string;
  name: string;
}

const withCurrent = (active: Choice[], current: Choice | undefined): Choice[] =>
  current && !active.some((item) => item.id === current.id)
    ? [...active, { id: current.id, name: `${current.name} (desativada)` }]
    : active;

export function useDoctorCatalog(profile: AdminUserDetail['doctorProfile'], specialtyId: string) {
  const specialties = useActiveSpecialties();
  const units = useActiveUnits();
  return {
    specialties: withCurrent(
      specialties.data ?? [],
      profile ? { id: profile.specialtyId, name: profile.specialtyName } : undefined,
    ),
    units: withCurrent(
      units.data ?? [],
      profile ? { id: profile.unitId, name: profile.unitName } : undefined,
    ),
    council:
      specialties.data?.find((item) => item.id === specialtyId)?.council ??
      (profile?.specialtyId === specialtyId ? profile.council : undefined),
    loading: specialties.isPending || units.isPending,
    error: specialties.error ?? units.error,
  };
}

export type DoctorCatalog = ReturnType<typeof useDoctorCatalog>;
