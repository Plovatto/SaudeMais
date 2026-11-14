import { useId, useState, type ReactNode } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { Card, IconSlot } from '@components/ui';
import { cx } from '@lib/cx';

export interface ExpandableCardProps {
  headline: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3;
}

export function ExpandableCard({ headline, children, actions, headingLevel = 2 }: ExpandableCardProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  return (
    <Card variant="outlined" className="flex flex-col gap-4">
      <Heading>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((open) => !open)}
          className="rounded-field -m-1 flex w-[calc(100%+0.5rem)] items-start gap-3 p-1 text-start"
        >
          {headline}
          <IconSlot
            className={cx(
              'text-text-secondary mt-0.5 text-lg transition-transform',
              expanded && 'rotate-180',
            )}
          >
            <LuChevronDown />
          </IconSlot>
        </button>
      </Heading>
      <div id={detailsId} hidden={!expanded} className="flex flex-col gap-4">
        {children}
      </div>
      {actions}
    </Card>
  );
}
