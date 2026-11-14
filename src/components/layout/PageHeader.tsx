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
  const backButton = back && <IconButton label="Voltar" icon={<LuArrowLeft />} onClick={goBack} />;
  if (!icon) {
    return (
      <header className="mb-6 flex items-center gap-2">
        {backButton}
        <PageTitle>{title}</PageTitle>
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
      {subtitle && <p className="text-text-secondary text-sm">{subtitle}</p>}
    </header>
  );
}
