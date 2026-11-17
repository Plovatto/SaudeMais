import type { ReactNode } from 'react';
import { LuArrowLeft } from 'react-icons/lu';
import { Link, useLocation } from 'react-router';
import { parentUrl } from '@constants/areas';
import { cx } from '@lib/cx';
import { PageTitle } from './PageTitle';

export interface PageHeaderProps {
  title: string;
  subtitle?: string | undefined;
  action?: ReactNode;
  back?: boolean;
  backFallback?: string;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  back = false,
  backFallback,
  className,
}: PageHeaderProps) {
  const { pathname } = useLocation();
  const target = parentUrl(pathname) ?? (back ? backFallback : undefined);
  return (
    <header className={cx('mb-4 flex flex-wrap items-start gap-x-4 gap-y-3 lg:mb-6 lg:items-end', className)}>
      {target && (
        <Link
          to={target}
          aria-label="Voltar"
          className="text-text-secondary can-hover:bg-surface-strong rounded-field -ms-2 -mt-0.5 grid size-[34px] shrink-0 place-items-center transition-colors duration-150 lg:in-data-shell:hidden print:hidden"
        >
          <LuArrowLeft aria-hidden className="size-[18px]" />
        </Link>
      )}
      <div className="min-w-0 flex-1 basis-0 lg:basis-60">
        <PageTitle>{title}</PageTitle>
        {subtitle && (
          <p className="text-text-muted mt-0.5 line-clamp-1 text-[0.8125rem] lg:mt-1 lg:line-clamp-none lg:text-sm">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 gap-2 max-lg:basis-full max-lg:[&>*]:flex-1">{action}</div>}
    </header>
  );
}
