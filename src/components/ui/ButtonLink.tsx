import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { cx } from '@lib/cx';
import { buttonClass, ghostEnd, type ButtonStyle } from './styles';

export type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyle;

export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={cx(buttonClass({ variant, size, fullWidth }), className)} {...props} />;
}

export function SectionLink({ className, ...props }: ComponentProps<typeof Link>) {
  return <ButtonLink variant="ghost" size="sm" className={cx(ghostEnd, className)} {...props} />;
}
