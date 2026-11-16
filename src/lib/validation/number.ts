import { z } from 'zod';

interface NumberRules {
  min: number;
  max: number;
  decimals?: number;
  format: string;
  range: string;
}

const DECIMAL = /^\d+(?:[.,](\d+))?$/;

const parseDecimal = (value: string) => Number(value.replace(',', '.'));

const fits = (value: string, decimals: number) => (DECIMAL.exec(value)?.[1]?.length ?? 0) <= decimals;

export function optionalNumber({ min, max, decimals = 0, format, range }: NumberRules) {
  return z
    .string()
    .trim()
    .refine((value) => value === '' || (DECIMAL.test(value) && fits(value, decimals)), {
      message: format,
      abort: true,
    })
    .refine((value) => value === '' || (parseDecimal(value) >= min && parseDecimal(value) <= max), range)
    .transform((value) => (value === '' ? undefined : parseDecimal(value)));
}
