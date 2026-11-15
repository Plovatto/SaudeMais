import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChangeEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { BookingForm, NotesField, SlotFields } from '@components/booking-form/BookingForm';
import { toBody } from '@components/booking-form/slot-schema';
import { useBookingForm } from '@components/booking-form/useBookingForm';
import { QueryError, Select } from '@components/ui';
import { VISIT_TYPES, visitTypeLabels } from '@constants/visit-types';
import { useActiveSpecialties } from '@hooks/useActiveCatalog';
import { queryKeys } from '@lib/query-keys';
import { bookingApi, type Appointment } from './booking-api';
import { bookingSchema, emptyBooking } from './booking-schema';

const FIELDS = ['doctorId', 'specialtyId', 'visitType', 'startsAt', 'notes'] as const;

const fieldByCode = {
  SPECIALTY_MISMATCH: 'specialtyId',
  SELF_BOOKING: 'doctorId',
} as const;

const bookingMessages = { NOT_FOUND: 'Este médico não está mais disponível. Escolha outro.' } as const;

type SelectChange = ChangeEvent<HTMLSelectElement>;

export function AppointmentForm({ onBooked }: { onBooked: (appointment: Appointment) => void }) {
  const queryClient = useQueryClient();
  const form = useForm({ resolver: zodResolver(bookingSchema), defaultValues: emptyBooking });
  const {
    register,
    control,
    setValue,
    formState: { errors, isSubmitted },
  } = form;
  const [doctorId, specialtyId] = useWatch({ control, name: ['doctorId', 'specialtyId'] });
  const specialties = useActiveSpecialties();
  const doctors = useQuery({
    queryKey: queryKeys.booking.doctors(specialtyId),
    queryFn: ({ signal }) => bookingApi.doctors(specialtyId, signal),
    placeholderData: keepPreviousData,
  });
  const booking = useBookingForm(form, {
    fields: FIELDS,
    availability: {
      queryKey: queryKeys.booking.availability(doctorId),
      load: (signal) => bookingApi.availability(doctorId, signal),
      enabled: doctorId !== '',
    },
    fieldByCode,
    messages: bookingMessages,
    onNotFound: () => void queryClient.invalidateQueries({ queryKey: queryKeys.booking.doctorLists }),
    book: (values) => bookingApi.book(toBody(values)),
    onBooked,
  });
  const doctor = doctors.data?.find((item) => item.id === doctorId);
  const catalogError = specialties.error ?? doctors.error;

  return (
    <BookingForm label="Dados da consulta" booking={booking} submitLabel="Agendar Consulta">
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
            booking.clearDay();
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
            booking.clearDay();
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
        {VISIT_TYPES.map((value) => (
          <option key={value} value={value}>
            {visitTypeLabels[value]}
          </option>
        ))}
      </Select>
      <SlotFields
        booking={booking}
        emptyNote="Este médico não tem vagas livres nas próximas semanas. Escolha outro médico."
      />
      <NotesField booking={booking} placeholder="Alguma observação sobre a consulta" />
    </BookingForm>
  );
}
