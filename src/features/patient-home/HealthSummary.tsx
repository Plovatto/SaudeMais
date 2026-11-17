import { LuHeart, LuWeight } from 'react-icons/lu';
import { SectionCard } from '@components/ui';
import { tile } from '@components/ui/styles';
import { formatSince } from '@lib/date';
import { formatCount, formatMeasurement } from '@lib/number';
import type { PatientHome } from './patient-home-api';

type HomeMetrics = PatientHome['metrics'];

const measures = ({ bloodPressure, weight }: Partial<HomeMetrics>) => [
  {
    label: 'Pressão arterial',
    icon: <LuHeart />,
    reading: bloodPressure && {
      value: `${formatCount(bloodPressure.systolic)}/${formatCount(bloodPressure.diastolic)}`,
      unit: 'mmHg',
      recordedAt: bloodPressure.recordedAt,
    },
  },
  {
    label: 'Peso',
    icon: <LuWeight />,
    reading: weight && { value: formatMeasurement(weight.kg), unit: 'kg', recordedAt: weight.recordedAt },
  },
];

export function HealthSummary({ metrics }: { metrics: HomeMetrics | undefined }) {
  const items = measures(metrics ?? {});
  return (
    <SectionCard title="Minha saúde">
      <ul className="divide-border flex flex-col divide-y">
        {items.map(({ label, icon, reading }) => (
          <li key={label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span aria-hidden className={tile}>
              {icon}
            </span>
            <p className="flex min-w-0 flex-1 flex-col-reverse">
              <span className="text-text-muted text-xs">{label}</span>
              <span className="text-text text-sm font-semibold tabular-nums">
                {reading ? (
                  <>
                    {reading.value}{' '}
                    <span className="text-text-muted text-xs font-medium">{reading.unit}</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden>—</span>
                    <span className="sr-only">Sem registro</span>
                  </>
                )}
              </span>
            </p>
            {reading && (
              <time dateTime={reading.recordedAt} className="text-text-muted shrink-0 text-xs">
                {formatSince(reading.recordedAt)}
              </time>
            )}
          </li>
        ))}
      </ul>
      {metrics && items.every(({ reading }) => !reading) && (
        <p className="text-text-muted text-xs">
          Os valores aparecem aqui depois que o médico registrar suas consultas.
        </p>
      )}
    </SectionCard>
  );
}
