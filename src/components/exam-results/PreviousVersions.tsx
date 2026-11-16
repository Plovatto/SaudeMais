import { useId } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { IconSlot } from '@components/ui';
import { formatDateTime } from '@lib/date';
import { ResultVersion, type HeadingLevel, type Version } from './ResultVersion';

interface LevelProps {
  headingLevel: HeadingLevel;
}

function PreviousVersion({ version, headingLevel }: LevelProps & { version: Version }) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <section aria-labelledby={titleId} className="border-border flex flex-col gap-3 border-t pt-4">
      <div className="flex flex-col gap-0.5">
        <Heading id={titleId} className="text-text text-sm font-semibold">
          Versão {version.version}
        </Heading>
        <p className="text-text-secondary text-xs">
          {version.status === 'amended' ? 'Retificação emitida' : 'Emitida'} em{' '}
          {formatDateTime(version.issuedAt)}
        </p>
      </div>
      <ResultVersion
        version={version}
        label={`Itens da versão ${version.version}`}
        headingLevel={(headingLevel + 1) as HeadingLevel}
      />
    </section>
  );
}

export function PreviousVersions({ versions, headingLevel }: LevelProps & { versions: Version[] }) {
  return (
    <details className="group border-border rounded-tile border">
      <summary className="rounded-tile text-text flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        Versões anteriores ({versions.length})
        <IconSlot className="text-text-secondary text-lg transition-transform group-open:rotate-180">
          <LuChevronDown />
        </IconSlot>
      </summary>
      <div className="flex flex-col gap-4 px-4 pb-4">
        {versions.map((version) => (
          <PreviousVersion key={version.version} version={version} headingLevel={headingLevel} />
        ))}
      </div>
    </details>
  );
}
