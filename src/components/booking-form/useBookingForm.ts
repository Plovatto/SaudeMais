import { useInfiniteQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useWatch, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { ApiError } from '@lib/api/api-error';
import type { FieldAliases } from '@lib/form-errors';
import {
  errorMessage,
  GENERIC_ERROR_MESSAGE,
  messageFor,
  type MessageOverrides,
} from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { useFormSubmit } from '@lib/useFormSubmit';
import {
  firstWindowPage,
  horizonEnd,
  loadedThrough,
  nextWindowPage,
  type AvailableDay,
  type WindowPage,
} from './availability';

type SlotValues = { date: string; startsAt: string; notes: string };

const STALE_SLOT_CODES = new Set(['SLOT_TAKEN', 'NO_CAPACITY', 'OUTSIDE_AVAILABILITY']);

const SLOT_CODES = new Set([...STALE_SLOT_CODES, 'PATIENT_CONFLICT']);

const MISSING_MESSAGE = 'Preencha todas as informações.';

const SLOT_GONE_MESSAGE = messageFor('SLOT_TAKEN') ?? GENERIC_ERROR_MESSAGE;

interface BookingFormOptions<TIn extends FieldValues, TOut, R> {
  fields: readonly Path<TIn>[];
  availability: {
    queryKey: QueryKey;
    load: (signal: AbortSignal, page: WindowPage) => Promise<AvailableDay[]>;
    enabled: boolean;
  };
  fieldByCode?: Partial<Record<string, Path<TIn>>>;
  fieldAliases?: FieldAliases<TIn>;
  messages: MessageOverrides;
  onNotFound: () => void;
  book: (values: TOut) => Promise<R>;
  onBooked: (result: R) => void;
}

export function useBookingForm<TIn extends SlotValues, TOut, R>(
  form: UseFormReturn<TIn, unknown, TOut>,
  {
    fields,
    availability: source,
    fieldByCode = {},
    fieldAliases,
    messages,
    onNotFound,
    book,
    onBooked,
  }: BookingFormOptions<TIn, TOut, R>,
) {
  const queryClient = useQueryClient();
  const [missing, setMissing] = useState(false);
  const { control, register, getValues, setValue, setError, clearErrors, formState } =
    form as unknown as UseFormReturn<SlotValues>;
  const [date, startsAt] = useWatch({ control, name: ['date', 'startsAt'] });
  const availability = useInfiniteQuery({
    queryKey: source.queryKey,
    queryFn: ({ signal, pageParam }) => source.load(signal, pageParam),
    initialPageParam: firstWindowPage(),
    getNextPageParam: (_last, pages, first) => nextWindowPage(first.start, pages.length),
    enabled: source.enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const loaded = useMemo(() => availability.data?.pages.flat(), [availability.data]);
  const days = source.enabled ? (loaded ?? []) : [];
  const sourceKey = JSON.stringify(source.queryKey);
  const [want, setWant] = useState({ key: '', until: '' });
  const wanted = want.key === sourceKey ? want.until : '';
  const start = (availability.data?.pageParams[0] as WindowPage | undefined)?.start;
  const through = start ? loadedThrough(start, availability.data?.pages.length ?? 0) : '';
  const { hasNextPage, isFetching, fetchNextPage } = availability;
  const reset = () => queryClient.resetQueries({ queryKey: source.queryKey });
  const slots = days.find((day) => day.date === date)?.slots ?? [];
  const { errors, isSubmitting } = formState;

  useEffect(() => {
    if (!through || wanted <= through || !hasNextPage || isFetching) return;
    void fetchNextPage().then((result) => {
      if (result.isFetchNextPageError) setWant({ key: '', until: '' });
    });
  }, [wanted, through, hasNextPage, isFetching, fetchNextPage]);

  useEffect(() => {
    if (!loaded) return;
    const current = getValues();
    const day = loaded.find((item) => item.date === current.date);
    if (current.date && !day) {
      setValue('date', '');
      setValue('startsAt', '');
      clearErrors('startsAt');
      setError('date', { message: SLOT_GONE_MESSAGE }, { shouldFocus: true });
    } else if (current.startsAt && !day?.slots.some((slot) => slot.startsAt === current.startsAt)) {
      setValue('startsAt', '');
      setError('startsAt', { message: SLOT_GONE_MESSAGE }, { shouldFocus: true });
    }
  }, [loaded, getValues, setValue, setError, clearErrors]);

  const notFound = useEffectEvent(onNotFound);

  useEffect(() => {
    if (availability.error instanceof ApiError && availability.error.code === 'NOT_FOUND') notFound();
  }, [availability.error]);

  const clearSlot = () => setValue('startsAt', '');
  const clearDay = () => {
    setValue('date', '');
    clearSlot();
  };
  const pickDate = (value: string) => {
    setValue('date', value);
    clearErrors('date');
    if (
      !days.find((day) => day.date === value)?.slots.some((slot) => slot.startsAt === getValues('startsAt'))
    ) {
      clearSlot();
    }
  };
  const pickSlot = (value: string) => {
    setValue('startsAt', value);
    clearErrors('startsAt');
  };

  const { alert, run } = useFormSubmit(
    form.setError,
    fields,
    (error) => {
      if (!(error instanceof ApiError)) return false;
      if (error.code === 'NOT_FOUND') onNotFound();
      if (SLOT_CODES.has(error.code)) {
        if (STALE_SLOT_CODES.has(error.code)) {
          clearSlot();
          void reset();
        }
        setError('startsAt', { message: errorMessage(error) }, { shouldFocus: true });
        return true;
      }
      const field = fieldByCode[error.code];
      if (!field) return false;
      form.setError(field, { message: errorMessage(error) }, { shouldFocus: true });
      return true;
    },
    messages,
    fieldAliases,
  );

  const onSubmit = form.handleSubmit(
    (values) => {
      setMissing(false);
      return run(async () => {
        const result = await book(values);
        void queryClient.resetQueries({ queryKey: queryKeys.booking.availabilities });
        void queryClient.invalidateQueries({ queryKey: queryKeys.patient.all });
        form.reset();
        onBooked(result);
      });
    },
    () => setMissing(true),
  );

  const showMissing = missing && Object.keys(errors).some((key) => key !== 'notes');
  const field = (name: keyof SlotValues) => ({ error: errors[name]?.message, ...register(name) });

  return {
    date,
    startsAt,
    pickDate,
    pickSlot,
    focusRef: (name: 'date' | 'startsAt') => register(name).ref,
    errors: { date: errors.date?.message, startsAt: errors.startsAt?.message },
    clearDay,
    onSubmit,
    field,
    submitting: isSubmitting,
    banner: alert ?? (showMissing ? MISSING_MESSAGE : null),
    slots: {
      days,
      slots,
      loading: availability.isFetching && days.length === 0,
      failure: availability.error,
      retry: () => void reset(),
      empty: availability.data?.pages[0]?.length === 0,
      reach: start ? horizonEnd(start) : undefined,
      showUntil: (until: string) => setWant({ key: sourceKey, until }),
      messages,
    },
  };
}

export type BookingFormState = ReturnType<typeof useBookingForm>;
