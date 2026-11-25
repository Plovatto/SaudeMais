import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { LuClock, LuFlaskConical, LuMapPin } from 'react-icons/lu';
import { BookingForm, fieldGrid, NotesCard, WhenCard } from '@components/booking-form/BookingForm';
import { Reveal } from '@components/booking-form/Reveal';
import { whenItem } from '@components/booking-form/when';
import { toBody } from '@components/booking-form/slot-schema';
import { useBookingForm } from '@components/booking-form/useBookingForm';
import { Dropdown, FormAlert, InfoList, QueryError, SectionCard } from '@components/ui';
import { useActiveExamTypes, useActiveUnits } from '@hooks/useActiveCatalog';
import { whenText } from '@lib/date';
import { queryKeys } from '@lib/query-keys';
import { examApi, type ExamBooking } from './exam-api';
import { emptyExam, examSchema } from './exam-schema';
import { NO_PREPARATION } from './preparation';

const FIELDS = ['examTypeId', 'unitId', 'startsAt', 'notes'] as const;

const UNIT_GONE_MESSAGE = 'Este local não faz mais este exame. Escolha outro.';

const examMessages = {
  NOT_FOUND: 'Este exame não está mais disponível neste local. Escolha outro.',
} as const;

function unitsPlaceholder(examTypeId: string, units: ReturnType<typeof useActiveUnits>) {
  if (!examTypeId) return 'Escolha o exame primeiro';
  if (units.isPending) return 'Carregando locais…';
  return units.data?.length === 0 ? 'Nenhum local faz este exame' : 'Escolha o local';
}

export function ExamForm({ onBooked }: { onBooked: (exam: ExamBooking) => void }) {
  const queryClient = useQueryClient();
  const form = useForm({ resolver: zodResolver(examSchema), defaultValues: emptyExam });
  const { control, getValues, setValue, setError } = form;
  const [examTypeId, unitId] = useWatch({ control, name: ['examTypeId', 'unitId'] });
  const examTypes = useActiveExamTypes();
  const units = useActiveUnits(examTypeId);
  const booking = useBookingForm(form, {
    fields: FIELDS,
    availability: {
      queryKey: queryKeys.booking.examAvailability(unitId, examTypeId),
      load: (signal, page) => examApi.availability(unitId, examTypeId, page, signal),
      enabled: unitId !== '' && examTypeId !== '',
    },
    messages: examMessages,
    onNotFound: () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.activeUnitsFor(examTypeId) }),
    book: (values) => examApi.book(toBody(values)),
    onBooked,
  });
  const dropGoneUnit = useEffectEvent((available: { id: string }[]) => {
    const chosen = getValues('unitId');
    if (!chosen || available.some((item) => item.id === chosen)) return;
    setValue('unitId', '');
    booking.clearDay();
    setError('unitId', { message: UNIT_GONE_MESSAGE });
  });

  useEffect(() => {
    if (units.data) dropGoneUnit(units.data);
  }, [units.data]);

  const examType = examTypes.data?.find((item) => item.id === examTypeId);
  const unit = units.data?.find((item) => item.id === unitId);
  const catalogError = examTypes.error ?? units.error;
  const kind = examType?.kind === 'imaging' ? 'Exame de imagem' : 'Exame laboratorial';

  return (
    <BookingForm
      label="Dados do exame"
      heading={{ title: 'Agendar exame', subtitle: 'Escolha o exame, a unidade e um horário livre.' }}
      booking={booking}
      submitLabel="Agendar exame"
      shortLabel="Agendar"
      summary={{
        title: 'Seu exame',
        line: booking.startsAt ? whenText(booking.startsAt) : null,
        sub: [examType?.name, unit?.name].filter(Boolean).join(' · ') || 'Escolha o exame',
        note: 'O exame já fica confirmado.',
        details: (
          <InfoList
            items={[
              {
                key: 'exam',
                icon: <LuFlaskConical />,
                label: examType ? kind : 'Exame',
                value: examType?.name ?? '—',
                hint: examType && (examType.preparationNotes ?? NO_PREPARATION),
              },
              {
                key: 'unit',
                icon: <LuMapPin />,
                label: 'Local',
                value: unit?.name ?? '—',
                hint: unit?.address,
              },
              whenItem(booking.startsAt),
            ]}
          />
        ),
      }}
    >
      {catalogError && (
        <QueryError
          error={catalogError}
          onRetry={() => {
            void examTypes.refetch();
            if (examTypeId) void units.refetch();
          }}
        />
      )}
      <SectionCard title="Exame">
        <div className={fieldGrid}>
          <Controller
            control={control}
            name="examTypeId"
            render={({ field, fieldState }) => (
              <Dropdown
                ref={field.ref}
                label="Exame"
                placeholder="Escolha o exame"
                icon={<LuFlaskConical />}
                disabled={!examTypes.data}
                options={(examTypes.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                  hint: item.preparationNotes ?? NO_PREPARATION,
                }))}
                value={field.value}
                error={fieldState.error?.message}
                onChange={(next) => {
                  field.onChange(next);
                  setValue('unitId', '');
                  booking.clearDay();
                }}
              />
            )}
          />
          <Controller
            control={control}
            name="unitId"
            render={({ field, fieldState }) => (
              <Dropdown
                ref={field.ref}
                label="Unidade"
                placeholder={unitsPlaceholder(examTypeId, units)}
                icon={<LuMapPin />}
                disabled={!examTypeId || !units.data?.length}
                options={(units.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                  hint: item.address,
                }))}
                value={field.value}
                error={fieldState.error?.message}
                onChange={(next) => {
                  field.onChange(next);
                  booking.clearDay();
                }}
              />
            )}
          />
        </div>
        {examType && (
          <FormAlert tone="info" role="note" icon={<LuClock />}>
            <span className="font-normal">
              <strong className="font-semibold">Preparo:</strong>{' '}
              {examType.preparationNotes ?? NO_PREPARATION.toLowerCase()}. Leve um documento com foto e o
              pedido médico.
            </span>
          </FormAlert>
        )}
      </SectionCard>
      <Reveal show={examTypeId !== '' && unitId !== ''} className="flex flex-col gap-4 lg:gap-5">
        <WhenCard
          booking={booking}
          emptyNote="Este local não tem vagas livres para o exame nas próximas semanas. Escolha outro local."
        />
        <NotesCard booking={booking} placeholder="Algo que a unidade deva saber antes do exame" />
      </Reveal>
    </BookingForm>
  );
}
