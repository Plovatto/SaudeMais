import { useId, type ReactNode } from 'react';
import { Card } from './Card';

export interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionCard({ title, description, children }: SectionCardProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId}>
      <Card className="flex flex-col gap-5">
        <header className="flex flex-col gap-1">
          <h2 id={titleId} className="text-text text-lg font-semibold">
            {title}
          </h2>
          {description && <p className="text-text-secondary text-sm">{description}</p>}
        </header>
        {children}
      </Card>
    </section>
  );
}
