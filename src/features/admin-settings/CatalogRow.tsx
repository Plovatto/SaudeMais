import type { ReactNode } from 'react';
import { ListRow, StatusChip } from '@components/ui';
import { softTones, tile } from '@components/ui/styles';
import { cx } from '@lib/cx';

export interface CatalogRowProps {
  icon: ReactNode;
  name: string;
  details: string;
  isActive: boolean;
  status: string;
  onEdit: () => void;
}

export function CatalogRow({ icon, name, details, isActive, status, onEdit }: CatalogRowProps) {
  return (
    <ListRow
      leading={
        <span aria-hidden className={cx(tile, !isActive && softTones.neutral)}>
          {icon}
        </span>
      }
      title={name}
      meta={details}
      trailing={<StatusChip tone={isActive ? 'success' : 'neutral'}>{status}</StatusChip>}
      onClick={onEdit}
    />
  );
}
