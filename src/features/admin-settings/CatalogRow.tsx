import { LuPencil } from 'react-icons/lu';
import { Card, IconButton, StatusChip, Switch } from '@components/ui';

export interface CatalogRowProps {
  name: string;
  details: string;
  isActive: boolean;
  busy: boolean;
  onToggle: (isActive: boolean) => void;
  onEdit: () => void;
}

export function CatalogRow({ name, details, isActive, busy, onToggle, onEdit }: CatalogRowProps) {
  return (
    <li>
      <Card variant="outlined" className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-text font-semibold break-words">{name}</p>
          <p className="text-text-secondary text-sm break-words">{details}</p>
        </div>
        <StatusChip tone={isActive ? 'success' : 'neutral'}>{isActive ? 'Ativo' : 'Inativo'}</StatusChip>
        <Switch
          checked={isActive}
          onCheckedChange={onToggle}
          label={`${name} ativo`}
          labelHidden
          busy={busy}
        />
        <IconButton label={`Editar ${name}`} icon={<LuPencil />} onClick={onEdit} />
      </Card>
    </li>
  );
}
