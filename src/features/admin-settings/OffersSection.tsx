import { catalogMessages } from './catalog-messages';
import { useSearchParam } from '@hooks/useSearchParam';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { Controller } from 'react-hook-form';
import { LuPlus } from 'react-icons/lu';
import { Button, Input, Select, Skeleton, Switch, QueryError } from '@components/ui';
import { queryKeys } from '@lib/query-keys';
import { CatalogItems } from './CatalogItems';
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
import { useCatalogEditor } from './useCatalogEditor';
import { useCatalogForm } from './useCatalogForm';

interface OfferFormProps {
  unitId: string;
  offer: ExamOffer | null;
  choices: ExamType[];
  onDone: () => void;
}

function OfferForm({ unitId, offer, choices, onDone }: OfferFormProps) {
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
      {offer ? (
        <Input label="Exame" value={offer.examTypeName} readOnly />
      ) : choices.length === 0 ? (
        <p className="text-text-secondary text-sm">
          Todos os tipos de exame ativos já são oferecidos nesta unidade.
        </p>
      ) : (
        <Select
          label="Exame"
          placeholder="Escolha o exame"
          error={errors.examTypeId?.message}
          {...form.register('examTypeId')}
        >
          {choices.map((examType) => (
            <option key={examType.id} value={examType.id}>
              {examType.name}
            </option>
          ))}
        </Select>
      )}
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

const offerKey = (offer: ExamOffer) => offer.examTypeId;

export function OffersSection() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [unitId, setUnitId] = useSearchParam('unidade');
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
    keyOf: offerKey,
    setActive: (offer, isActive) =>
      offersApi.save(unitId, offer.examTypeId, { capacityPerSlot: offer.capacityPerSlot, isActive }),
    invalidate: offersKey,
  });
  const editor = useCatalogEditor<ExamOffer>(headingRef);
  const failed = [units, examTypes, offers].find((query) => query.isError);
  const offered = new Set((offers.data ?? []).map(offerKey));
  const choices = (examTypes.data?.items ?? []).filter(
    (examType) => examType.isActive && !offered.has(examType.id),
  );

  return (
    <SettingsSection
      title="Exames por unidade"
      description="Quais exames cada unidade faz e quantos ao mesmo tempo."
      headingRef={headingRef}
      action={
        unitId !== '' && (
          <Button icon={<LuPlus />} onClick={editor.create}>
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
      {failed && (
        <QueryError error={failed.error} messages={catalogMessages} onRetry={() => void failed.refetch()} />
      )}
      {offers.isFetching && !offers.data && <Skeleton className="h-20" />}
      <CatalogItems
        items={offers.data}
        keyOf={offerKey}
        describe={(offer) => ({
          name: offer.examTypeName,
          details: `${offer.capacityPerSlot} ao mesmo tempo`,
        })}
        isBusy={toggle.isBusy}
        onToggle={toggle.request}
        onEdit={editor.edit}
        empty={{
          title: 'Nenhum exame oferecido nesta unidade',
          description: 'Escolha um tipo de exame e quantos a unidade faz ao mesmo tempo.',
          actionLabel: 'Oferecer exame',
          onCreate: editor.create,
        }}
      />
      {editor.panel(
        (offer) => (offer ? `Editar ${offer.examTypeName}` : 'Oferecer exame'),
        (offer, close) => (
          <OfferForm unitId={unitId} offer={offer} choices={choices} onDone={close} />
        ),
      )}
      {toggle.confirmation}
    </SettingsSection>
  );
}
