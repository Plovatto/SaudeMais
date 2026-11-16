import { useRef, useState, type RefObject } from 'react';
import { LuCopy } from 'react-icons/lu';
import { Button, Dialog, FormAlert, Input } from '@components/ui';

export interface ApiKeyDialogProps {
  apiKey: string | null;
  onClose: () => void;
  fallbackFocus: RefObject<HTMLElement | null>;
}

const copyStatus = {
  idle: '',
  copied: 'Chave copiada.',
  manual: 'Não foi possível copiar automaticamente. A chave está selecionada para você copiar.',
};

export function ApiKeyDialog({ apiKey, onClose, fallbackFocus }: ApiKeyDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<keyof typeof copyStatus>('idle');

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      inputRef.current?.select();
      setStatus('manual');
    }
  };

  const close = () => {
    setStatus('idle');
    onClose();
  };

  return (
    <Dialog
      open={apiKey !== null}
      onClose={close}
      title="Chave da integração"
      description="Use esta chave no cabeçalho X-Api-Key das chamadas do laboratório."
      dismissible={false}
      initialFocus={copyRef}
      fallbackFocus={fallbackFocus}
    >
      {apiKey !== null && (
        <>
          <FormAlert tone="warning" role="note">
            Esta chave não será exibida de novo. Copie e guarde em local seguro antes de fechar.
          </FormAlert>
          <Input
            ref={inputRef}
            label="Chave de API"
            value={apiKey}
            readOnly
            spellCheck={false}
            autoComplete="off"
            onFocus={(event) => event.currentTarget.select()}
            className="[&_input]:font-mono [&_input]:text-sm"
          />
          <div className="flex flex-wrap items-center justify-end gap-3">
            <p role="status" className="text-text-secondary min-w-0 flex-1 basis-48 text-sm">
              {copyStatus[status]}
            </p>
            <Button ref={copyRef} variant="secondary" icon={<LuCopy />} onClick={() => void copy(apiKey)}>
              Copiar
            </Button>
            <Button onClick={close}>Já copiei</Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
