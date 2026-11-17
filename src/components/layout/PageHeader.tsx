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
    <header
      className={cx(
        'mb-4 flex flex-wrap items-start gap-y-5 py-1 lg:mb-6 lg:items-end lg:gap-4',
        target ? 'gap-x-1.5' : 'gap-x-2.5',
        className,
      )}
    >
      {target && (
        <Link
          to={target}
          aria-label="Voltar"
          className="text-text-secondary can-hover:bg-surface-strong rounded-field relative -ms-2 -mt-0.5 grid size-[34px] shrink-0 place-items-center transition-colors duration-150 after:absolute after:-inset-[5px] lg:in-data-shell:hidden print:hidden"
        >
          <LuArrowLeft aria-hidden className="size-[18px]" />
        </Link>
      )}
      <div className="min-w-0 flex-1 basis-0 lg:basis-60">
        <PageTitle>{title}</PageTitle>
        {subtitle && (
          <p className="text-text-muted mt-0.5 line-clamp-1 text-[0.8125rem] lg:mt-1 lg:line-clamp-none lg:text-sm lg:leading-normal">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 gap-2 max-lg:basis-full max-lg:not-has-[>:not(.max-lg:hidden)]:hidden max-lg:[&_svg]:size-[18px] max-lg:[&>*]:min-h-[50px] max-lg:[&>*]:flex-1 max-lg:[&>*]:rounded-[14px] max-lg:[&>*]:text-[0.9375rem]">
          {action}
        </div>
      )}
    </header>
  );
}
