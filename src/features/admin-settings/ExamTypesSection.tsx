import { LuFlaskConical } from 'react-icons/lu';
import { ActiveField, FormDropdown } from '@components/forms/FormFields';
import { FormShell } from '@components/forms/FormShell';
import { Input, Textarea } from '@components/ui';
import { queryKeys } from '@lib/query-keys';
import { CatalogCard } from './CatalogCard';
import { examTypesApi, type ExamType } from './settings-api';
import { examTypeSchema, type ExamTypeValues } from './settings-schemas';
import { useCatalogForm } from './useCatalogForm';

const KIND_LABELS: Record<ExamType['kind'], string> = { lab: 'Laboratorial', imaging: 'Imagem' };

const KIND_OPTIONS = [
  { value: 'lab', label: KIND_LABELS.lab, hint: 'Coleta e análise de amostras' },
  { value: 'imaging', label: KIND_LABELS.imaging, hint: 'Raio-X, ultrassom e tomografia' },
];

const valuesOf = (examType: ExamType | null): ExamTypeValues => ({
  code: examType?.code ?? '',
  name: examType?.name ?? '',
  kind: examType?.kind ?? 'lab',
  durationMin: examType?.durationMin ?? 15,
  preparationNotes: examType?.preparationNotes ?? '',
  isActive: examType?.isActive ?? true,
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
    save: (values) => examTypesApi.save(examType?.id ?? null, toBody(values)),
    invalidate: [
      queryKeys.catalog.examTypes,
      queryKeys.catalog.activeExamTypes,
      queryKeys.catalog.offers,
      queryKeys.catalog.activeUnits,
    ],
    success: examType ? 'Tipo de exame atualizado.' : 'Tipo de exame criado.',
    onDone,
  });
  const { errors, isSubmitting } = form.formState;
  return (
    <FormShell onSubmit={form.onSubmit} alert={form.alert} submitting={isSubmitting} onCancel={onDone}>
      <Input label="Nome" autoComplete="off" error={errors.name?.message} {...form.register('name')} />
      <Input
        label="Código"
        hint="Usado na integração com o laboratório. Letras minúsculas, números e _."
        autoComplete="off"
        error={errors.code?.message}
        {...form.register('code')}
      />
      <FormDropdown
        control={form.control}
        name="kind"
        label="Tipo"
        placeholder="Escolha o tipo"
        options={KIND_OPTIONS}
      />
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
      {examType && (
        <ActiveField
          control={form.control}
          name="isActive"
          label="Tipo de exame ativo"
          hint="Desativado, deixa de aparecer para quem agenda."
        />
      )}
    </FormShell>
  );
}

export function ExamTypesSection() {
  return (
    <CatalogCard<ExamType>
      id="exames"
      title="Tipos de exame"
      icon={<LuFlaskConical />}
      addLabel="Adicionar tipo de exame"
      createLabel="Novo tipo de exame"
      editLabel="Editar tipo de exame"
      empty="Nenhum tipo de exame cadastrado."
      statusLabels={['Ativo', 'Inativo']}
      queryKey={queryKeys.catalog.examTypes}
      load={examTypesApi.list}
      describe={(item) => ({
        name: item.name,
        details: `${KIND_LABELS[item.kind]} · ${item.durationMin} min · código ${item.code}`,
      })}
      renderForm={(item, close) => <ExamTypeForm examType={item} onDone={close} />}
    />
  );
}
