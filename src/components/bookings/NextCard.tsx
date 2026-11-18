import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { LuCalendar } from 'react-icons/lu';
import { Link } from 'react-router';
import { Chevron, IconSlot, QueryError, Skeleton } from '@components/ui';
import { overline } from '@components/ui/styles';
import { cx } from '@lib/cx';
import { DateTile } from './DateTile';

const cardClass = 'rounded-card border-border bg-surface flex flex-col gap-3.5 border px-5 pt-[18px] pb-5';

const nextLabel = cx(overline, 'text-[0.71875rem] font-[650]');

const whenClass =
  'text-text text-[1.0625rem]/[1.25] font-bold tracking-[-0.015em] min-[561px]:text-xl/[1.25]';

type Target = { to: string; onOpen?: undefined } | { to?: undefined; onOpen: () => void };

export type NextItem = Target & {
  startsAt: string;
  when: string;
  detail: string;
  tag?: ReactNode;
};

export interface NextCardProps {
  label: string;
  query: UseQueryResult<unknown>;
  next: NextItem | undefined;
  empty: { title: string; text: string };
}

export function NextCard({ label, query, next, empty }: NextCardProps) {
  if (query.isPending) return <Skeleton className="rounded-card h-[146px]" />;
  if (query.isError && !query.data)
    return <QueryError error={query.error} onRetry={() => void query.refetch()} />;
  if (!next) {
    return (
      <section aria-label={label} className={cx(cardClass, 'shadow-card')}>
        <p className={nextLabel}>{label}</p>
        <div className="flex items-center gap-3.5 min-[561px]:gap-[18px]">
          <IconSlot className="bg-surface-strong text-text-secondary rounded-card size-[52px] justify-center text-[22px]">
            <LuCalendar />
          </IconSlot>
          <div className="flex min-w-0 flex-col gap-1">
            <p className={cx(whenClass, 'min-[561px]:text-[1.0625rem]')}>{empty.title}</p>
            <p className="text-text-secondary text-sm">{empty.text}</p>
          </div>
        </div>
      </section>
    );
  }
  const className = cx(
    cardClass,
    'shadow-raised group can-hover:border-role-soft-strong w-full text-start transition-[border-color,box-shadow] duration-150',
  );
  const content = (
    <>
      <span className="flex items-center justify-between gap-3">
        <span className={nextLabel}>{label}</span>
        {next.tag}
      </span>
      <span className="flex items-center gap-3.5 min-[561px]:gap-[18px]">
        <DateTile startsAt={next.startsAt} size="lg" className="motion-safe:animate-pop" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={cx(whenClass, 'tabular-nums')}>{next.when}</span>
          <span className="text-text-secondary truncate text-sm">{next.detail}</span>
        </span>
        <span className="sr-only">, ver detalhes</span>
        <Chevron />
      </span>
    </>
  );
  return next.to !== undefined ? (
    <Link to={next.to} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" aria-haspopup="dialog" onClick={next.onOpen} className={className}>
      {content}
    </button>
  );
}
