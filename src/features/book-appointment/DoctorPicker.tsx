import { useId, type Ref } from 'react';
import { Avatar, FieldError, SearchInput, SectionCard, Skeleton } from '@components/ui';
import type { ResponseOf } from '@lib/api/api-fetch';
import { cx } from '@lib/cx';
import { moveFocus } from '@lib/roving-index';

export type Doctor = ResponseOf<'/api/doctors', 'get'>['items'][number];

export interface DoctorPickerProps {
  doctors: Doctor[] | undefined;
  value: string;
  onPick: (doctor: Doctor) => void;
  search: string;
  onSearch: (search: string) => void;
  error?: string | undefined;
  focusRef?: Ref<HTMLDivElement>;
}

const countText = (count: number) => (count === 1 ? '1 disponível' : `${count} disponíveis`);

export function DoctorPicker({
  doctors,
  value,
  onPick,
  search,
  onSearch,
  error,
  focusRef,
}: DoctorPickerProps) {
  const errorId = useId();
  return (
    <SectionCard
      title="Médico"
      flush
      action={
        doctors && <span className="text-text-muted text-[0.8125rem]">{countText(doctors.length)}</span>
      }
    >
      <div className="px-4 py-3 lg:px-5">
        <SearchInput
          label="Buscar médico"
          placeholder="Buscar pelo nome"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>
      <div
        ref={focusRef}
        tabIndex={-1}
        role="radiogroup"
        aria-label="Médico"
        aria-busy={!doctors}
        aria-describedby={error ? errorId : undefined}
        onKeyDown={(event) => moveFocus(event, '[role="radio"]', 'vertical')}
        className="border-border max-h-[196px] overflow-y-auto border-t [mask-image:linear-gradient(to_bottom,#000_calc(100%-32px),transparent)] focus-visible:outline-none lg:max-h-[360px]"
      >
        {!doctors ? (
          <div className="flex flex-col gap-3 p-4 lg:p-5">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : doctors.length === 0 ? (
          <p className="text-text-muted px-4 py-6 text-center text-[0.8125rem] lg:px-5">
            {search.trim()
              ? `Nenhum médico encontrado para "${search.trim()}".`
              : 'Nenhum médico disponível.'}
          </p>
        ) : (
          doctors.map((doctor) => {
            const selected = doctor.id === value;
            return (
              <button
                key={doctor.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onPick(doctor)}
                className={cx(
                  'border-border flex w-full items-center gap-3 border-b px-4 py-3 text-start transition-colors duration-150 last:border-b-0 lg:px-5',
                  selected ? 'bg-role-soft/60' : 'can-hover:bg-surface-muted',
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    'bg-surface size-[18px] shrink-0 rounded-full transition-[border-width,border-color] duration-150',
                    selected ? 'border-role-strong border-[5px]' : 'border-border-field border-[1.5px]',
                  )}
                />
                <Avatar name={doctor.fullName} seed={doctor.id} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-text truncate text-sm font-semibold">{doctor.fullName}</span>
                  <span className="text-text-secondary truncate text-[0.8125rem]">
                    {doctor.specialty.name} · {doctor.unit.name}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
      {error && (
        <div className="border-border border-t px-4 py-3 lg:px-5">
          <FieldError id={errorId}>{error}</FieldError>
        </div>
      )}
    </SectionCard>
  );
}
