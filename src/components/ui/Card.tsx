import type { ComponentProps, ElementType } from 'react';
import { cx } from '@lib/cx';

const variants = {
  plain: 'rounded-card border border-border bg-surface shadow-card',
  elevated: 'rounded-card border border-border bg-surface p-5 shadow-card',
  raised: 'rounded-card border border-border bg-surface p-5 shadow-raised',
  outlined: 'rounded-tile border border-border bg-surface p-4',
};

type CardElement = 'div' | 'section' | 'article';

export type CardProps<Element extends CardElement = 'div'> = ComponentProps<Element> & {
  as?: Element;
  variant?: keyof typeof variants;
};

export function Card<Element extends CardElement = 'div'>({
  as,
  variant = 'elevated',
  className,
  ...props
}: CardProps<Element>) {
  const Tag = (as ?? 'div') as ElementType;
  return <Tag className={cx(variants[variant], className)} {...props} />;
}
