import { errorMessage, type MessageOverrides } from '@lib/messages/errors.pt-BR';
import { Button } from './Button';
import { FormAlert } from './FormAlert';

export interface QueryErrorProps {
  error: unknown;
  onRetry: () => void;
  messages?: MessageOverrides;
}

export function QueryError({ error, onRetry, messages }: QueryErrorProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <FormAlert>{errorMessage(error, messages)}</FormAlert>
      <Button variant="secondary" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  );
}
