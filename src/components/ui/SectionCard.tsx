import { useId, type ComponentProps, type ReactNode } from 'react';
import { cx } from '@lib/cx';
import { headerBar } from './styles';

export interface SectionCardProps extends Omit<ComponentProps<'section'>, 'title'> {
  title: string;
  description?: string | undefined;
  optional?: boolean;
  action?: ReactNode;
  flush?: boolean;
  raised?: boolean;
}

export function SectionCard({
  title,
  description,
  optional = false,
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
      <header className={cx(headerBar, 'flex-wrap gap-y-1 py-3.5')}>
        <div className="flex min-w-0 flex-1 basis-28 flex-col gap-0.5">
          <h2 id={titleId} className="text-text text-[0.9375rem]/[1.35] font-semibold tracking-[-0.01em]">
            {title}
            {optional && (
              <>
                {' '}
                <span className="text-text-muted text-[0.8125rem] font-normal">(opcional)</span>
              </>
            )}
          </h2>
          {description && <p className="text-text-muted text-[0.8125rem]">{description}</p>}
        </div>
        {action && <div className="flex max-w-full shrink-0 items-center gap-x-3">{action}</div>}
      </header>
      <div className={flush ? 'border-border border-t' : 'flex flex-col gap-4 px-4 pt-1 pb-5 lg:px-5'}>
        {children}
      </div>
    </section>
  );
}
