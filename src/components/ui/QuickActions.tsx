import type { IconType } from 'react-icons';
import { LuArrowRight } from 'react-icons/lu';
import { Link } from 'react-router';
import { cx } from '@lib/cx';
import { softTones } from './styles';

export interface QuickAction {
  to: string;
  title: string;
  hint: string;
  icon: IconType;
  primary?: boolean;
}

export interface QuickActionsProps {
  label: string;
  actions: readonly QuickAction[];
}

export function QuickActions({ label, actions }: QuickActionsProps) {
  return (
    <nav aria-label={label} className="@container">
      <div className="grid grid-cols-2 gap-2.5 @min-[560px]:gap-4">
        {actions.map(({ to, title, hint, icon: Icon, primary }) => (
          <Link
            key={to}
            to={to}
            className={cx(
              'group can-hover:-translate-y-px flex flex-col items-start gap-3 rounded-[18px] border p-4 transition-[translate,box-shadow,border-color] duration-150 @min-[560px]:flex-row @min-[560px]:items-center @min-[560px]:gap-4 @min-[560px]:px-[22px] @min-[560px]:py-5',
              primary
                ? 'border-role-strong bg-role-strong text-on-role shadow-[0_14px_30px_-16px_var(--role-strong)]'
                : 'border-border bg-surface text-text shadow-card can-hover:border-role-soft-strong can-hover:shadow-raised',
            )}
          >
            <span
              className={cx(
                '@min-[560px]:rounded-card grid size-11 shrink-0 place-items-center rounded-[13px] @min-[560px]:size-[52px]',
                primary ? 'text-on-role bg-white/16' : softTones.info,
              )}
            >
              <Icon aria-hidden className="size-[22px]" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[0.96875rem] font-[650] tracking-[-0.01em] @min-[560px]:text-[1.0625rem]">
                {title}
              </span>
              <span
                className={cx(
                  'text-xs/normal @min-[560px]:text-[0.8125rem]',
                  primary ? 'text-on-role' : 'text-text-secondary',
                )}
              >
                {hint}
              </span>
            </span>
            <LuArrowRight
              aria-hidden
              className={cx(
                'size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-[3px] @max-[559px]:hidden',
                primary ? 'text-on-role' : 'text-text-muted',
              )}
            />
          </Link>
        ))}
      </div>
    </nav>
  );
}
