import { LuShieldCheck } from 'react-icons/lu';
import { StatusChip } from '@components/ui';
import type { SoftTone } from '@components/ui/styles';
import type { Role } from '@constants/areas';
import { cx } from '@lib/cx';
import type { UserLocks } from './user-cache';

const ROLE_CHIPS: Record<Role, { label: string; tone: SoftTone }> = {
  doctor: { label: 'Médico', tone: 'accent' },
  admin: { label: 'Administrador', tone: 'neutral' },
  patient: { label: 'Paciente', tone: 'info' },
};

const ROLE_ORDER: readonly Role[] = ['doctor', 'admin', 'patient'];

export function StatusBadge({ inactive }: { inactive: boolean }) {
  return <StatusChip tone={inactive ? 'neutral' : 'success'}>{inactive ? 'Inativo' : 'Ativo'}</StatusChip>;
}

function RoleChip({ role, specialty }: { role: Role; specialty?: string | undefined }) {
  const { label, tone } = ROLE_CHIPS[role];
  return (
    <StatusChip tone={tone} dot={false} icon={role === 'admin' ? <LuShieldCheck /> : undefined}>
      {role === 'doctor' && specialty ? `${label} · ${specialty}` : label}
    </StatusChip>
  );
}

export function RoleChips({ roles, className }: { roles: readonly Role[]; className?: string }) {
  const main = ROLE_ORDER.filter((role) => role !== 'patient' && roles.includes(role));
  return (
    <span className={cx('flex gap-1.5', className)}>
      {(main.length > 0 ? main : (['patient'] as const)).map((role) => (
        <RoleChip key={role} role={role} />
      ))}
    </span>
  );
}

export interface UserBadgesProps {
  roles: readonly Role[];
  locks: UserLocks;
  specialty?: string | undefined;
}

export function UserBadges({ roles, locks, specialty }: UserBadgesProps) {
  return (
    <ul aria-label="Situação e perfis" className="flex flex-wrap gap-1.5">
      <li>
        <StatusBadge inactive={locks.isInactive} />
      </li>
      {ROLE_ORDER.filter((role) => roles.includes(role)).map((role) => (
        <li key={role} data-role={role}>
          <RoleChip role={role} specialty={specialty} />
        </li>
      ))}
      {locks.isSelf && (
        <li>
          <StatusChip tone="neutral">Você</StatusChip>
        </li>
      )}
    </ul>
  );
}
