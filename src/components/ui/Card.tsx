import type { ComponentProps } from 'react';
import { cx } from '@lib/cx';

const variants = {
  elevated: 'rounded-card border border-border bg-surface p-5 shadow-card',
  raised: 'rounded-card border border-border bg-surface p-5 shadow-raised',
  outlined: 'rounded-tile border border-border bg-surface p-4',
};

export interface CardProps extends ComponentProps<'div'> {
  variant?: keyof typeof variants;
}

export function Card({ variant = 'elevated', className, ...props }: CardProps) {
  return <div className={cx(variants[variant], className)} {...props} />;
}
