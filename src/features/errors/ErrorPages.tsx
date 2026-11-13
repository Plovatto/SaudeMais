import { LuSearchX, LuShieldAlert, LuWifiOff } from 'react-icons/lu';
import { Button, ButtonLink } from '@components/ui';
import { ErrorScreen } from './ErrorScreen';

const homeLink = <ButtonLink to="/">Voltar ao início</ButtonLink>;

export function NotFoundPage() {
  return (
    <ErrorScreen
      icon={<LuSearchX />}
      title="Página não encontrada"
      description="O endereço pode estar errado ou a página mudou de lugar."
      action={homeLink}
    />
  );
}

export function ForbiddenPage() {
  return (
    <ErrorScreen
      icon={<LuShieldAlert />}
      title="Acesso negado"
      description="Sua conta não tem permissão para abrir esta página."
      action={homeLink}
    />
  );
}

export function ConnectionErrorPage({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorScreen
      icon={<LuWifiOff />}
      title="Não foi possível conectar"
      description="Verifique sua internet e tente de novo."
      action={<Button onClick={onRetry}>Tentar de novo</Button>}
    />
  );
}
