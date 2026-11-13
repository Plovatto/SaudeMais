import { LuArrowLeft } from 'react-icons/lu';
import { useLocation, useNavigate } from 'react-router';
import { IconButton } from '@components/ui';
import { PageTitle } from './PageTitle';

export interface PageHeaderProps {
  title: string;
  back?: boolean;
  backFallback?: string;
}

export function PageHeader({ title, back = false, backFallback = '/' }: PageHeaderProps) {
  const navigate = useNavigate();
  const { key } = useLocation();
  const goBack = () => void (key === 'default' ? navigate(backFallback) : navigate(-1));
  return (
    <header className="mb-6 flex items-center gap-2">
      {back && <IconButton label="Voltar" icon={<LuArrowLeft />} onClick={goBack} />}
      <PageTitle>{title}</PageTitle>
    </header>
  );
}
