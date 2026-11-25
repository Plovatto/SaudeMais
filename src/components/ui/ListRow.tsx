import type { ComponentProps, ReactNode } from 'react';
import { LuChevronRight } from 'react-icons/lu';
import { Link } from 'react-router';
import { useElementSize } from '@hooks/useElementSize';
import { cx } from '@lib/cx';
import { Skeleton } from './Skeleton';
import { sectionPad } from './styles';

export function Chevron({ className }: { className?: string }) {
  return (
    <LuChevronRight
      aria-hidden
      className={cx(
        'text-text-muted size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5',
        className,
      )}
    />
  );
}

interface RowTextProps {
  title: ReactNode;
  meta: ReactNode;
  titleClassName?: string;
  metaClassName?: string;
}

const rowTitle = 'text-text text-sm font-semibold';
const rowMeta = 'text-text-secondary text-[0.8125rem]';

export function RowText({ title, meta, titleClassName, metaClassName }: RowTextProps) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className={cx(rowTitle, titleClassName)}>{title}</span>
      <span className={cx(rowMeta, metaClassName)}>{meta}</span>
    </span>
  );
}

type SettingRowProps = RowTextProps & {
  as?: 'div' | 'li';
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

export function SettingRow({ as: Tag = 'div', leading, trailing, className, ...text }: SettingRowProps) {
  return (
    <Tag className={cx('flex items-center', className)}>
      {leading}
      <RowText {...text} />
      {trailing}
    </Tag>
  );
}

interface RowContent {
  leading: ReactNode;
  title: ReactNode;
  meta: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
}

type ListRowProps = RowContent &
  (
    | ({ to: string } & Omit<ComponentProps<typeof Link>, 'to' | 'children' | 'title'>)
    | ({ to?: undefined } & Omit<ComponentProps<'button'>, 'children' | 'title'>)
  );

const BADGE_GAP = 8;
const CHEVRON_SPACE = 30;

const rowClass = (selected: boolean) =>
  cx(
    'group @container/row relative flex w-full min-w-0 items-center gap-3.5 px-4 py-3.5 text-start transition-colors duration-150 lg:px-5',
    selected
      ? 'bg-role-soft/60 before:bg-role-strong before:absolute before:inset-y-2.5 before:start-0 before:w-[3px] before:rounded-e-[3px]'
      : 'can-hover:bg-surface-muted',
  );

export function ListRow({
  leading,
  title,
  meta,
  trailing,
  selected = false,
  className,
  ...props
}: ListRowProps) {
  const [badgeRef, badge] = useElementSize<HTMLSpanElement>();
  const content = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="relative block @min-[32rem]/row:grid @min-[32rem]/row:grid-cols-[minmax(0,1fr)_auto] @min-[32rem]/row:items-center @min-[32rem]/row:gap-x-3 @min-[32rem]/row:gap-y-0.5">
          {trailing && badge && (
            <span
              aria-hidden
              className="float-end h-5 @min-[32rem]/row:hidden"
              style={{ width: Math.max(0, badge.width + BADGE_GAP - CHEVRON_SPACE) }}
            />
          )}
          <span
            className={cx(
              rowTitle,
              'block text-sm/[1.35] break-words @min-[32rem]/row:col-start-1 @min-[32rem]/row:row-start-1',
            )}
          >
            {title}
          </span>
          <span
            className={cx(
              rowMeta,
              'mt-0.5 block break-words tabular-nums @min-[32rem]/row:col-start-1 @min-[32rem]/row:row-start-2 @min-[32rem]/row:mt-0',
            )}
          >
            {meta}
          </span>
          {trailing && (
            <span
              ref={badgeRef}
              className="absolute -end-[30px] -top-[3px] flex items-center gap-2 @min-[32rem]/row:static @min-[32rem]/row:col-start-2 @min-[32rem]/row:row-span-2 @min-[32rem]/row:row-start-1"
            >
              {trailing}
            </span>
          )}
        </span>
      </span>
      <Chevron
        className={cx(trailing !== undefined && '@max-[32rem]/row:mb-0.5 @max-[32rem]/row:self-end')}
      />
    </>
  );
  if (props.to !== undefined) {
    return (
      <Link {...props} className={cx(rowClass(selected), className)}>
        {content}
      </Link>
    );
  }
  const { to: _to, ...buttonProps } = props;
  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      {...buttonProps}
      className={cx(rowClass(selected), className)}
    >
      {content}
    </button>
  );
}

export function ListSkeleton() {
  return (
    <div className={cx('flex flex-col gap-3', sectionPad)}>
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
    </div>
  );
}

export function ListMessage({ children }: { children: ReactNode }) {
  return <p className="text-text-muted px-4 py-6 text-center text-[0.8125rem] lg:px-5">{children}</p>;
}

export function ListPlaceholder({ pending, message }: { pending: boolean; message: string }) {
  return pending ? <ListSkeleton /> : <ListMessage>{message}</ListMessage>;
}
