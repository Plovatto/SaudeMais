import type { ExamResult } from '@lib/api/models';
import { formatCount } from '@lib/number';
import { FlagChip } from './FlagChip';

export type Version = ExamResult['current'];

export type ResultItem = NonNullable<Version['items']>[number];

export type HeadingLevel = 2 | 3 | 4 | 5;

const formatValue = (value: ResultItem['value']) => (typeof value === 'number' ? formatCount(value) : value);

const paragraphs = (report: string) =>
  report
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const cell = 'border-border border-b px-2 py-2.5 align-top first:ps-0 last:pe-0';

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
    const Heading = `h${headingLevel}` as const;
    return (
      <section className="flex flex-col gap-2">
        <Heading className="text-text text-sm font-semibold">Laudo</Heading>
        <div className="text-text flex flex-col gap-3 text-sm leading-relaxed">
          {paragraphs(report ?? '').map((paragraph, index) => (
            <p key={index} className="break-words whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      </section>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="text-text pb-2 text-start text-sm font-semibold">{label}</caption>
        <thead>
          <tr className="text-text-secondary text-xs font-semibold">
            <th scope="col" className={`${cell} text-start`}>
              Exame
            </th>
            <th scope="col" className={`${cell} text-start`}>
              Resultado
            </th>
            <th scope="col" className={`${cell} text-start`}>
              Referência
            </th>
            <th scope="col" className={`${cell} text-start`}>
              Indicador
            </th>
          </tr>
        </thead>
        <tbody className="text-text">
          {items.map((item) => (
            <tr key={item.name}>
              <th scope="row" className={`${cell} text-start font-medium`}>
                {item.name}
              </th>
              <td className={cell}>
                <span className="font-semibold tabular-nums">{formatValue(item.value)}</span>
                {item.unit && <span className="text-text-secondary"> {item.unit}</span>}
              </td>
              <td className={`${cell} text-text-secondary tabular-nums`}>{item.referenceRange ?? '—'}</td>
              <td className={cell}>
                <FlagChip flag={item.flag} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
