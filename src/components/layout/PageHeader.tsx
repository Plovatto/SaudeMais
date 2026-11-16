import type { ReactNode } from 'react';
import { LuArrowLeft } from 'react-icons/lu';
import { useLocation, useNavigate } from 'react-router';
import { IconButton, IconSlot } from '@components/ui';
import { PageTitle } from './PageTitle';

export interface PageHeaderProps {
  title: string;
  back?: boolean;
  backFallback?: string;
  icon?: ReactNode;
  subtitle?: string;
}

export function PageHeader({ title, back = false, backFallback = '/', icon, subtitle }: PageHeaderProps) {
  const navigate = useNavigate();
  const { key } = useLocation();
  const goBack = () => void (key === 'default' ? navigate(backFallback) : navigate(-1));
  const backButton = back && (
    <IconButton label="Voltar" icon={<LuArrowLeft />} onClick={goBack} className="print:hidden" />
  );
  const subtitleText = subtitle && <p className="text-text-secondary text-sm">{subtitle}</p>;
  if (!icon) {
    return (
      <header className="mb-6 flex items-center gap-2">
        {backButton}
        <div className="flex min-w-0 flex-col gap-1">
          <PageTitle>{title}</PageTitle>
          {subtitleText}
        </div>
      </header>
    );
  }
  return (
    <header className="relative mb-6 flex flex-col items-center gap-2 px-12 text-center">
      {backButton && <div className="absolute start-0 top-0">{backButton}</div>}
      <IconSlot badge="strong" className="mb-1">
        {icon}
      </IconSlot>
      <PageTitle>{title}</PageTitle>
      {subtitleText}
    </header>
  );
}
