import { useState } from 'react';
import { LuSlidersHorizontal } from 'react-icons/lu';
import { Button, CountBadge, Dialog, RadioChips, TileButton } from '@components/ui';
import { activeCount, NO_FILTERS, statusOptions, TYPE_OPTIONS, type BookingFilters } from './booking-filters';
import type { BookingListParams } from './bookings-api';

export interface BookingsFilterProps {
  scope: BookingListParams['scope'];
  filters: BookingFilters;
  onApply: (filters: BookingFilters) => void;
}

const activeText = (count: number) => (count === 1 ? '1 filtro ativo' : `${count} filtros ativos`);

export function BookingsFilter({ scope, filters, onApply }: BookingsFilterProps) {
  const [draft, setDraft] = useState<BookingFilters | null>(null);
  const count = activeCount(filters);
  const label = count > 0 ? 'Filtros' : 'Todos';
  const apply = (next: BookingFilters) => {
    onApply(next);
    setDraft(null);
  };

  return (
    <>
      <TileButton
        aria-haspopup="dialog"
        aria-label={`Filtrar, ${label.toLowerCase()}${count > 0 ? `: ${activeText(count)}` : ''}`}
        onClick={() => setDraft(filters)}
        icon={<LuSlidersHorizontal />}
        label={label}
        badge={
          count > 0 && (
            <CountBadge className="bg-role-strong text-on-role end-1.5 top-1.5">{count}</CountBadge>
          )
        }
        className="w-20 shrink-0 px-1"
      >
        <span className="text-sm font-semibold">Filtrar</span>
      </TileButton>
      <Dialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        title="Filtrar agendamentos"
        placement="sheet"
      >
        {draft && (
          <div className="flex flex-col gap-5">
            <RadioChips
              legend="Tipo"
              options={TYPE_OPTIONS}
              value={draft.tipo}
              onValueChange={(tipo) => setDraft({ ...draft, tipo })}
            />
            <RadioChips
              legend="Status"
              options={statusOptions(scope)}
              value={draft.status}
              onValueChange={(status) => setDraft({ ...draft, status })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => apply(NO_FILTERS)}>
                Limpar
              </Button>
              <Button onClick={() => apply(draft)}>Aplicar</Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
