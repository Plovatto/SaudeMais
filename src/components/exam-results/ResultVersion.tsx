import type { ExamResult } from '@lib/api/models';
import { cx } from '@lib/cx';
import { formatMeasurement } from '@lib/number';
import { FlagChip } from './FlagChip';

export type Version = ExamResult['current'];

export type ResultItem = NonNullable<Version['items']>[number];

export type HeadingLevel = 2 | 3 | 4 | 5;

const formatValue = (value: ResultItem['value']) =>
  typeof value === 'number' ? formatMeasurement(value) : value;

const paragraphs = (report: string) =>
  report
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const cell = 'border-border border-b px-2 py-2.5 align-top first:ps-0 last:pe-0';

const wideOnly = 'hidden lg:table-cell print:table-cell';

const columns = [
  { label: 'Exame' },
  { label: 'Resultado' },
  { label: 'Referência', className: wideOnly },
  { label: 'Indicador' },
];

export function ReportText({ report }: { report: string }) {
  return (
    <div className="text-text flex flex-col gap-3 text-sm leading-relaxed">
      {paragraphs(report).map((paragraph, index) => (
        <p key={index} className="break-words whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function ResultVersion({
  version: { items, report },
  label,
  headingLevel,
}: {
  version: Version;
  label: string;
  headingLevel: HeadingLevel;
}) {
  if (!items) {
    if (paragraphs(report ?? '').length === 0) return null;
    const Heading = `h${headingLevel}` as const;
    return (
      <section className="flex flex-col gap-2">
        <Heading className="text-text text-sm font-semibold">Laudo</Heading>
        <ReportText report={report ?? ''} />
      </section>
    );
  }
  return (
    <table className="w-full text-sm">
      <caption className="text-text pb-2 text-start text-sm font-semibold">{label}</caption>
      <thead>
        <tr className="text-text-secondary text-xs font-semibold">
          {columns.map(({ label: column, className }) => (
            <th key={column} scope="col" className={cx(cell, 'text-start', className)}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="text-text">
        {items.map((item, index) => (
          <tr key={`${index}-${item.name}`}>
            <th scope="row" className={`${cell} text-start font-medium`}>
              {item.name}
            </th>
            <td className={cell}>
              <span className="font-semibold tabular-nums">{formatValue(item.value)}</span>
              {item.unit && <span className="text-text-secondary"> {item.unit}</span>}
              {item.referenceRange && (
                <span className="text-text-secondary block text-xs lg:hidden print:hidden">
                  Referência: {item.referenceRange}
                </span>
              )}
            </td>
            <td className={cx(cell, wideOnly, 'text-text-secondary tabular-nums')}>
              {item.referenceRange ?? '—'}
            </td>
            <td className={cell}>
              <FlagChip flag={item.flag} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
