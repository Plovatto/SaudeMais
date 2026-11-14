import { useId, type ReactNode } from 'react';
import { LuBell, LuChevronRight } from 'react-icons/lu';
import { Link } from 'react-router';
import { IconSlot } from '@components/ui';

export interface NoticeLinkProps {
  label: string;
  to: string;
  title: ReactNode;
  body: string;
  meta?: ReactNode;
  marker?: ReactNode;
  onClick?: () => void;
}

export function NoticeLink({ label, to, title, body, meta, marker, onClick }: NoticeLinkProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">
        {label}
      </h2>
      <Link
        to={to}
        onClick={onClick}
        className="rounded-card border-role/30 bg-role-soft shadow-card text-text can-hover:border-role flex min-h-11 items-start gap-3 border p-4 transition-colors"
      >
        <IconSlot className="bg-surface text-role-text size-10 justify-center rounded-full text-xl">
          <LuBell />
        </IconSlot>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-semibold">{title}</span>
          <span className="text-sm break-words">{body}</span>
          {meta}
        </span>
        {marker}
        <IconSlot className="text-role-text self-center text-xl">
          <LuChevronRight />
        </IconSlot>
      </Link>
    </section>
  );
}
