import { useId, useState, type ReactNode } from 'react';
import { LuFileText } from 'react-icons/lu';
import { FlagChip } from '@components/exam-results/FlagChip';
import { flags, formatResultValue } from '@components/exam-results/result-flags';
import type { ResultItem } from '@components/exam-results/ResultVersion';
import { cx } from '@lib/cx';
import { formatMeasurement } from '@lib/number';

const NORMAL_START = 25;
const NORMAL_SPAN = 50;

const COLUMNS = 'sm:grid-cols-[minmax(0,1.2fr)_120px_minmax(160px,1fr)_96px]';

const position = (value: number, low: number, high: number) =>
  Math.max(4, Math.min(96, NORMAL_START + (NORMAL_SPAN * (value - low)) / (high - low)));

function RangeBar({ item }: { item: ResultItem }) {
  const { range, value } = item;
  if (!range || typeof value !== 'number' || range.high <= range.low) {
    return (
      <span className="text-text-secondary text-[0.8125rem] tabular-nums">{item.referenceRange ?? '—'}</span>
    );
  }
  const parts = item.referenceRange?.split(/\s+a\s+/) ?? [];
  const [low, high] =
    parts.length === 2 ? parts : [formatMeasurement(range.low), formatMeasurement(range.high)];
  return (
    <div>
      <div
        role="img"
        aria-label={`Referência de ${low} a ${high}, valor ${flags[item.flag].label.toLowerCase()}`}
        className="relative h-2.5 rounded-full bg-[linear-gradient(to_right,var(--surface-strong)_0_calc(25%-3px),transparent_calc(25%-3px)_calc(75%+3px),var(--surface-strong)_calc(75%+3px))]"
      >
        <span className="absolute inset-y-0 start-1/4 end-1/4 rounded-full bg-[color-mix(in_oklab,var(--success-text)_22%,var(--surface))]" />
        <span
          style={{ insetInlineStart: `${position(value, range.low, range.high)}%` }}
          className={cx(
            'border-surface motion-safe:animate-pop absolute top-1/2 -ms-[9px] -mt-[9px] size-[18px] rounded-full border-[3px] shadow-[0_1px_4px_rgb(16_42_41/0.3)]',
            flags[item.flag].dot,
          )}
        />
      </div>
      <div aria-hidden className="text-text-muted relative mt-2 h-4 text-[0.71875rem] tabular-nums">
        <span className="absolute start-1/4 -translate-x-1/2 whitespace-nowrap">{low}</span>
        <span className="absolute start-3/4 -translate-x-1/2 whitespace-nowrap">{high}</span>
      </div>
    </div>
  );
}

const row =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 px-4 py-3.5 [grid-template-areas:"name_flag"_"value_value"_"range_range"] sm:gap-5 sm:px-5 sm:py-4 sm:[grid-template-areas:"name_value_range_flag"]';

function ItemRow({ item }: { item: ResultItem }) {
  const [open, setOpen] = useState(false);
  const aboutId = useId();
  return (
    <li className={cx(row, COLUMNS, 'transition-colors duration-200', open && 'bg-role-soft/25')}>
      <p className="text-text flex items-center gap-2 text-sm font-semibold [grid-area:name]">
        {item.name}
        {item.about && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={aboutId}
            aria-label={`O que é ${item.name}?`}
            onClick={() => setOpen((current) => !current)}
            className={cx(
              'relative grid size-5 shrink-0 place-items-center rounded-full border text-[0.71875rem] leading-none font-bold transition-colors duration-150 after:absolute after:-inset-3',
              open
                ? 'border-role-strong bg-role-strong text-on-role'
                : 'border-border-strong bg-surface text-text-muted can-hover:border-role-strong can-hover:bg-role-strong can-hover:text-on-role',
            )}
          >
            ?
          </button>
        )}
      </p>
      <p className="text-text text-sm font-[650] tabular-nums [grid-area:value] max-sm:-mt-1.5">
        {formatResultValue(item.value)}
        {item.unit && <span className="text-text-muted text-xs font-medium"> {item.unit}</span>}
      </p>
      <div className={cx('[grid-area:range]', !item.range && !item.referenceRange && 'max-sm:hidden')}>
        <RangeBar item={item} />
      </div>
      <div className="justify-self-end [grid-area:flag]">
        <FlagChip flag={item.flag} />
      </div>
      {item.about && open && (
        <p
          id={aboutId}
          className="bg-role-soft text-text motion-safe:animate-rise col-span-full -mt-1 flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[0.8125rem] leading-normal"
        >
          <LuFileText aria-hidden className="text-role-text mt-[3px] size-3.5 shrink-0" />
          {item.about}
        </p>
      )}
    </li>
  );
}

export function ResultItems({ items, meta }: { items: ResultItem[]; meta: ReactNode }) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="rounded-card border-border bg-surface shadow-card motion-safe:animate-rise overflow-hidden border"
    >
      <header className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3.5 sm:px-5">
        <h2 id={titleId} className="text-text flex-1 text-[0.9375rem] font-semibold tracking-[-0.01em]">
          Itens do exame
        </h2>
        {meta}
      </header>
      <div
        aria-hidden
        className={cx(
          'bg-surface-muted border-border text-text-muted hidden gap-5 border-y px-5 py-2.5 text-xs font-semibold sm:grid',
          COLUMNS,
        )}
      >
        <span>Exame</span>
        <span>Resultado</span>
        <span>Faixa de referência</span>
        <span className="text-end">Situação</span>
      </div>
      <ul role="list" className="divide-border divide-y">
        {items.map((item, index) => (
          <ItemRow key={`${index}-${item.name}`} item={item} />
        ))}
      </ul>
    </section>
  );
}
