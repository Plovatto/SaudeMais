import { useId, type Ref } from 'react';
import {
  Avatar,
  FieldError,
  SearchInput,
  ListMessage,
  ListSkeleton,
  RowText,
  SectionCard,
  stagger,
} from '@components/ui';
import type { ResponseOf } from '@lib/api/api-fetch';
import { cx } from '@lib/cx';
import { moveFocus } from '@lib/roving-index';
import { plural } from '@lib/plural';

export type Doctor = ResponseOf<'/api/doctors', 'get'>['items'][number];

export interface DoctorPickerProps {
  doctors: Doctor[] | undefined;
  total?: number | undefined;
  value: string;
  onPick: (doctor: Doctor) => void;
  search: string;
  searched: string;
  onSearch: (search: string) => void;
  error?: string | undefined;
  focusRef?: Ref<HTMLDivElement>;
}

const countText = (count: number) => plural(count, 'disponível', 'disponíveis');

export function DoctorPicker({
  doctors,
  total = doctors?.length ?? 0,
  value,
  onPick,
  search,
  searched,
  onSearch,
  error,
  focusRef,
}: DoctorPickerProps) {
  const errorId = useId();
  const hasChecked = doctors?.some((doctor) => doctor.id === value) ?? false;
  return (
    <SectionCard
      title="Médico"
      action={doctors && <span className="text-text-muted text-[0.8125rem]">{countText(total)}</span>}
    >
      <div className="-mt-1 lg:-mt-0.5">
        <SearchInput
          label="Buscar médico"
          placeholder="Buscar pelo nome"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault();
          }}
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
        className={cx(
          'border-border -mx-4 max-h-[196px] overflow-y-auto border-t [mask-image:linear-gradient(to_bottom,#000_calc(100%-32px),transparent)] pb-3 focus-visible:outline-none lg:-mx-5 lg:max-h-[300px]',
          !error && '-mb-5',
        )}
      >
        {!doctors ? (
          <ListSkeleton />
        ) : doctors.length === 0 ? (
          <ListMessage>
            {searched ? `Nenhum médico encontrado para "${searched}".` : 'Nenhum médico disponível.'}
          </ListMessage>
        ) : (
          <>
            {doctors.map((doctor, index) => {
              const selected = doctor.id === value;
              return (
                <button
                  key={doctor.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected || (!hasChecked && index === 0) ? 0 : -1}
                  onClick={() => onPick(doctor)}
                  className={cx(
                    'border-border relative flex w-full items-center gap-3.5 border-b px-4 py-3 text-start transition-colors duration-150 lg:px-5',
                    stagger(index),
                    selected
                      ? 'before:bg-role bg-[color-mix(in_oklab,var(--role-soft)_55%,var(--surface))] before:absolute before:inset-y-2.5 before:start-0 before:w-[3px] before:rounded-e-[3px]'
                      : 'can-hover:bg-surface-muted',
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
                  <RowText
                    title={doctor.fullName}
                    meta={doctor.unit.name}
                    titleClassName="truncate"
                    metaClassName="truncate"
                  />
                </button>
              );
            })}
            {total > doctors.length && (
              <ListMessage>
                {`Mostrando ${doctors.length} de ${total}. ${searched ? 'Refine a busca para encontrar outros médicos.' : 'Busque pelo nome para encontrar os demais.'}`}
              </ListMessage>
            )}
          </>
        )}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </SectionCard>
  );
}
