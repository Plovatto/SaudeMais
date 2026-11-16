import { useId } from 'react';
import { LuHeart, LuWeight } from 'react-icons/lu';
import { IconSlot } from '@components/ui';
import { cx } from '@lib/cx';
import { formatRelative } from '@lib/date';
import { formatCount, formatDecimal } from '@lib/number';
import type { PatientHome } from './patient-home-api';

type HealthMetrics = PatientHome['metrics'];

const measures = ({ bloodPressure, weight }: Partial<HealthMetrics>) => [
  {
    label: 'Pressão arterial',
    icon: <LuHeart />,
    reading: bloodPressure && {
      value: `${formatCount(bloodPressure.systolic)}/${formatCount(bloodPressure.diastolic)} mmHg`,
      recordedAt: bloodPressure.recordedAt,
    },
  },
  {
    label: 'Peso atual',
    icon: <LuWeight />,
    reading: weight && { value: `${formatDecimal(weight.kg)} kg`, recordedAt: weight.recordedAt },
  },
];

export interface HealthSummaryProps {
  metrics: HealthMetrics | undefined;
  className?: string;
}

export function HealthSummary({ metrics, className }: HealthSummaryProps) {
  const titleId = useId();
  const items = measures(metrics ?? {});
  return (
    <section
      aria-labelledby={titleId}
      className={cx('rounded-card bg-role-soft text-text flex flex-col gap-4 p-5', className)}
    >
      <h2 id={titleId} className="font-semibold">
        Minha saúde
      </h2>
      <dl className="grid grid-cols-2 gap-4">
        {items.map(({ label, icon, reading }) => (
          <div
            key={label}
            className="rounded-tile bg-surface flex flex-col-reverse items-center gap-1 px-3 py-4 text-center"
          >
            <dt className="text-text-secondary text-xs">{label}</dt>
            <dd className="flex flex-col items-center gap-2 text-lg font-bold">
              <IconSlot className="bg-role-soft text-role-text size-10 justify-center rounded-full text-xl">
                {icon}
              </IconSlot>
              {reading ? (
                <span className="flex flex-col items-center gap-0.5">
                  {reading.value}
                  <span className="text-text-secondary text-xs font-normal">
                    registrado {formatRelative(reading.recordedAt)}
                  </span>
                </span>
              ) : (
                <>
                  <span aria-hidden>—</span>
                  <span className="sr-only">Sem registro</span>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {metrics && items.every(({ reading }) => !reading) && (
        <p className="text-sm">Os valores aparecem aqui depois que o médico registrar suas consultas.</p>
      )}
    </section>
  );
}
