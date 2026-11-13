import { Link, type LinkProps } from 'react-router';
import { cx } from '@lib/cx';

export interface TextLinkProps extends LinkProps {
  newTab?: boolean;
}

export function TextLink({ className, newTab = false, children, ...props }: TextLinkProps) {
  return (
    <Link
      className={cx(
        'text-role-text can-hover:decoration-2 font-medium underline decoration-1 underline-offset-2',
        className,
      )}
      {...(newTab && { target: '_blank', rel: 'noopener noreferrer' })}
      {...props}
    >
      {children}
      {newTab && <span className="sr-only"> (abre em nova aba)</span>}
    </Link>
  );
}
