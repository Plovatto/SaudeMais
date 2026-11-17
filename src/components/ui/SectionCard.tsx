import { useId, type ComponentProps, type ReactNode } from 'react';
import { Card } from './Card';

export interface SectionCardProps extends Omit<ComponentProps<'section'>, 'title'> {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionCard({ title, description, action, children, ...props }: SectionCardProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} {...props}>
      <Card className="flex flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-text text-[0.9375rem] font-semibold tracking-[-0.01em]">
              {title}
            </h2>
            {description && <p className="text-text-muted text-[0.8125rem]">{description}</p>}
          </div>
          {action}
        </header>
        {children}
      </Card>
    </section>
  );
}
