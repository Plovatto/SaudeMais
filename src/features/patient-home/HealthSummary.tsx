import { LuHeart } from 'react-icons/lu';
import { SectionCard } from '@components/ui';
import { tile } from '@components/ui/styles';
import { formatSince } from '@lib/date';
import { formatCount, formatMeasurement } from '@lib/number';
import type { PatientHome } from './patient-home-api';

type HomeMetrics = PatientHome['metrics'];

function ScaleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 16a4 4 0 0 0-8 0M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 12l2-3" />
    </svg>
  );
}

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
    icon: <ScaleIcon />,
    reading: weight && { value: formatMeasurement(weight.kg), unit: 'kg', recordedAt: weight.recordedAt },
  },
];

export function HealthSummary({ metrics }: { metrics: HomeMetrics | undefined }) {
  const items = measures(metrics ?? {});
  return (
    <SectionCard title="Minha saúde">
      <ul className="divide-border flex flex-col divide-y">
        {items.map(({ label, icon, reading }) => (
          <li key={label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span aria-hidden className={tile}>
              {icon}
            </span>
            <p className="flex min-w-0 flex-1 flex-col">
              <span className="text-text-muted text-xs/normal">{label}</span>
              <span className="text-text text-sm/[1.35] font-semibold tabular-nums">
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
              <time dateTime={reading.recordedAt} className="text-text-muted shrink-0 text-xs/normal">
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
