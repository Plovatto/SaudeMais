import { LuX } from 'react-icons/lu';
import { IconButton, type IconButtonProps } from './IconButton';

export function CloseButton({
  label = 'Fechar',
  ...props
}: Omit<IconButtonProps, 'label' | 'icon'> & { label?: string }) {
  return <IconButton label={label} icon={<LuX />} {...props} />;
}
