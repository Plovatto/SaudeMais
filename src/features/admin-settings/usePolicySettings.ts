import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from '@lib/query-keys';
import { policyApi, type Policy } from './settings-api';
import { policySchema, type PolicyValues } from './settings-schemas';
import { useCatalogForm } from './useCatalogForm';

export const POLICY_FORM_ID = 'politica-agendamento';

const valuesOf = ({ updatedAt: _updatedAt, ...values }: Policy): PolicyValues => values;

export function usePolicySettings() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.catalog.policy,
    queryFn: ({ signal }) => policyApi.get(signal),
  });
  const form = useCatalogForm<PolicyValues>({
    schema: policySchema,
    defaultValues: query.data && valuesOf(query.data),
    fields: policySchema.keyof().options,
    save: async (body) => queryClient.setQueryData(queryKeys.catalog.policy, await policyApi.update(body)),
    invalidate: queryKeys.catalog.policy,
    success: 'Configurações salvas.',
  });
  const { reset } = form;
  useEffect(() => {
    if (query.data) reset(valuesOf(query.data));
  }, [query.data, reset]);
  return {
    query,
    form,
    dirty: query.data !== undefined && form.formState.isDirty,
    submitting: form.formState.isSubmitting,
  };
}

export type PolicySettings = ReturnType<typeof usePolicySettings>;
