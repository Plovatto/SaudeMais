import { LuBuilding2, LuMapPin, LuPhone } from 'react-icons/lu';
import { ActiveField } from '@components/forms/FormFields';
import { FormShell } from '@components/forms/FormShell';
import { Input } from '@components/ui';
import { WEEKDAYS } from '@constants/weekdays';
import { formatPhone } from '@lib/phone';
import { plural } from '@lib/plural';
import { queryKeys } from '@lib/query-keys';
import { fromMinutes, toMinutes } from '@lib/time-of-day';
import { CatalogCard } from './CatalogCard';
import { HoursEditor } from './HoursEditor';
import { unitsApi, type Unit } from './settings-api';
import { unitSchema, type UnitValues } from './settings-schemas';
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
    isActive: unit?.isActive ?? true,
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
    save: (values) => unitsApi.save(unit?.id ?? null, toBody(values)),
    invalidate: [queryKeys.catalog.units, queryKeys.catalog.activeUnits],
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
      {unit && (
        <ActiveField
          control={form.control}
          name="isActive"
          label="Unidade ativa"
          hint="Desativada, deixa de aparecer para quem agenda."
        />
      )}
    </FormShell>
  );
}

const openDays = (unit: Unit) => {
  const count = unit.hours.length;
  return count === 0 ? 'sem horário definido' : `aberta ${plural(count, 'dia', 'dias')} por semana`;
};

export function UnitsSection() {
  return (
    <CatalogCard<Unit>
      id="unidades"
      title="Unidades"
      icon={<LuBuilding2 />}
      addLabel="Adicionar unidade"
      createLabel="Nova unidade"
      editLabel="Editar unidade"
      empty="Nenhuma unidade cadastrada."
      statusLabels={['Ativa', 'Inativa']}
      queryKey={queryKeys.catalog.units}
      load={unitsApi.list}
      describe={(item) => ({ name: item.name, details: `${item.address} · ${openDays(item)}` })}
      renderForm={(item, close) => <UnitForm unit={item} onDone={close} />}
    />
  );
}
