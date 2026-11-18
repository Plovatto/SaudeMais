import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { LuBuilding2, LuFlaskConical, LuPlus } from 'react-icons/lu';
import { Button, Dropdown, Input, ListMessage, ListSkeleton, QueryError } from '@components/ui';
import { sectionPad } from '@components/ui/styles';
import { useSearchParam } from '@hooks/useSearchParam';
import { cx } from '@lib/cx';
import { queryKeys } from '@lib/query-keys';
import { catalogMessages } from './catalog-messages';
import { CatalogRow } from './CatalogRow';
import { ActiveField, FormDropdown } from './FormFields';
import { FormShell } from './FormShell';
import { ItemList } from './ItemList';
import {
  examTypesApi,
  MAX_PAGE_SIZE,
  offersApi,
  unitsApi,
  type ExamOffer,
  type ExamType,
} from './settings-api';
import { offerSchema } from './settings-schemas';
import { SettingsCard, SettingsFooter } from './SettingsCard';
import { useCatalogEditor } from './useCatalogEditor';
import { useCatalogForm } from './useCatalogForm';

const OFFER_LABEL = 'Oferecer exame';

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
        <FormDropdown
          control={form.control}
          name="examTypeId"
          label="Exame"
          placeholder="Escolha o exame"
          icon={<LuFlaskConical />}
          options={choices.map((examType) => ({
            value: examType.id,
            label: examType.name,
            hint: `${examType.durationMin} min`,
          }))}
        />
      )}
      <Input
        label="Exames ao mesmo tempo"
        type="number"
        inputMode="numeric"
        hint="Quantos exames iguais a unidade faz no mesmo horário, de 1 a 50."
        error={errors.capacityPerSlot?.message}
        {...form.register('capacityPerSlot', { valueAsNumber: true })}
      />
      <ActiveField
        control={form.control}
        name="isActive"
        label="Oferta ativa"
        hint="Desativada, a unidade deixa de receber agendamentos deste exame."
      />
    </FormShell>
  );
}

const offerKey = (offer: ExamOffer) => offer.examTypeId;

export function OffersSection() {
  const cardRef = useRef<HTMLElement>(null);
  const [unitId, setUnitId] = useSearchParam('unidade');
  const units = useQuery({
    queryKey: [...queryKeys.catalog.units, 'all'],
    queryFn: ({ signal }) => unitsApi.list(1, signal, MAX_PAGE_SIZE),
  });
  const examTypes = useQuery({
    queryKey: [...queryKeys.catalog.examTypes, 'all'],
    queryFn: ({ signal }) => examTypesApi.list(1, signal, MAX_PAGE_SIZE),
  });
  const offers = useQuery({
    queryKey: [...queryKeys.catalog.offers, unitId],
    queryFn: ({ signal }) => offersApi.list(unitId, signal),
    enabled: unitId !== '',
  });
  const editor = useCatalogEditor<ExamOffer>(cardRef);
  const failed = [units, examTypes, offers].find((query) => query.isError);
  const offered = new Set((offers.data ?? []).map(offerKey));
  const choices = (examTypes.data?.items ?? []).filter(
    (examType) => examType.isActive && !offered.has(examType.id),
  );

  return (
    <SettingsCard id="ofertas" ref={cardRef} title="Exames por unidade">
      <div className={cx(sectionPad, 'border-border border-b')}>
        <Dropdown
          label="Unidade"
          labelHidden
          placeholder={units.isPending ? 'Carregando unidades…' : 'Escolha a unidade'}
          icon={<LuBuilding2 />}
          value={unitId}
          onChange={setUnitId}
          hint={
            units.data && units.data.total > MAX_PAGE_SIZE
              ? `Mostrando as primeiras ${MAX_PAGE_SIZE} unidades.`
              : undefined
          }
          options={(units.data?.items ?? []).map((unit) => ({
            value: unit.id,
            label: unit.name,
            hint: unit.address,
          }))}
        />
      </div>
      {failed && (
        <QueryError
          padded
          error={failed.error}
          messages={catalogMessages}
          onRetry={() => void failed.refetch()}
        />
      )}
      {unitId === '' ? (
        <ListMessage>Escolha uma unidade para ver os exames que ela faz.</ListMessage>
      ) : offers.data ? (
        <ItemList
          items={offers.data}
          keyOf={offerKey}
          empty="Nenhum exame oferecido nesta unidade."
          renderItem={(offer) => (
            <CatalogRow
              icon={<LuFlaskConical />}
              name={offer.examTypeName}
              details={`${offer.capacityPerSlot} ao mesmo tempo`}
              isActive={offer.isActive}
              status={offer.isActive ? 'Ativo' : 'Inativo'}
              onEdit={() => editor.edit(offer)}
            />
          )}
        />
      ) : (
        offers.isFetching && <ListSkeleton />
      )}
      {unitId !== '' && (
        <SettingsFooter>
          <Button variant="secondary" size="sm" icon={<LuPlus />} onClick={editor.create}>
            {OFFER_LABEL}
          </Button>
        </SettingsFooter>
      )}
      {editor.panel(
        (offer) => (offer ? `Editar ${offer.examTypeName}` : OFFER_LABEL),
        (offer, close) => (
          <OfferForm unitId={unitId} offer={offer} choices={choices} onDone={close} />
        ),
      )}
    </SettingsCard>
  );
}
