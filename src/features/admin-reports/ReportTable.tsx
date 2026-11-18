import type { ReactNode } from 'react';
import { cx } from '@lib/cx';

export interface ReportRow {
  key: string;
  header: ReactNode;
  cells: readonly ReactNode[];
}

export interface ReportTableProps {
  label: string;
  rowHeader: string;
  columns: readonly string[];
  rows: readonly ReportRow[];
  total?: readonly ReactNode[] | undefined;
}

const cell = 'px-4 whitespace-nowrap lg:px-5';

const sticky = 'max-lg:sticky max-lg:start-0 max-lg:z-[1]';

export function ReportTable({ label, rowHeader, columns, rows, total }: ReportTableProps) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={`Tabela: ${label}`}
      className="focus-visible:outline-focus overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2"
    >
      <table className="w-full border-collapse text-[0.8125rem]">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className="bg-surface-muted text-text-muted border-border border-b text-xs font-semibold">
            <th scope="col" className={cx(cell, sticky, 'bg-surface-muted py-2.5 text-start')}>
              {rowHeader}
            </th>
            {columns.map((column) => (
              <th key={column} scope="col" className={cx(cell, 'py-2.5 text-end')}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, header, cells }) => (
            <tr
              key={key}
              className="border-border can-hover:bg-surface-muted/60 border-b transition-colors duration-150 last:border-0"
            >
              <th
                scope="row"
                className={cx(cell, sticky, 'bg-surface text-text py-3 text-start font-normal')}
              >
                {header}
              </th>
              {cells.map((value, index) => (
                <td
                  key={columns[index]}
                  className={cx(cell, 'text-text-secondary py-3 text-end tabular-nums')}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {total && (
          <tfoot>
            <tr className="bg-surface-muted text-text border-border border-t font-[650]">
              <th scope="row" className={cx(cell, sticky, 'bg-surface-muted py-3 text-start')}>
                Total
              </th>
              {total.map((value, index) => (
                <td key={columns[index]} className={cx(cell, 'py-3 text-end tabular-nums')}>
                  {value}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
