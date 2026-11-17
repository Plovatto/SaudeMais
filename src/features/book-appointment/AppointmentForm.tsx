import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { LuFileText, LuMapPin, LuStethoscope, LuUserRound } from 'react-icons/lu';
import { BookingForm, fieldGrid, NotesCard, WhenCard } from '@components/booking-form/BookingForm';
import { whenItem } from '@components/booking-form/when';
import { toBody } from '@components/booking-form/slot-schema';
import { useBookingForm } from '@components/booking-form/useBookingForm';
import { Avatar, Dropdown, InfoList, QueryError, SectionCard } from '@components/ui';
import { VISIT_TYPES, visitTypeHints, visitTypeLabels } from '@constants/visit-types';
import { useActiveSpecialties } from '@hooks/useActiveCatalog';
import { SEARCH_DELAY_MS, useDebouncedValue } from '@hooks/useDebouncedValue';
import { whenText } from '@lib/date';
import { queryKeys } from '@lib/query-keys';
import { bookingApi, type Appointment } from './booking-api';
import { bookingSchema, emptyBooking } from './booking-schema';
import { DoctorPicker, type Doctor } from './DoctorPicker';

const FIELDS = ['doctorId', 'specialtyId', 'visitType', 'startsAt', 'notes'] as const;

const fieldByCode = {
  SPECIALTY_MISMATCH: 'specialtyId',
  SELF_BOOKING: 'doctorId',
} as const;

const bookingMessages = { NOT_FOUND: 'Este médico não está mais disponível. Escolha outro.' } as const;

const VISIT_OPTIONS = VISIT_TYPES.map((value) => ({
  value,
  label: visitTypeLabels[value],
  hint: visitTypeHints[value],
}));

export function AppointmentForm({ onBooked }: { onBooked: (appointment: Appointment) => void }) {
  const queryClient = useQueryClient();
  const form = useForm({ resolver: zodResolver(bookingSchema), defaultValues: emptyBooking });
  const { control, setValue, clearErrors } = form;
  const [doctorId, specialtyId, visitType] = useWatch({
    control,
    name: ['doctorId', 'specialtyId', 'visitType'],
  });
  const [search, setSearch] = useState('');
  const settledSearch = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const specialties = useActiveSpecialties();
  const doctors = useQuery({
    queryKey: queryKeys.booking.doctors(specialtyId, settledSearch),
    queryFn: ({ signal }) => bookingApi.doctors(specialtyId, settledSearch, signal),
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
  const [chosen, setChosen] = useState<Doctor | null>(null);
  const doctor =
    doctors.data?.find((item) => item.id === doctorId) ?? (chosen?.id === doctorId ? chosen : undefined);
  const specialty = specialties.data?.find((item) => item.id === specialtyId);
  const catalogError = specialties.error ?? doctors.error;
  const pickDoctor = (next: Doctor) => {
    setChosen(next);
    setValue('doctorId', next.id);
    setValue('specialtyId', next.specialty.id);
    clearErrors(['doctorId', 'specialtyId']);
    booking.clearDay();
  };
  const visitLabel = visitType ? visitTypeLabels[visitType as keyof typeof visitTypeLabels] : null;

  return (
    <BookingForm
      label="Dados da consulta"
      heading={{
        title: 'Agendar consulta',
        subtitle: 'Escolha o médico e um horário livre. O médico confirma o pedido.',
      }}
      booking={booking}
      submitLabel="Agendar consulta"
      shortLabel="Agendar"
      summary={{
        title: 'Sua consulta',
        line: booking.startsAt ? whenText(booking.startsAt) : null,
        sub: [doctor?.fullName, visitLabel].filter(Boolean).join(' · ') || 'Escolha o médico',
        note: 'Você recebe um aviso quando o médico confirmar.',
        details: (
          <InfoList
            items={[
              {
                key: 'care',
                icon: <LuStethoscope />,
                label: 'Atendimento',
                value:
                  [specialty?.name ?? doctor?.specialty.name, visitLabel].filter(Boolean).join(' · ') || '—',
              },
              {
                key: 'doctor',
                icon: doctor ? <Avatar name={doctor.fullName} seed={doctor.id} square /> : <LuUserRound />,
                boxed: !doctor,
                label: 'Médico',
                value: doctor?.fullName ?? '—',
                hint: doctor?.specialty.name,
              },
              {
                key: 'unit',
                icon: <LuMapPin />,
                label: 'Local',
                value: doctor?.unit.name ?? '—',
                hint: doctor?.unit.address,
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
            void specialties.refetch();
            void doctors.refetch();
          }}
        />
      )}
      <SectionCard title="Atendimento">
        <div className={fieldGrid}>
          <Controller
            control={control}
            name="specialtyId"
            render={({ field, fieldState }) => (
              <Dropdown
                ref={field.ref}
                label="Especialidade"
                placeholder="Escolha a especialidade"
                icon={<LuStethoscope />}
                disabled={!specialties.data}
                options={(specialties.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                  hint: `Consultas de ${item.appointmentDurationMin} minutos`,
                }))}
                value={field.value}
                error={fieldState.error?.message}
                onChange={(next) => {
                  field.onChange(next);
                  if (doctor && doctor.specialty.id !== next) {
                    setValue('doctorId', '');
                    booking.clearDay();
                  }
                }}
              />
            )}
          />
          <Controller
            control={control}
            name="visitType"
            render={({ field, fieldState }) => (
              <Dropdown
                ref={field.ref}
                label="Tipo de consulta"
                placeholder="Escolha o tipo"
                icon={<LuFileText />}
                options={VISIT_OPTIONS}
                value={field.value}
                error={fieldState.error?.message}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </SectionCard>
      <Controller
        control={control}
        name="doctorId"
        render={({ field, fieldState }) => (
          <DoctorPicker
            doctors={doctors.data}
            value={field.value}
            onPick={pickDoctor}
            search={search}
            searched={settledSearch}
            onSearch={setSearch}
            error={fieldState.error?.message}
            focusRef={field.ref}
          />
        )}
      />
      <WhenCard
        booking={booking}
        waitingNote="Escolha o médico para ver os dias e horários livres."
        emptyNote="Este médico não tem vagas livres nas próximas semanas. Escolha outro médico."
      />
      <NotesCard booking={booking} placeholder="Algo que o médico deva saber antes da consulta" />
    </BookingForm>
  );
}
