import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useForm, type DefaultValues, type FieldValues, type Path, type Resolver } from 'react-hook-form';
import type { z } from 'zod';
import { useToast } from '@components/ui';
import type { MessageOverrides } from '@lib/messages/errors.pt-BR';
import { useFormSubmit } from '@hooks/useFormSubmit';
import { catalogMessages } from './catalog-messages';

export interface CatalogFormOptions<T extends FieldValues> {
  schema: z.ZodType<T, FieldValues>;
  defaultValues: DefaultValues<T> | undefined;
  fields: readonly Path<T>[];
  save: (values: T) => Promise<unknown>;
  invalidate: readonly QueryKey[];
  success: string;
  onDone?: () => void;
  messages?: MessageOverrides;
}

export function useCatalogForm<T extends FieldValues>({
  schema,
  defaultValues,
  fields,
  save,
  invalidate,
  success,
  onDone,
  messages = catalogMessages,
}: CatalogFormOptions<T>) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const form = useForm<T>({
    resolver: zodResolver(schema) as Resolver<T>,
    ...(defaultValues && { defaultValues }),
  });
  const { alert, run } = useFormSubmit(form.setError, fields, undefined, messages);
  const onSubmit = form.handleSubmit((values) =>
    run(async () => {
      await save(values);
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      show({ message: success, tone: 'success' });
      onDone?.();
    }),
  );
  return { ...form, alert, onSubmit };
}
