import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { LuInbox, LuPlus } from 'react-icons/lu';
import { Button, Card, Dialog, EmptyState, FormAlert, Input, Select, Skeleton, Switch } from '@components/ui';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { CatalogRow } from './CatalogRow';
import { FormShell } from './FormShell';
import {
  examTypesApi,
  MAX_PAGE_SIZE,
  offersApi,
  unitsApi,
  type ExamOffer,
  type ExamType,
} from './settings-api';
import { offerSchema } from './settings-schemas';
import { SettingsSection } from './SettingsSection';
import { useActiveToggle } from './useActiveToggle';
import { useCatalogForm } from './useCatalogForm';

interface OfferFormProps {
  unitId: string;
  offer: ExamOffer | null;
  examTypes: ExamType[];
  onDone: () => void;
}

function OfferForm({ unitId, offer, examTypes, onDone }: OfferFormProps) {
  const form = useCatalogForm({
    schema: offerSchema,
    defaultValues: offer
      ? { examTypeId: offer.examTypeId, capacityPerSlot: offer.capacityPerSlot, isActive: offer.isActive }
      : { examTypeId: '', capacityPerSlot: 1, isActive: true },
    fields: ['examTypeId', 'capacityPerSlot'],
    save: ({ examTypeId, ...body }) => offersApi.save(unitId, examTypeId, body),
    invalidate: [...queryKeys.catalog.offers, unitId],
    success: 'Oferta salva.',
    onDone,
  });
  const { errors, isSubmitting } = form.formState;
  return (
    <FormShell
      label="Oferta"
      onSubmit={form.onSubmit}
      alert={form.alert}
      submitting={isSubmitting}
      onCancel={onDone}
    >
      <Select
        label="Exame"
        placeholder="Escolha o exame"
        disabled={offer !== null}
        error={errors.examTypeId?.message}
        {...form.register('examTypeId')}
      >
        {examTypes.map((examType) => (
          <option key={examType.id} value={examType.id}>
            {examType.isActive ? examType.name : `${examType.name} (desativado)`}
          </option>
        ))}
      </Select>
      <Input
        label="Exames ao mesmo tempo"
        type="number"
        inputMode="numeric"
        hint="Quantos exames iguais a unidade faz no mesmo horário, de 1 a 50."
        error={errors.capacityPerSlot?.message}
        {...form.register('capacityPerSlot', { valueAsNumber: true })}
      />
      <Controller
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <Switch checked={field.value} onCheckedChange={field.onChange} label="Oferta ativa" />
        )}
      />
    </FormShell>
  );
}

type Editing = { offer: ExamOffer | null } | null;

export function OffersSection() {
  const [unitId, setUnitId] = useState('');
  const [editing, setEditing] = useState<Editing>(null);
  const units = useQuery({
    queryKey: [...queryKeys.catalog.units, 'all'],
    queryFn: ({ signal }) => unitsApi.list(1, signal, MAX_PAGE_SIZE),
  });
  const examTypes = useQuery({
    queryKey: [...queryKeys.catalog.examTypes, 'all'],
    queryFn: ({ signal }) => examTypesApi.list(1, signal, MAX_PAGE_SIZE),
  });
  const offersKey = [...queryKeys.catalog.offers, unitId];
  const offers = useQuery({
    queryKey: offersKey,
    queryFn: ({ signal }) => offersApi.list(unitId, signal),
    enabled: unitId !== '',
  });
  const toggle = useActiveToggle<ExamOffer>({
    nameOf: (offer) => offer.examTypeName,
    setActive: (offer, isActive) =>
      offersApi.save(unitId, offer.examTypeId, { capacityPerSlot: offer.capacityPerSlot, isActive }),
    invalidate: offersKey,
  });
  const close = () => setEditing(null);
  const loadError = units.error ?? examTypes.error ?? offers.error;

  return (
    <SettingsSection
      title="Exames por unidade"
      description="Quais exames cada unidade faz e quantos ao mesmo tempo."
      action={
        unitId !== '' && (
          <Button icon={<LuPlus />} onClick={() => setEditing({ offer: null })}>
            Oferecer exame
          </Button>
        )
      }
    >
      <Select
        label="Unidade"
        placeholder={units.isPending ? 'Carregando unidades…' : 'Escolha a unidade'}
        value={unitId}
        onChange={(event) => setUnitId(event.target.value)}
      >
        {(units.data?.items ?? []).map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
      </Select>
      {units.data && units.data.total > MAX_PAGE_SIZE && (
        <p className="text-text-secondary text-sm">Mostrando as primeiras {MAX_PAGE_SIZE} unidades.</p>
      )}
      {loadError && <FormAlert>{errorMessage(loadError)}</FormAlert>}
      {offers.isFetching && !offers.data && <Skeleton className="h-20" />}
      {offers.data?.length === 0 && (
        <Card>
          <EmptyState
            icon={<LuInbox />}
            title="Nenhum exame oferecido nesta unidade"
            description="Escolha um tipo de exame e quantos a unidade faz ao mesmo tempo."
            action={<Button onClick={() => setEditing({ offer: null })}>Oferecer exame</Button>}
          />
        </Card>
      )}
      {offers.data && offers.data.length > 0 && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {offers.data.map((offer) => (
            <CatalogRow
              key={offer.examTypeId}
              name={offer.examTypeName}
              details={`${offer.capacityPerSlot} ao mesmo tempo`}
              isActive={offer.isActive}
              busy={toggle.busy}
              onToggle={(isActive) => toggle.request(offer, isActive)}
              onEdit={() => setEditing({ offer })}
            />
          ))}
        </ul>
      )}
      <Dialog
        open={editing !== null}
        onClose={close}
        placement="side"
        title={editing?.offer ? `Editar ${editing.offer.examTypeName}` : 'Oferecer exame'}
      >
        {editing && (
          <OfferForm
            unitId={unitId}
            offer={editing.offer}
            examTypes={examTypes.data?.items ?? []}
            onDone={close}
          />
        )}
      </Dialog>
      {toggle.confirmation}
    </SettingsSection>
  );
}
