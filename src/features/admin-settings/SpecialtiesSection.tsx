import { Input } from '@components/ui';
import { queryKeys } from '@lib/query-keys';
import { CatalogList } from './CatalogList';
import { FormShell } from './FormShell';
import { specialtiesApi, type Specialty } from './settings-api';
import { specialtySchema } from './settings-schemas';
import { useCatalogForm } from './useCatalogForm';

function SpecialtyForm({ specialty, onDone }: { specialty: Specialty | null; onDone: () => void }) {
  const form = useCatalogForm({
    schema: specialtySchema,
    defaultValues: specialty ?? { name: '', council: 'CRM', appointmentDurationMin: 30 },
    fields: ['name', 'council', 'appointmentDurationMin'],
    save: (values) =>
      specialty ? specialtiesApi.update(specialty.id, values) : specialtiesApi.create(values),
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
    </FormShell>
  );
}

export function SpecialtiesSection() {
  return (
    <CatalogList<Specialty>
      title="Especialidades"
      description="Áreas de atendimento, com o conselho profissional e a duração padrão da consulta."
      createLabel="Nova especialidade"
      editLabel="Editar especialidade"
      emptyTitle="Nenhuma especialidade cadastrada"
      queryKey={queryKeys.catalog.specialties}
      load={specialtiesApi.list}
      describe={(item) => ({
        name: item.name,
        details: `${item.council} · consultas de ${item.appointmentDurationMin} min`,
      })}
      setActive={(item, isActive) => specialtiesApi.update(item.id, { isActive })}
      renderForm={(item, close) => <SpecialtyForm specialty={item} onDone={close} />}
    />
  );
}
