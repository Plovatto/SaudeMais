import { LuStethoscope } from 'react-icons/lu';
import { ActiveField } from '@components/forms/FormFields';
import { Input } from '@components/ui';
import { queryKeys } from '@lib/query-keys';
import { CatalogCard } from './CatalogCard';
import { FormShell } from './FormShell';
import { specialtiesApi, type Specialty } from './settings-api';
import { specialtySchema } from './settings-schemas';
import { useCatalogForm } from './useCatalogForm';

const valuesOf = (specialty: Specialty | null) => ({
  name: specialty?.name ?? '',
  council: specialty?.council ?? 'CRM',
  appointmentDurationMin: specialty?.appointmentDurationMin ?? 30,
  isActive: specialty?.isActive ?? true,
});

function SpecialtyForm({ specialty, onDone }: { specialty: Specialty | null; onDone: () => void }) {
  const form = useCatalogForm({
    schema: specialtySchema,
    defaultValues: valuesOf(specialty),
    fields: ['name', 'council', 'appointmentDurationMin'],
    save: (values) => specialtiesApi.save(specialty?.id ?? null, values),
    invalidate: queryKeys.catalog.specialties,
    success: specialty ? 'Especialidade atualizada.' : 'Especialidade criada.',
    onDone,
  });
  const { errors, isSubmitting } = form.formState;
  return (
    <FormShell
      label="Especialidade"
      onSubmit={form.onSubmit}
      alert={form.alert}
      submitting={isSubmitting}
      onCancel={onDone}
    >
      <Input label="Nome" autoComplete="off" error={errors.name?.message} {...form.register('name')} />
      <Input
        label="Conselho profissional"
        hint="Sigla do conselho que registra quem atende (ex.: CRM, CRN, CRP)."
        autoComplete="off"
        error={errors.council?.message}
        {...form.register('council')}
      />
      <Input
        label="Duração da consulta (minutos)"
        type="number"
        inputMode="numeric"
        step={5}
        hint="Múltiplos de 5, de 10 a 240. Vale para novos agendamentos."
        error={errors.appointmentDurationMin?.message}
        {...form.register('appointmentDurationMin', { valueAsNumber: true })}
      />
      {specialty && (
        <ActiveField
          control={form.control}
          name="isActive"
          label="Especialidade ativa"
          hint="Desativada, deixa de aparecer para quem agenda."
        />
      )}
    </FormShell>
  );
}

export function SpecialtiesSection() {
  return (
    <CatalogCard<Specialty>
      id="especialidades"
      title="Especialidades"
      icon={<LuStethoscope />}
      addLabel="Adicionar especialidade"
      createLabel="Nova especialidade"
      editLabel="Editar especialidade"
      empty="Nenhuma especialidade cadastrada."
      statusLabels={['Ativa', 'Inativa']}
      queryKey={queryKeys.catalog.specialties}
      load={specialtiesApi.list}
      describe={(item) => ({
        name: item.name,
        details: `${item.council} · consultas de ${item.appointmentDurationMin} min`,
      })}
      renderForm={(item, close) => <SpecialtyForm specialty={item} onDone={close} />}
    />
  );
}
