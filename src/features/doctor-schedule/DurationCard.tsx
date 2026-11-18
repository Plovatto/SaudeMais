import type { Control } from 'react-hook-form';
import { LuClock } from 'react-icons/lu';
import { FormDropdown } from '@components/forms/FormFields';
import { SectionCard, type DropdownOption } from '@components/ui';
import { plural } from '@lib/plural';
import type { DoctorSchedule } from './schedule-api';
import { DURATIONS, type ScheduleValues } from './schedule-schema';

interface DurationCardProps {
  control: Control<ScheduleValues>;
  schedule: DoctorSchedule;
  slots: number;
}

const SPECIALTY_HINT = 'Padrão da especialidade';

function durationOptions(specialty: number): DropdownOption[] {
  const listed = DURATIONS.some((option) => option.value === specialty);
  return [...DURATIONS, ...(listed ? [] : [{ value: specialty, hint: '' }])]
    .sort((a, b) => a.value - b.value)
    .map(({ value, hint }) => ({
      value: String(value),
      label: `${value} minutos`,
      hint: value === specialty ? [hint, SPECIALTY_HINT].filter(Boolean).join(' · ') : hint,
    }));
}

export function DurationCard({ control, schedule, slots }: DurationCardProps) {
  return (
    <SectionCard title="Consultas">
      <FormDropdown
        control={control}
        name="appointmentDurationMin"
        numeric
        label="Duração de cada consulta"
        placeholder="Escolha a duração"
        icon={<LuClock />}
        options={durationOptions(schedule.specialtyDurationMin)}
      />
      <p className="text-text-secondary text-[0.8125rem]">
        Com essa duração, você oferece{' '}
        <strong className="text-text font-semibold tabular-nums">
          {plural(slots, 'horário', 'horários')}
        </strong>{' '}
        por semana.
      </p>
    </SectionCard>
  );
}
