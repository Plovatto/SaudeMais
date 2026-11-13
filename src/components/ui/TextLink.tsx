import { Link, type LinkProps } from 'react-router';
import { cx } from '@lib/cx';

export function TextLink({ className, ...props }: LinkProps) {
  return (
    <Link
      className={cx(
        'text-role-text can-hover:decoration-2 font-medium underline decoration-1 underline-offset-2',
        className,
      )}
      {...props}
    />
  );
}
