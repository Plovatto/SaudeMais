import { Link, type LinkProps } from 'react-router';
import { cx } from '@lib/cx';
import { buttonClass, type ButtonStyle } from './styles';

export type ButtonLinkProps = LinkProps & ButtonStyle;

export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={cx(buttonClass({ variant, size, fullWidth }), className)} {...props} />;
}
