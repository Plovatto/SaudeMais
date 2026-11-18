import type { ReactNode } from 'react';
import { LuFilePen } from 'react-icons/lu';
import { StatusChip } from '@components/ui';
import { formatCivilDate } from '@lib/date';
import type { Version } from './ResultVersion';

export function AmendedChip({ children = 'Retificado' }: { children?: ReactNode }) {
  return (
    <StatusChip tone="info" icon={<LuFilePen />}>
      {children}
    </StatusChip>
  );
}

export function ResultMeta({ version: { status, version, issuedAt } }: { version: Version }) {
  return (
    <span className="text-text-muted flex flex-wrap items-center gap-2 text-xs">
      {status === 'amended' && <AmendedChip>Retificado · versão {version}</AmendedChip>}
      Emitido em {formatCivilDate(issuedAt)}
    </span>
  );
}
