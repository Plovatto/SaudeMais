import { LuPlus } from 'react-icons/lu';
import { Button, type ButtonProps } from '@components/ui';
import { cx } from '@lib/cx';

export function AddButton({ className, ...props }: Omit<ButtonProps, 'variant' | 'icon' | 'fullWidth'>) {
  return (
    <Button
      variant="ghost"
      fullWidth
      icon={<LuPlus />}
      className={cx(
        'border-border-strong can-hover:border-role-strong rounded-tile cursor-pointer border-[1.5px] border-dashed',
        className,
      )}
      {...props}
    />
  );
}
