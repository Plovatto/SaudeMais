import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from '@lib/query-keys';
import { policyApi, type Policy } from './settings-api';
import { policySchema, type PolicyValues } from './settings-schemas';
import { useCatalogForm } from './useCatalogForm';

export const POLICY_FORM_ID = 'politica-agendamento';
export const POLICY_CARD_ID = 'politica';

const valuesOf = ({ updatedAt: _updatedAt, ...values }: Policy): PolicyValues => values;

export function usePolicySettings() {
  const query = useQuery({
    queryKey: queryKeys.catalog.policy,
    queryFn: ({ signal }) => policyApi.get(signal),
  });
  const form = useCatalogForm<PolicyValues>({
    schema: policySchema,
    defaultValues: query.data && valuesOf(query.data),
    fields: policySchema.keyof().options,
    save: policyApi.update,
    invalidate: [queryKeys.catalog.policy],
    success: 'Configurações salvas.',
    onDone: () => {
      form.reset(form.getValues());
      document.getElementById(POLICY_CARD_ID)?.focus({ preventScroll: true });
    },
  });
  const { reset } = form;
  useEffect(() => {
    if (query.data) reset(valuesOf(query.data), { keepDirtyValues: true });
  }, [query.data, reset]);
  return {
    query,
    form,
    dirty: query.data !== undefined && form.formState.isDirty,
    submitting: form.formState.isSubmitting,
  };
}

export type PolicySettings = ReturnType<typeof usePolicySettings>;
