import { useEffect, useRef } from 'react';
import { FormAlert, QueryError, SettingRow, Skeleton, type DropdownOption } from '@components/ui';
import { plural } from '@lib/plural';
import { catalogMessages } from './catalog-messages';
import { FormDropdown } from './FormFields';
import type { PolicyValues } from './settings-schemas';
import { SettingsCard } from './SettingsCard';
import { POLICY_CARD_ID, POLICY_FORM_ID, type PolicySettings } from './usePolicySettings';

interface PolicyRow {
  name: keyof PolicyValues;
  title: string;
  description: string;
  label: (value: number) => string;
  presets: readonly (readonly [value: number, hint?: string])[];
}

const hoursBefore = (hours: number) =>
  hours === 0 ? 'Sem prazo' : `${plural(hours, 'hora', 'horas')} antes`;

const leadTime = (minutes: number) => {
  if (minutes === 0) return 'Sem antecedência';
  if (minutes % 60 !== 0) return plural(minutes, 'minuto', 'minutos');
  return plural(minutes / 60, 'hora', 'horas');
};

const ROWS: readonly PolicyRow[] = [
  {
    name: 'minLeadMinutes',
    title: 'Antecedência mínima',
    description: 'Quanto tempo antes o paciente precisa agendar.',
    label: leadTime,
    presets: [
      [0, 'Até o último horário livre'],
      [30, 'Meia hora antes'],
      [60, 'Uma hora antes'],
      [120, 'Para encaixes do mesmo dia'],
      [720, 'Meio dia antes'],
      [1440, 'Um dia antes'],
      [2880, 'Dois dias antes'],
    ],
  },
  {
    name: 'bookingHorizonDays',
    title: 'Agenda aberta',
    description: 'Até quantos dias à frente o paciente consegue agendar.',
    label: (days) => plural(days, 'dia', 'dias'),
    presets: [
      [30, 'Um mês'],
      [60, 'Dois meses'],
      [90, 'Três meses'],
      [180, 'Seis meses'],
      [365, 'Um ano'],
    ],
  },
  {
    name: 'appointmentLateWindowHours',
    title: 'Prazo para cancelar consultas',
    description:
      'Depois disso, o cancelamento fica registrado como tardio e a consulta não pode ser reagendada.',
    label: hoursBefore,
    presets: [
      [0, 'Até o horário marcado'],
      [12, 'Mais flexível'],
      [24, 'Recomendado'],
      [48, 'Mais rígido'],
    ],
  },
  {
    name: 'examLateWindowHours',
    title: 'Prazo para cancelar exames',
    description:
      'Depois disso, o cancelamento fica registrado como tardio e o exame não pode ser reagendado.',
    label: hoursBefore,
    presets: [[0, 'Até o horário marcado'], [2, 'Recomendado'], [12], [24], [48, 'Mais rígido']],
  },
  {
    name: 'maxReschedules',
    title: 'Reagendamentos',
    description: 'Quantas vezes o paciente pode trocar o horário de um mesmo agendamento.',
    label: (times) => (times === 0 ? 'Não permitir' : plural(times, 'vez', 'vezes')),
    presets: [[0, 'Só cancelando e agendando de novo'], [1], [2], [3], [5]],
  },
];

function optionsOf({ label, presets }: PolicyRow, current: number): DropdownOption[] {
  const values = presets.some(([value]) => value === current) ? presets : [...presets, [current] as const];
  return [...values]
    .sort(([a], [b]) => a - b)
    .map(([value, hint]) => ({ value: String(value), label: label(value), hint }));
}

export function PolicySection({ policy: { query, form } }: { policy: PolicySettings }) {
  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (form.alert) alertRef.current?.scrollIntoView({ block: 'center' });
  }, [form.alert, form.formState.submitCount]);
  const saved = query.data;
  return (
    <SettingsCard id={POLICY_CARD_ID} title="Agendamento" flush={false}>
      {query.isPending && <Skeleton className="h-80" />}
      {query.isError && (
        <QueryError error={query.error} messages={catalogMessages} onRetry={() => void query.refetch()} />
      )}
      {saved && (
        <form
          id={POLICY_FORM_ID}
          aria-label="Agendamento"
          noValidate
          onSubmit={(event) => void form.onSubmit(event)}
          className="-mt-1 -mb-1.5 flex flex-col"
        >
          {ROWS.map((row) => (
            <SettingRow
              key={row.name}
              className="border-border flex-wrap gap-x-4 gap-y-2.5 py-3.5 not-first:border-t lg:flex-nowrap"
              title={row.title}
              meta={row.description}
              trailing={
                <div className="w-full shrink-0 lg:w-[210px]">
                  <FormDropdown
                    control={form.control}
                    name={row.name}
                    numeric
                    label={row.title}
                    labelHidden
                    placeholder={row.title}
                    disabled={form.formState.isSubmitting}
                    options={optionsOf(row, saved[row.name])}
                  />
                </div>
              }
            />
          ))}
          {form.alert && (
            <div ref={alertRef} className="pt-1 pb-4">
              <FormAlert>{form.alert}</FormAlert>
            </div>
          )}
        </form>
      )}
    </SettingsCard>
  );
}
