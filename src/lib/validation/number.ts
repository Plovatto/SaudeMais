import { z } from 'zod';

interface NumberRules {
  min: number;
  max: number;
  decimals?: number;
  format: string;
  precision?: string;
  range: string;
}

const NUMBER = /^\d+(?:[.,](\d+))?$/;

const parseDecimal = (value: string) => Number(value.replace(',', '.'));

const decimalsOf = (value: string) => NUMBER.exec(value)?.[1]?.replace(/0+$/, '').length ?? 0;

export function optionalNumber({ min, max, decimals = 0, format, precision = format, range }: NumberRules) {
  const numeric = (value: string) => value !== '' && NUMBER.test(value);
  return z
    .string()
    .trim()
    .refine((value) => value === '' || NUMBER.test(value), format)
    .refine((value) => !numeric(value) || decimalsOf(value) <= decimals, precision)
    .refine((value) => !numeric(value) || (parseDecimal(value) >= min && parseDecimal(value) <= max), range)
    .transform((value) => (value === '' ? undefined : parseDecimal(value)));
}
