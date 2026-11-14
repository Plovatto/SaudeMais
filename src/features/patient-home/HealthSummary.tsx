import { LuHeart, LuWeight } from 'react-icons/lu';
import { IconSlot } from '@components/ui';
import { cx } from '@lib/cx';

const TITLE_ID = 'health-summary-title';

const MEASURES = [
  { label: 'Pressão arterial', icon: <LuHeart /> },
  { label: 'Peso atual', icon: <LuWeight /> },
];

export function HealthSummary({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby={TITLE_ID}
      className={cx('rounded-card bg-role-soft text-text flex flex-col gap-4 p-5', className)}
    >
      <h2 id={TITLE_ID} className="font-semibold">
        Minha saúde
      </h2>
      <dl className="grid grid-cols-2 gap-4">
        {MEASURES.map(({ label, icon }) => (
          <div
            key={label}
            className="rounded-tile bg-surface flex flex-col-reverse items-center gap-1 px-3 py-4 text-center"
          >
            <dt className="text-text-secondary text-xs">{label}</dt>
            <dd className="flex flex-col items-center gap-2 text-lg font-bold">
              <IconSlot className="bg-role-soft text-role-text size-10 justify-center rounded-full text-xl">
                {icon}
              </IconSlot>
              <span aria-hidden>—</span>
              <span className="sr-only">Sem registro</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm">Os valores aparecem aqui depois que o médico registrar suas consultas.</p>
    </section>
  );
}
