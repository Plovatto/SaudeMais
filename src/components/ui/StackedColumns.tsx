import { useId, useState } from 'react';
import { cx } from '@lib/cx';
import { formatCount } from '@lib/number';
import { Button } from './Button';

export interface ChartSeries<K extends string> {
  key: K;
  label: string;
  swatch: string;
}

export interface ChartRow<K extends string> {
  key: string;
  label: string;
  axisLabel: string;
  values: Record<K, number>;
}

export interface StackedColumnsProps<K extends string> {
  label: string;
  rowHeader: string;
  series: readonly ChartSeries<K>[];
  rows: readonly ChartRow<K>[];
}

const TICKS = 4;
const DENSE_ROWS = 31;

function axisTop(max: number) {
  const raw = Math.max(1, max / TICKS);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((value) => value >= raw) ?? raw;
  return { step, top: step * Math.max(1, Math.ceil(max / step)) };
}

export function StackedColumns<K extends string>({ label, rowHeader, series, rows }: StackedColumnsProps<K>) {
  const tableId = useId();
  const [showTable, setShowTable] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const totalOf = (row: ChartRow<K>) => series.reduce((sum, { key }) => sum + row.values[key], 0);
  const totals = rows.map(totalOf);
  const peak = Math.max(0, ...totals);
  const { step, top } = axisTop(peak);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step);
  const peakRow = rows[totals.indexOf(peak)];
  const seriesTotals = series
    .map(({ key, label: seriesLabel }) => {
      const sum = rows.reduce((total, row) => total + row.values[key], 0);
      return `${seriesLabel}: ${formatCount(sum)}`;
    })
    .join('; ');
  const summary = peakRow
    ? `${label}. ${rows.length} intervalos; ${seriesTotals}; maior total: ${formatCount(peak)} em ${peakRow.label}.`
    : label;
  const activeRow = active === null ? undefined : rows[active];
  const axisLabels = new Set([0, Math.floor((rows.length - 1) / 2), rows.length - 1]);

  return (
    <div className="flex flex-col gap-4">
      <ul className="text-text-secondary flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {series.map(({ key, label: seriesLabel, swatch }) => (
          <li key={key} className="flex items-center gap-1.5">
            <span aria-hidden className={cx('size-3 rounded-sm', swatch)} />
            {seriesLabel}
          </li>
        ))}
      </ul>
      <div role="img" aria-label={summary} className="relative">
        <div className="relative ms-10 h-48">
          {ticks.map((tick) => (
            <div
              key={tick}
              className="border-border absolute inset-x-0 border-t"
              style={{ bottom: `${(tick / top) * 100}%` }}
            >
              <span className="text-text-muted absolute end-full me-2 -translate-y-1/2 text-xs tabular-nums">
                {formatCount(tick)}
              </span>
            </div>
          ))}
          <div
            className={cx('absolute inset-0 flex items-end', rows.length > DENSE_ROWS ? 'gap-px' : 'gap-0.5')}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse') setActive(null);
            }}
          >
            {rows.map((row, index) => (
              <div
                key={row.key}
                onPointerEnter={() => setActive(index)}
                onPointerDown={() => setActive(index)}
                className={cx(
                  'flex h-full min-w-0 flex-1 items-end justify-center transition-opacity',
                  active !== null && active !== index && 'opacity-50',
                )}
              >
                <div
                  className="flex w-full max-w-6 flex-col-reverse gap-0.5 overflow-hidden rounded-t-[4px]"
                  style={{ height: `${((totals[index] ?? 0) / top) * 100}%` }}
                >
                  {series.map(({ key, swatch }) =>
                    row.values[key] > 0 ? (
                      <div
                        key={key}
                        className={cx('min-h-px basis-0', swatch)}
                        style={{ flexGrow: row.values[key] }}
                      />
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </div>
          {activeRow && active !== null && (
            <div
              className="rounded-field border-border bg-surface text-text shadow-card pointer-events-none absolute top-0 z-10 w-44 border p-2 text-xs"
              style={{
                left: `clamp(0px, calc(${((active + 0.5) / rows.length) * 100}% - 5.5rem), calc(100% - 11rem))`,
              }}
            >
              <p className="text-text-secondary mb-1">{activeRow.label}</p>
              {series.map(({ key, label: seriesLabel, swatch }) => (
                <p key={key} className="flex items-center gap-1.5">
                  <span aria-hidden className={cx('h-0.5 w-3 rounded-full', swatch)} />
                  <span className="font-semibold tabular-nums">{formatCount(activeRow.values[key])}</span>
                  <span className="text-text-secondary">{seriesLabel}</span>
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="text-text-muted relative ms-10 mt-2 h-4 text-xs">
          {rows.map((row, index) =>
            axisLabels.has(index) ? (
              <span
                key={row.key}
                className={cx(
                  'absolute whitespace-nowrap',
                  index === 0 ? 'start-0' : index === rows.length - 1 ? 'end-0' : '-translate-x-1/2',
                )}
                style={
                  index === 0 || index === rows.length - 1
                    ? undefined
                    : { left: `${((index + 0.5) / rows.length) * 100}%` }
                }
              >
                {row.axisLabel}
              </span>
            ) : null,
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        aria-expanded={showTable}
        aria-controls={tableId}
        onClick={() => setShowTable((shown) => !shown)}
        className="self-start"
      >
        {showTable ? 'Ocultar tabela' : 'Ver tabela'}
      </Button>
      <div id={tableId} hidden={!showTable} className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr className="text-text-secondary border-border border-b text-xs font-semibold">
              <th scope="col" className="py-2 pe-3 text-start">
                {rowHeader}
              </th>
              {series.map(({ key, label: seriesLabel }) => (
                <th key={key} scope="col" className="px-3 py-2 text-end">
                  {seriesLabel}
                </th>
              ))}
              <th scope="col" className="py-2 ps-3 text-end">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key} className="border-border text-text border-b last:border-0">
                <th scope="row" className="py-2 pe-3 text-start font-normal whitespace-nowrap">
                  {row.label}
                </th>
                {series.map(({ key }) => (
                  <td key={key} className="px-3 py-2 text-end tabular-nums">
                    {formatCount(row.values[key])}
                  </td>
                ))}
                <td className="py-2 ps-3 text-end font-semibold tabular-nums">
                  {formatCount(totals[index] ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
