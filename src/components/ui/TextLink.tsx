import { Link, type LinkProps } from 'react-router';
import { cx } from '@lib/cx';
import { textLink } from './styles';

export interface TextLinkProps extends LinkProps {
  newTab?: boolean;
}

export function TextLink({ className, newTab = false, children, ...props }: TextLinkProps) {
  return (
    <Link
      className={cx(textLink, className)}
      {...(newTab && { target: '_blank', rel: 'noopener noreferrer' })}
      {...props}
    >
      {children}
      {newTab && <span className="sr-only"> (abre em nova aba)</span>}
    </Link>
  );
}
