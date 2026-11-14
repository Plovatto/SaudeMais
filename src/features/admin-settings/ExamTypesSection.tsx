import { Input, Select, Textarea } from '@components/ui';
import { queryKeys } from '@lib/query-keys';
import { CatalogList } from './CatalogList';
import { FormShell } from './FormShell';
import { examTypesApi, type ExamType } from './settings-api';
import { examTypeSchema, type ExamTypeValues } from './settings-schemas';
import { useCatalogForm } from './useCatalogForm';

const KIND_LABELS: Record<ExamType['kind'], string> = { lab: 'Laboratorial', imaging: 'Imagem' };

const valuesOf = (examType: ExamType | null): ExamTypeValues => ({
  code: examType?.code ?? '',
  name: examType?.name ?? '',
  kind: examType?.kind ?? 'lab',
  durationMin: examType?.durationMin ?? 15,
  preparationNotes: examType?.preparationNotes ?? '',
});

const toBody = ({ preparationNotes, ...values }: ExamTypeValues) => ({
  ...values,
  preparationNotes: preparationNotes === '' ? null : preparationNotes,
});

function ExamTypeForm({ examType, onDone }: { examType: ExamType | null; onDone: () => void }) {
  const form = useCatalogForm({
    schema: examTypeSchema,
    defaultValues: valuesOf(examType),
    fields: ['code', 'name', 'kind', 'durationMin', 'preparationNotes'],
    save: (values) =>
      examType ? examTypesApi.update(examType.id, toBody(values)) : examTypesApi.create(toBody(values)),
    invalidate: queryKeys.catalog.examTypes,
    success: examType ? 'Tipo de exame atualizado.' : 'Tipo de exame criado.',
    onDone,
  });
  const { errors, isSubmitting } = form.formState;
  return (
    <FormShell
      label="Tipo de exame"
      onSubmit={form.onSubmit}
      alert={form.alert}
      submitting={isSubmitting}
      onCancel={onDone}
    >
      <Input label="Nome" autoComplete="off" error={errors.name?.message} {...form.register('name')} />
      <Input
        label="Código"
        hint="Usado na integração com o laboratório. Letras minúsculas, números e _."
        autoComplete="off"
        error={errors.code?.message}
        {...form.register('code')}
      />
      <Select label="Tipo" error={errors.kind?.message} {...form.register('kind')}>
        {Object.entries(KIND_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Input
        label="Duração (minutos)"
        type="number"
        inputMode="numeric"
        step={5}
        hint="Múltiplos de 5, de 5 a 240."
        error={errors.durationMin?.message}
        {...form.register('durationMin', { valueAsNumber: true })}
      />
      <Textarea
        label="Preparo (opcional)"
        hint="Orientações exibidas a quem agenda, como jejum."
        error={errors.preparationNotes?.message}
        {...form.register('preparationNotes')}
      />
    </FormShell>
  );
}

export function ExamTypesSection() {
  return (
    <CatalogList<ExamType>
      title="Tipos de exame"
      description="Exames que as unidades podem oferecer, com duração e orientações de preparo."
      createLabel="Novo tipo de exame"
      editLabel="Editar tipo de exame"
      emptyTitle="Nenhum tipo de exame cadastrado"
      queryKey={queryKeys.catalog.examTypes}
      load={examTypesApi.list}
      describe={(item) => ({
        name: item.name,
        details: `${KIND_LABELS[item.kind]} · ${item.durationMin} min · código ${item.code}`,
      })}
      setActive={(item, isActive) => examTypesApi.update(item.id, { isActive })}
      renderForm={(item, close) => <ExamTypeForm examType={item} onDone={close} />}
    />
  );
}
