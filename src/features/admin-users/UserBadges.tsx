import { LuHeartPulse, LuLock, LuShieldCheck, LuStethoscope } from 'react-icons/lu';
import { StatusChip } from '@components/ui';
import type { Role } from '@constants/areas';
import type { UserLocks } from './user-cache';

const roleLabels: Record<Role, string> = { patient: 'Paciente', doctor: 'Médico', admin: 'Admin' };

const ROLE_ORDER: readonly Role[] = ['doctor', 'patient', 'admin'];

export function UserAvatar({ roles }: { roles: readonly Role[] }) {
  const isDoctor = roles.includes('doctor');
  return (
    <span
      data-role={isDoctor ? 'doctor' : 'patient'}
      aria-hidden="true"
      className="bg-role-strong text-on-role rounded-tile grid size-12 shrink-0 place-items-center text-2xl"
    >
      {isDoctor ? <LuStethoscope /> : <LuHeartPulse />}
    </span>
  );
}

export interface UserBadgesProps {
  roles: readonly Role[];
  locks: UserLocks;
  specialty?: string;
}

export function UserBadges({ roles, locks, specialty }: UserBadgesProps) {
  return (
    <ul aria-label="Situação e perfis" className="flex flex-wrap gap-1.5">
      <li>
        <StatusChip tone={locks.isInactive ? 'neutral' : 'success'}>
          {locks.isInactive ? 'Inativo' : 'Ativo'}
        </StatusChip>
      </li>
      {ROLE_ORDER.filter((role) => roles.includes(role)).map((role) => (
        <li key={role} data-role={role}>
          <StatusChip tone="info" icon={role === 'admin' ? <LuShieldCheck /> : undefined}>
            {role === 'doctor' && specialty ? `${roleLabels.doctor} · ${specialty}` : roleLabels[role]}
          </StatusChip>
        </li>
      ))}
      {locks.isProtected && (
        <li>
          <StatusChip tone="warning" icon={<LuLock />}>
            Demonstração
          </StatusChip>
        </li>
      )}
      {locks.isSelf && (
        <li>
          <StatusChip tone="neutral">Você</StatusChip>
        </li>
      )}
    </ul>
  );
}
