import { LuSearchX, LuShieldAlert, LuTriangleAlert, LuWifiOff } from 'react-icons/lu';
import { Button, ButtonLink } from '@components/ui';
import { ErrorScreen } from './ErrorScreen';

const homeLink = <ButtonLink to="/">Voltar ao início</ButtonLink>;

interface RetryProps {
  onRetry: () => void;
}

const retryButton = (onRetry: () => void) => <Button onClick={onRetry}>Tentar de novo</Button>;

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

export function ConnectionErrorPage({ onRetry }: RetryProps) {
  return (
    <ErrorScreen
      icon={<LuWifiOff />}
      title="Não foi possível conectar"
      description="Verifique sua internet e tente de novo."
      action={retryButton(onRetry)}
    />
  );
}

export function UnexpectedErrorPage({ onRetry }: RetryProps) {
  return (
    <ErrorScreen
      icon={<LuTriangleAlert />}
      title="Algo deu errado"
      description="Tente de novo. Se continuar, volte mais tarde."
      action={retryButton(onRetry)}
    />
  );
}
