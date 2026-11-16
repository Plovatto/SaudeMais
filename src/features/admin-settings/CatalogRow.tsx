import { LuPencil } from 'react-icons/lu';
import { IconButton, Switch } from '@components/ui';
import { SettingsRow } from './SettingsRow';

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
    <SettingsRow
      name={name}
      details={details}
      status={isActive ? 'Ativo' : 'Inativo'}
      tone={isActive ? 'success' : 'neutral'}
    >
      <Switch checked={isActive} onCheckedChange={onToggle} label={`${name} ativo`} labelHidden busy={busy} />
      <IconButton label={`Editar ${name}`} icon={<LuPencil />} onClick={onEdit} />
    </SettingsRow>
  );
}
