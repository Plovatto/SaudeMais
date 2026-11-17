import { cx } from '@lib/cx';
import { errorMessage, type MessageOverrides } from '@lib/messages/errors.pt-BR';
import { Button } from './Button';
import { FormAlert } from './FormAlert';
import { sectionPad } from './styles';

export interface QueryErrorProps {
  error: unknown;
  onRetry: () => void;
  messages?: MessageOverrides;
  padded?: boolean;
}

export function QueryError({ error, onRetry, messages, padded = false }: QueryErrorProps) {
  return (
    <div className={cx('flex flex-col items-start gap-3', padded && sectionPad)}>
      <FormAlert>{errorMessage(error, messages)}</FormAlert>
      <Button variant="secondary" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  );
}
