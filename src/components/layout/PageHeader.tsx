import { LuArrowLeft } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { IconButton } from '@components/ui';
import { PageTitle } from './PageTitle';

export interface PageHeaderProps {
  title: string;
  back?: boolean;
}

export function PageHeader({ title, back = false }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="mb-6 flex items-center gap-2">
      {back && <IconButton label="Voltar" icon={<LuArrowLeft />} onClick={() => void navigate(-1)} />}
      <PageTitle>{title}</PageTitle>
    </header>
  );
}
