import { useEffect, useRef, useState } from 'react';
import { LuKeyRound, LuPlus } from 'react-icons/lu';
import { Button, Input, SettingRow, StatusChip } from '@components/ui';
import { softTones, tile } from '@components/ui/styles';
import { cx } from '@lib/cx';
import { formatDateTime, formatRelative } from '@lib/date';
import { queryKeys } from '@lib/query-keys';
import { ApiKeyDialog } from './ApiKeyDialog';
import { integrationMessages } from './catalog-messages';
import { FormShell } from './FormShell';
import { ItemList } from './ItemList';
import { PagedList } from './PagedList';
import { integrationsApi, type IntegrationClient } from './settings-api';
import { integrationSchema } from './settings-schemas';
import { SettingsCard } from './SettingsCard';
import { useCatalogEditor } from './useCatalogEditor';
import { useCatalogForm } from './useCatalogForm';
import { useConfirmedAction } from './useConfirmedAction';

const CREATE_LABEL = 'Nova integração';

const idOf = (client: IntegrationClient) => client.id;

function IntegrationForm({
  onCreated,
  onCancel,
  onSubmittingChange,
}: {
  onCreated: (apiKey: string) => void;
  onCancel: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}) {
  const form = useCatalogForm({
    schema: integrationSchema,
    defaultValues: { name: '' },
    fields: ['name'],
    save: async (values) => onCreated((await integrationsApi.create(values)).apiKey),
    invalidate: queryKeys.catalog.integrations,
    success: 'Integração criada.',
    messages: integrationMessages,
  });
  const { errors, isSubmitting } = form.formState;
  useEffect(() => {
    onSubmittingChange(isSubmitting);
    return () => onSubmittingChange(false);
  }, [isSubmitting, onSubmittingChange]);
  return (
    <FormShell
      label="Integração"
      onSubmit={form.onSubmit}
      alert={form.alert}
      submitting={isSubmitting}
      onCancel={onCancel}
      submitLabel="Criar integração"
    >
      <Input
        label="Nome"
        hint="Nome do laboratório ou sistema que vai usar a chave."
        autoComplete="off"
        error={errors.name?.message}
        {...form.register('name')}
      />
    </FormShell>
  );
}

const separated = "not-last:after:text-text-muted not-last:after:ms-1.5 not-last:after:content-['·']";

function ClientDetails({ client }: { client: IntegrationClient }) {
  return (
    <span className="flex flex-wrap gap-x-1.5">
      <span className={cx(separated, 'text-text font-mono')}>{`slab_${client.keyPrefix}_…`}</span>
      <span className={separated}>Criada em {formatDateTime(client.createdAt)}</span>
      {client.revokedAt ? (
        <span className={separated}>Revogada em {formatDateTime(client.revokedAt)}</span>
      ) : (
        <span className={separated}>
          Último uso: <span>{client.lastUsedAt ? formatRelative(client.lastUsedAt) : 'Nunca usada'}</span>
        </span>
      )}
    </span>
  );
}

export function IntegrationsSection() {
  const cardRef = useRef<HTMLElement>(null);
  const editor = useCatalogEditor<null>(cardRef);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const revoke = useConfirmedAction<IntegrationClient>({
    keyOf: idOf,
    run: (client) => integrationsApi.revoke(client.id),
    invalidate: queryKeys.catalog.integrations,
    success: (client) => `Chave de ${client.name} revogada.`,
    confirm: (client) => ({
      title: client ? `Revogar a chave de ${client.name}?` : 'Revogar a chave?',
      description:
        'O laboratório perde o acesso na hora: as próximas chamadas com esta chave serão recusadas. Não é possível desfazer; para integrar de novo, crie outra integração. Os resultados já recebidos continuam guardados.',
      confirmLabel: 'Revogar chave',
    }),
    messages: integrationMessages,
  });

  return (
    <SettingsCard
      id="integracoes"
      ref={cardRef}
      title="Integrações"
      description="Chaves de API para o laboratório enviar resultados de exame."
    >
      <PagedList
        param="pagina-integracoes"
        label="Páginas de integrações"
        queryKey={queryKeys.catalog.integrations}
        load={integrationsApi.list}
        messages={integrationMessages}
        footer={
          <Button variant="secondary" size="sm" icon={<LuPlus />} onClick={editor.create}>
            Adicionar integração
          </Button>
        }
      >
        {(items) => (
          <ItemList
            items={items}
            keyOf={idOf}
            empty="Nenhuma integração criada."
            renderItem={(client) => (
              <SettingRow
                className="flex-wrap gap-x-3.5 gap-y-2 px-4 py-3.5 lg:px-5"
                leading={
                  <span aria-hidden className={cx(tile, client.revokedAt && softTones.neutral)}>
                    <LuKeyRound />
                  </span>
                }
                title={client.name}
                titleClassName="break-words"
                meta={<ClientDetails client={client} />}
                metaClassName="tabular-nums"
                trailing={
                  <span className="flex items-center gap-2.5 max-sm:basis-full max-sm:ps-[50px]">
                    <StatusChip tone={client.revokedAt ? 'neutral' : 'success'}>
                      {client.revokedAt ? 'Revogada' : 'Ativa'}
                    </StatusChip>
                    {!client.revokedAt && (
                      <Button
                        variant="danger-outline"
                        size="sm"
                        aria-label={`Revogar ${client.name}`}
                        loading={revoke.isBusy(client)}
                        onClick={() => revoke.ask(client)}
                      >
                        Revogar
                      </Button>
                    )}
                  </span>
                }
              />
            )}
          />
        )}
      </PagedList>
      {editor.panel(
        () => CREATE_LABEL,
        (_item, close) => (
          <IntegrationForm
            onCreated={(key) => {
              close();
              setApiKey(key);
            }}
            onCancel={close}
            onSubmittingChange={setCreating}
          />
        ),
        !creating,
      )}
      {revoke.confirmation}
      <ApiKeyDialog apiKey={apiKey} onClose={() => setApiKey(null)} fallbackFocus={cardRef} />
    </SettingsCard>
  );
}
