import { useId } from 'react';
import { Note } from '@components/bookings/BookingDetails';
import type { ExamResult } from '@lib/api/models';
import { formatDateTime } from '@lib/date';
import { AmendedChip } from './ResultMeta';
import { PreviousVersions } from './PreviousVersions';
import { ResultVersion, type HeadingLevel } from './ResultVersion';

export interface ExamResultViewProps {
  result: ExamResult;
  headingLevel?: 2 | 3;
}

export function ExamResultView({
  result: { booking, current, previous },
  headingLevel = 2,
}: ExamResultViewProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;
  const inner = (headingLevel + 1) as HeadingLevel;
  return (
    <article aria-labelledby={titleId} className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Heading id={titleId} className="text-text text-lg font-semibold">
            {booking.examType.name}
          </Heading>
          {current.status === 'amended' && (
            <span className="text-text-secondary flex items-center gap-2 text-sm">
              <AmendedChip />
              Versão {current.version}
            </span>
          )}
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Note label="Código do exame">{booking.publicCode}</Note>
          <Note label="Data do exame">{formatDateTime(booking.startsAt)}</Note>
          <Note label="Local">
            <span className="block font-medium">{booking.unit.name}</span>
            <span className="text-text-secondary">{booking.unit.address}</span>
          </Note>
          <Note label="Emitido em">{formatDateTime(current.issuedAt)}</Note>
        </dl>
      </header>
      <ResultVersion version={current} label="Itens do exame" headingLevel={inner} />
      {previous.length > 0 && <PreviousVersions versions={previous} headingLevel={inner} />}
    </article>
  );
}
