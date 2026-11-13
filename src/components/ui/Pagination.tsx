import type { ComponentProps } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { paginationRange } from './pagination-range';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
  className?: string;
}

const looks = {
  arrow: 'text-role-text enabled:hover:bg-role-soft',
  page: 'border border-role-strong bg-surface text-role-text hover:bg-role-soft',
  current: 'bg-role-strong text-on-role shadow-button',
};

function PageButton({ look, ...props }: ComponentProps<'button'> & { look: keyof typeof looks }) {
  return (
    <li>
      <button
        type="button"
        className={cx(
          'rounded-field inline-flex size-11 items-center justify-center text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
          looks[look],
        )}
        {...props}
      />
    </li>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  label = 'Paginação',
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const arrows = [
    { label: 'Página anterior', icon: <LuChevronLeft aria-hidden className="text-lg" />, target: page - 1 },
    { label: 'Próxima página', icon: <LuChevronRight aria-hidden className="text-lg" />, target: page + 1 },
  ] as const;
  const arrow = ({ label: arrowLabel, icon, target }: (typeof arrows)[number]) => (
    <PageButton
      key={arrowLabel}
      look="arrow"
      aria-label={arrowLabel}
      disabled={target < 1 || target > totalPages}
      onClick={() => onPageChange(target)}
    >
      {icon}
    </PageButton>
  );

  return (
    <nav aria-label={label} className={className}>
      <ul className="flex items-center justify-center gap-1.5">
        {arrow(arrows[0])}
        {paginationRange(page, totalPages).map((entry, index) =>
          entry === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden className="text-text-secondary px-1">
              …
            </li>
          ) : (
            <PageButton
              key={entry}
              look={entry === page ? 'current' : 'page'}
              aria-label={`Página ${entry}`}
              aria-current={entry === page ? 'page' : undefined}
              onClick={() => onPageChange(entry)}
            >
              {entry}
            </PageButton>
          ),
        )}
        {arrow(arrows[1])}
      </ul>
    </nav>
  );
}
