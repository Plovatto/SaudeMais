import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { BookingForm, NotesField, SlotFields } from '@components/booking-form/BookingForm';
import { toBody } from '@components/booking-form/slot-schema';
import { useBookingForm } from '@components/booking-form/useBookingForm';
import { QueryError, Select } from '@components/ui';
import { useActiveExamTypes, useActiveUnits } from '@hooks/useActiveCatalog';
import { queryKeys } from '@lib/query-keys';
import { examApi, type ExamBooking } from './exam-api';
import { emptyExam, examSchema } from './exam-schema';
import { UnitCards } from './UnitCards';

const FIELDS = ['examTypeId', 'unitId', 'startsAt', 'notes'] as const;

const examMessages = {
  NOT_FOUND: 'Este exame não está mais disponível neste local. Escolha outro.',
} as const;

function unitsNote(examTypeId: string, units: ReturnType<typeof useActiveUnits>) {
  if (!examTypeId) return 'Escolha o tipo de exame para ver os locais.';
  if (units.isPending) return 'Carregando locais…';
  return units.data?.length === 0 ? 'Nenhum local faz este exame no momento.' : null;
}

export function ExamForm({ onBooked }: { onBooked: (exam: ExamBooking) => void }) {
  const queryClient = useQueryClient();
  const form = useForm({ resolver: zodResolver(examSchema), defaultValues: emptyExam });
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form;
  const [examTypeId, unitId] = useWatch({ control, name: ['examTypeId', 'unitId'] });
  const examTypes = useActiveExamTypes();
  const units = useActiveUnits(examTypeId);
  const booking = useBookingForm(form, {
    fields: FIELDS,
    availability: {
      queryKey: queryKeys.booking.examAvailability(unitId, examTypeId),
      load: (signal) => examApi.availability(unitId, examTypeId, signal),
      enabled: unitId !== '' && examTypeId !== '',
    },
    messages: examMessages,
    onNotFound: () => void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.activeUnits }),
    book: (values) => examApi.book(toBody(values)),
    onBooked,
  });
  const examType = examTypes.data?.find((item) => item.id === examTypeId);
  const catalogError = examTypes.error ?? units.error;

  return (
    <BookingForm label="Dados do exame" booking={booking} submitLabel="Agendar Exame">
      {catalogError && (
        <QueryError
          error={catalogError}
          onRetry={() => {
            void examTypes.refetch();
            void units.refetch();
          }}
        />
      )}
      <Select
        label="Tipo de exame"
        placeholder="Escolha o tipo de exame"
        disabled={!examTypes.data}
        hint={examType?.preparationNotes ? `Preparo: ${examType.preparationNotes}` : undefined}
        error={errors.examTypeId?.message}
        {...register('examTypeId', {
          onChange: () => {
            setValue('unitId', '');
            booking.clearDay();
          },
        })}
      >
        {examTypes.data?.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </Select>
      <SlotFields
        booking={booking}
        places
        emptyNote="Este local não tem vagas livres para o exame nas próximas semanas. Escolha outro local."
      />
      <NotesField booking={booking} placeholder="Alguma observação sobre o exame" />
      <UnitCards
        units={examTypeId ? units.data : undefined}
        note={unitsNote(examTypeId, units)}
        error={errors.unitId?.message}
        field={register('unitId', { onChange: booking.clearDay })}
      />
    </BookingForm>
  );
}
