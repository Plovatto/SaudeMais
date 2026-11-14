import { Button, FormAlert } from '@components/ui';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { catalogMessages } from './catalog-messages';

export function QueryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <FormAlert>{errorMessage(error, catalogMessages)}</FormAlert>
      <Button variant="secondary" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  );
}
