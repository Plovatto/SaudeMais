import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LuPlus } from 'react-icons/lu';
import { Button, Input } from '@components/ui';
import { formatDateTime, formatRelative } from '@lib/date';
import { queryKeys } from '@lib/query-keys';
import { ApiKeyDialog } from './ApiKeyDialog';
import { integrationMessages } from './catalog-messages';
import { FormShell } from './FormShell';
import { ItemList } from './ItemList';
import { PagedList } from './PagedList';
import { integrationsApi, type IntegrationClient } from './settings-api';
import { integrationSchema } from './settings-schemas';
import { SettingsRow } from './SettingsRow';
import { SettingsSection } from './SettingsSection';
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

function ClientDetails({ client }: { client: IntegrationClient }) {
  const rows: [string, ReactNode][] = [
    ['Chave', <span className="text-text font-mono">{`slab_${client.keyPrefix}_…`}</span>],
    ['Criada em', formatDateTime(client.createdAt)],
    ['Último uso', client.lastUsedAt ? formatRelative(client.lastUsedAt) : 'Nunca usada'],
  ];
  if (client.revokedAt) rows.push(['Revogada em', formatDateTime(client.revokedAt)]);
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
      {rows.map(([term, value]) => (
        <div key={term} className="contents">
          <dt>{term}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function IntegrationsSection() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const editor = useCatalogEditor<null>(headingRef);
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
    <SettingsSection
      title="Integrações"
      description="Chaves de API para o laboratório enviar resultados de exame. A chave completa aparece só uma vez, ao criar a integração."
      headingRef={headingRef}
      action={
        <Button icon={<LuPlus />} onClick={editor.create}>
          {CREATE_LABEL}
        </Button>
      }
    >
      <PagedList
        queryKey={queryKeys.catalog.integrations}
        load={integrationsApi.list}
        messages={integrationMessages}
      >
        {(items) => (
          <ItemList
            items={items}
            keyOf={idOf}
            empty={{
              title: 'Nenhuma integração criada',
              description: 'As integrações aparecem aqui, com o começo da chave para identificá-las.',
              actionLabel: CREATE_LABEL,
              onCreate: editor.create,
            }}
            renderItem={(client) => (
              <SettingsRow
                name={client.name}
                details={<ClientDetails client={client} />}
                status={client.revokedAt ? 'Revogada' : 'Ativa'}
                tone={client.revokedAt ? 'neutral' : 'success'}
              >
                {!client.revokedAt && (
                  <Button
                    variant="danger-outline"
                    aria-label={`Revogar ${client.name}`}
                    loading={revoke.isBusy(client)}
                    onClick={() => revoke.ask(client)}
                  >
                    Revogar
                  </Button>
                )}
              </SettingsRow>
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
      <ApiKeyDialog apiKey={apiKey} onClose={() => setApiKey(null)} fallbackFocus={headingRef} />
    </SettingsSection>
  );
}
