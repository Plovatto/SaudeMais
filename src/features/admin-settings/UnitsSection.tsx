import { LuMapPin, LuPhone } from 'react-icons/lu';
import { Input } from '@components/ui';
import { formatPhone } from '@lib/phone';
import { queryKeys } from '@lib/query-keys';
import { fromMinutes, toMinutes } from '@lib/time-of-day';
import { CatalogList } from './CatalogList';
import { FormShell } from './FormShell';
import { HoursEditor } from './HoursEditor';
import { unitsApi, type Unit } from './settings-api';
import { unitSchema, WEEKDAYS, type UnitValues } from './settings-schemas';
import { useCatalogForm } from './useCatalogForm';

function valuesOf(unit: Unit | null): UnitValues {
  return {
    name: unit?.name ?? '',
    address: unit?.address ?? '',
    phone: unit ? formatPhone(unit.phone) : '',
    hours: WEEKDAYS.map((_weekday, weekday) => {
      const day = unit?.hours.find((entry) => entry.weekday === weekday);
      return day
        ? { open: true, start: fromMinutes(day.openMin), end: fromMinutes(day.closeMin) }
        : { open: false, start: '08:00', end: '18:00' };
    }),
  };
}

function toBody({ hours, ...values }: UnitValues) {
  return {
    ...values,
    hours: hours.flatMap((day, weekday) =>
      day.open ? [{ weekday, openMin: toMinutes(day.start), closeMin: toMinutes(day.end) }] : [],
    ),
  };
}

function UnitForm({ unit, onDone }: { unit: Unit | null; onDone: () => void }) {
  const form = useCatalogForm({
    schema: unitSchema,
    defaultValues: valuesOf(unit),
    fields: ['name', 'address', 'phone'],
    save: (values) => (unit ? unitsApi.update(unit.id, toBody(values)) : unitsApi.create(toBody(values))),
    invalidate: queryKeys.catalog.units,
    success: unit ? 'Unidade atualizada.' : 'Unidade criada.',
    onDone,
  });
  const { errors, isSubmitting } = form.formState;
  return (
    <FormShell
      label="Unidade"
      onSubmit={form.onSubmit}
      alert={form.alert}
      submitting={isSubmitting}
      onCancel={onDone}
    >
      <Input label="Nome" autoComplete="off" error={errors.name?.message} {...form.register('name')} />
      <Input
        label="Endereço"
        autoComplete="off"
        icon={<LuMapPin />}
        error={errors.address?.message}
        {...form.register('address')}
      />
      <Input
        label="Telefone"
        type="tel"
        inputMode="tel"
        placeholder="(11) 3333-4444"
        icon={<LuPhone />}
        error={errors.phone?.message}
        {...form.register('phone')}
      />
      <HoursEditor control={form.control} register={form.register} errors={errors} />
    </FormShell>
  );
}

const openDays = (unit: Unit) => {
  const count = unit.hours.length;
  return count === 0 ? 'sem horário definido' : `aberta ${count} ${count === 1 ? 'dia' : 'dias'} por semana`;
};

export function UnitsSection() {
  return (
    <CatalogList<Unit>
      title="Unidades"
      description="Locais de atendimento, com endereço, telefone e horário de cada dia da semana."
      createLabel="Nova unidade"
      editLabel="Editar unidade"
      emptyTitle="Nenhuma unidade cadastrada"
      queryKey={queryKeys.catalog.units}
      load={unitsApi.list}
      describe={(item) => ({ name: item.name, details: `${item.address} · ${openDays(item)}` })}
      setActive={(item, isActive) => unitsApi.update(item.id, { isActive })}
      renderForm={(item, close) => <UnitForm unit={item} onDone={close} />}
    />
  );
}
