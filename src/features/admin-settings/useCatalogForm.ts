import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useForm, type DefaultValues, type FieldValues, type Path, type Resolver } from 'react-hook-form';
import type { z } from 'zod';
import { useToast } from '@components/ui';
import { useFormSubmit } from '@lib/useFormSubmit';

export interface CatalogFormOptions<T extends FieldValues> {
  schema: z.ZodType<T, FieldValues>;
  defaultValues: DefaultValues<T>;
  fields: readonly Path<T>[];
  save: (values: T) => Promise<unknown>;
  invalidate: QueryKey;
  success: string;
  onDone?: () => void;
}

export function useCatalogForm<T extends FieldValues>({
  schema,
  defaultValues,
  fields,
  save,
  invalidate,
  success,
  onDone,
}: CatalogFormOptions<T>) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const form = useForm<T>({ resolver: zodResolver(schema) as Resolver<T>, defaultValues });
  const { alert, run } = useFormSubmit(form.setError, fields);
  const onSubmit = form.handleSubmit((values) =>
    run(async () => {
      await save(values);
      await queryClient.invalidateQueries({ queryKey: invalidate });
      show({ message: success, tone: 'success' });
      onDone?.();
    }),
  );
  return { ...form, alert, onSubmit };
}
