import type { ComponentProps } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { paginationRange } from './pagination-range';
import { buttonVariants, squareButton, type ButtonVariant } from './styles';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
  className?: string;
}

interface PageButtonProps extends ComponentProps<'button'> {
  variant: ButtonVariant;
  target: number;
  unavailable?: boolean;
  onPageChange: (page: number) => void;
}

function PageButton({ variant, target, unavailable, onPageChange, ...props }: PageButtonProps) {
  return (
    <li>
      <button
        type="button"
        aria-disabled={unavailable || undefined}
        onClick={() => {
          if (!unavailable) onPageChange(target);
        }}
        className={cx(squareButton, buttonVariants[variant], 'text-sm font-semibold')}
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
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  const arrows = [
    {
      label: 'Página anterior',
      icon: <LuChevronLeft aria-hidden className="text-lg" />,
      target: current - 1,
    },
    {
      label: 'Próxima página',
      icon: <LuChevronRight aria-hidden className="text-lg" />,
      target: current + 1,
    },
  ] as const;
  const arrow = ({ label: arrowLabel, icon, target }: (typeof arrows)[number]) => (
    <PageButton
      key={arrowLabel}
      variant="ghost"
      target={target}
      unavailable={target < 1 || target > totalPages}
      onPageChange={onPageChange}
      aria-label={arrowLabel}
    >
      {icon}
    </PageButton>
  );

  return (
    <nav aria-label={label} className={className}>
      <ul className="flex items-center justify-center gap-1.5">
        {arrow(arrows[0])}
        {paginationRange(current, totalPages).map((entry, index) =>
          entry === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden className="text-text-secondary px-1">
              …
            </li>
          ) : (
            <PageButton
              key={entry}
              variant={entry === current ? 'primary' : 'secondary'}
              target={entry}
              onPageChange={onPageChange}
              aria-label={`Página ${entry}`}
              aria-current={entry === current ? 'page' : undefined}
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
