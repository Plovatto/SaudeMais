import type { ReactNode } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
import { IconSlot, StatusChip } from '@components/ui';
import type { Role } from '@constants/areas';
import { formatDateTime } from '@lib/date';
import { formatPhone } from '@lib/phone';

type CancelledBy = Role | 'system';

export interface Cancellation {
  byRole: CancelledBy;
  reason: string | null;
  late: boolean;
  cancelledAt: string;
}

const cancellers: Record<CancelledBy, string> = {
  patient: 'pelo paciente',
  doctor: 'pelo médico',
  admin: 'pela administração',
  system: 'pelo sistema',
};

export function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <IconSlot className="text-text-secondary mt-0.5">{icon}</IconSlot>
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

export function Note({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-surface-muted rounded-field flex flex-col gap-1 px-3 py-2.5">
      <dt className="text-text-secondary text-xs font-semibold">{label}</dt>
      <dd className="text-text break-words whitespace-pre-line">{children}</dd>
    </div>
  );
}

export function CancellationNote({ cancellation, viewer }: { cancellation: Cancellation; viewer: Role }) {
  const by = cancellation.byRole === viewer ? 'por você' : cancellers[cancellation.byRole];
  return (
    <Note label={`Cancelada ${by} em ${formatDateTime(cancellation.cancelledAt)}`}>
      {cancellation.reason ? `Motivo: ${cancellation.reason}` : 'Nenhum motivo informado.'}
      {cancellation.late && (
        <StatusChip tone="warning" icon={<LuTriangleAlert />} className="mt-2 flex w-fit">
          Cancelamento tardio
        </StatusChip>
      )}
    </Note>
  );
}

export function PhoneLink({ phone }: { phone: string }) {
  return (
    <a href={`tel:${phone}`} className="text-role-text font-medium underline underline-offset-2">
      {formatPhone(phone)}
    </a>
  );
}
