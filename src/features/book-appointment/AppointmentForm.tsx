import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ChangeEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { LuCalendar, LuClock } from 'react-icons/lu';
import { Button, FormAlert, QueryError, Select, Textarea } from '@components/ui';
import { useActiveSpecialties } from '@hooks/useActiveCatalog';
import { ApiError } from '@lib/api/api-error';
import { formatDay, formatTime } from '@lib/date';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { useFormSubmit } from '@lib/useFormSubmit';
import { bookingApi, type Appointment } from './booking-api';
import { bookingSchema, emptyBooking, NOTES_MAX, toBody, visitType, visitTypeLabels } from './booking-schema';

const FIELDS = ['doctorId', 'specialtyId', 'visitType', 'startsAt', 'notes'] as const;

const fieldByCode: Partial<Record<string, (typeof FIELDS)[number]>> = {
  SLOT_TAKEN: 'startsAt',
  PATIENT_CONFLICT: 'startsAt',
  OUTSIDE_AVAILABILITY: 'startsAt',
  SPECIALTY_MISMATCH: 'specialtyId',
  SELF_BOOKING: 'doctorId',
};

const staleSlotCodes = new Set(['SLOT_TAKEN', 'OUTSIDE_AVAILABILITY']);

const bookingMessages = { NOT_FOUND: 'Este médico não está mais disponível. Escolha outro.' } as const;

const MISSING_MESSAGE = 'Preencha todas as informações.';

type SelectChange = ChangeEvent<HTMLSelectElement>;

export function AppointmentForm({ onBooked }: { onBooked: (appointment: Appointment) => void }) {
  const queryClient = useQueryClient();
  const [missing, setMissing] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm({ resolver: zodResolver(bookingSchema), defaultValues: emptyBooking });
  const [doctorId, specialtyId, date] = useWatch({ control, name: ['doctorId', 'specialtyId', 'date'] });
  const specialties = useActiveSpecialties();
  const doctors = useQuery({
    queryKey: queryKeys.booking.doctors(specialtyId),
    queryFn: ({ signal }) => bookingApi.doctors(specialtyId, signal),
    placeholderData: keepPreviousData,
  });
  const availability = useQuery({
    queryKey: queryKeys.booking.availability(doctorId),
    queryFn: ({ signal }) => bookingApi.availability(doctorId, signal),
    enabled: doctorId !== '',
    staleTime: 0,
  });
  const doctor = doctors.data?.find((item) => item.id === doctorId);
  const days = doctorId ? (availability.data ?? []) : [];
  const slots = days.find((day) => day.date === date)?.slots ?? [];
  const catalogError = specialties.error ?? doctors.error;
  const showMissing = missing && Object.keys(errors).some((key) => key !== 'notes');

  useEffect(() => {
    if (!availability.data) return;
    const current = getValues();
    const day = availability.data.find((item) => item.date === current.date);
    if (current.date && !day) setValue('date', '');
    if (current.startsAt && !day?.slots.some((slot) => slot.startsAt === current.startsAt)) {
      setValue('startsAt', '');
    }
  }, [availability.data, getValues, setValue]);

  const clearSlot = () => setValue('startsAt', '');
  const clearDay = () => {
    setValue('date', '');
    clearSlot();
  };

  const { alert, run } = useFormSubmit(
    setError,
    FIELDS,
    (error) => {
      if (!(error instanceof ApiError)) return false;
      const field = fieldByCode[error.code];
      if (!field) return false;
      if (staleSlotCodes.has(error.code)) {
        clearSlot();
        void availability.refetch();
      }
      setError(field, { message: errorMessage(error) }, { shouldFocus: true });
      return true;
    },
    bookingMessages,
  );

  const onSubmit = handleSubmit(
    (values) => {
      setMissing(false);
      return run(async () => {
        const appointment = await bookingApi.book(toBody(values));
        void queryClient.invalidateQueries({ queryKey: queryKeys.booking.availability(values.doctorId) });
        reset(emptyBooking);
        onBooked(appointment);
      });
    },
    () => setMissing(true),
  );

  return (
    <form
      aria-label="Dados da consulta"
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      className="flex flex-col gap-5"
    >
      {catalogError && (
        <QueryError
          error={catalogError}
          onRetry={() => {
            void specialties.refetch();
            void doctors.refetch();
          }}
        />
      )}
      <Select
        label="Médico"
        placeholder="Escolha o médico"
        disabled={!doctors.data}
        hint={doctor && `${doctor.unit.name} · ${doctor.unit.address}`}
        error={errors.doctorId?.message}
        {...register('doctorId', {
          onChange: (event: SelectChange) => {
            const chosen = doctors.data?.find((item) => item.id === event.target.value);
            if (chosen) setValue('specialtyId', chosen.specialty.id, { shouldValidate: isSubmitted });
            clearDay();
          },
        })}
      >
        {doctors.data?.map((item) => (
          <option key={item.id} value={item.id}>
            {item.fullName}
          </option>
        ))}
      </Select>
      <Select
        label="Especialidade"
        placeholder="Escolha a especialidade"
        disabled={!specialties.data}
        error={errors.specialtyId?.message}
        {...register('specialtyId', {
          onChange: (event: SelectChange) => {
            if (!doctor || doctor.specialty.id === event.target.value) return;
            setValue('doctorId', '');
            clearDay();
          },
        })}
      >
        {specialties.data?.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </Select>
      <Select
        label="Tipo de consulta"
        placeholder="Escolha o tipo"
        error={errors.visitType?.message}
        {...register('visitType')}
      >
        {visitType.options.map((value) => (
          <option key={value} value={value}>
            {visitTypeLabels[value]}
          </option>
        ))}
      </Select>
      <div className="grid items-start gap-5 min-[22rem]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] min-[22rem]:gap-4">
        <Select
          label="Data"
          placeholder={availability.isFetching && days.length === 0 ? 'Carregando…' : 'Escolha'}
          icon={<LuCalendar />}
          compact
          disabled={days.length === 0}
          error={errors.date?.message}
          {...register('date', { onChange: clearSlot })}
        >
          {days.map((day) => (
            <option key={day.date} value={day.date}>
              {formatDay(day.date)}
            </option>
          ))}
        </Select>
        <Select
          label="Horário"
          placeholder="Escolha"
          icon={<LuClock />}
          compact
          disabled={slots.length === 0}
          error={errors.startsAt?.message}
          {...register('startsAt')}
        >
          {slots.map((slot) => (
            <option key={slot.startsAt} value={slot.startsAt}>
              {formatTime(slot.startsAt)}
            </option>
          ))}
        </Select>
      </div>
      {availability.isError && (
        <QueryError error={availability.error} onRetry={() => void availability.refetch()} />
      )}
      {availability.data?.length === 0 && (
        <FormAlert tone="warning" role="note">
          Este médico não tem vagas livres nas próximas semanas. Escolha outro médico.
        </FormAlert>
      )}
      <Textarea
        label="Observações (opcional)"
        placeholder="Alguma observação sobre a consulta"
        rows={2}
        maxLength={NOTES_MAX}
        error={errors.notes?.message}
        {...register('notes')}
      />
      {(alert ?? showMissing) && <FormAlert>{alert ?? MISSING_MESSAGE}</FormAlert>}
      <Button type="submit" size="lg" fullWidth loading={isSubmitting} loadingLabel="Enviando pedido">
        Agendar Consulta
      </Button>
    </form>
  );
}
