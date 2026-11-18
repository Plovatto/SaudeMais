import type { ComponentProps, ReactNode } from 'react';
import { LuChevronRight } from 'react-icons/lu';
import { Link } from 'react-router';
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

export function RowText({ title, meta, titleClassName, metaClassName }: RowTextProps) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className={cx('text-text text-sm font-semibold', titleClassName)}>{title}</span>
      <span className={cx('text-text-secondary text-[0.8125rem]', metaClassName)}>{meta}</span>
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

const rowClass = (selected: boolean) =>
  cx(
    'group relative flex w-full min-w-0 items-center gap-3.5 px-4 py-3.5 text-start transition-colors duration-150 lg:px-5',
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
  const content = (
    <>
      {leading}
      <RowText
        title={title}
        meta={meta}
        titleClassName="text-sm/[1.35] break-words"
        metaClassName="break-words tabular-nums"
      />
      {trailing}
      <Chevron />
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
