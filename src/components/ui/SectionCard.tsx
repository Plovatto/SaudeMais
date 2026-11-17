import { useId, type ComponentProps, type ReactNode } from 'react';
import { cx } from '@lib/cx';

export interface SectionCardProps extends Omit<ComponentProps<'section'>, 'title'> {
  title: string;
  description?: string | undefined;
  action?: ReactNode;
  flush?: boolean;
  raised?: boolean;
}

export function SectionCard({
  title,
  description,
  action,
  flush = false,
  raised = false,
  className,
  children,
  ...props
}: SectionCardProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={cx(
        'rounded-card border-border bg-surface min-w-0 border',
        raised ? 'shadow-raised' : 'shadow-card',
        className,
      )}
      {...props}
    >
      <header className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3.5 lg:px-5">
        <div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
          <h2 id={titleId} className="text-text text-[0.9375rem]/[1.35] font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          {description && <p className="text-text-muted text-[0.8125rem]">{description}</p>}
        </div>
        {action}
      </header>
      <div className={flush ? 'border-border border-t' : 'flex flex-col gap-4 px-4 pt-1 pb-5 lg:px-5'}>
        {children}
      </div>
    </section>
  );
}
