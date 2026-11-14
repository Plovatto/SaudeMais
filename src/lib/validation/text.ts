import { z } from 'zod';

export const FREE_TEXT_MAX = 500;

const NO_CONTROL_ALLOWED: ReadonlySet<string> = new Set();
const LINE_BREAKS: ReadonlySet<string> = new Set(['\n', '\r', '\t']);

const codePoints = (value: string) => [...value].length;

const hasControlCharacter = (value: string, allowed: ReadonlySet<string>) =>
  [...value].some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return (code < 32 || code === 127) && !allowed.has(character);
  });

interface TextRules {
  controlMessage?: string;
  multiline?: boolean;
}

export function boundedText(
  min: number,
  max: number,
  message: string,
  { controlMessage = 'O texto não pode ter caracteres de controle.', multiline = false }: TextRules = {},
) {
  const allowed = multiline ? LINE_BREAKS : NO_CONTROL_ALLOWED;
  return z
    .string()
    .trim()
    .refine((value) => !hasControlCharacter(value, allowed), controlMessage)
    .refine((value) => codePoints(value) >= min && codePoints(value) <= max, message);
}

export const freeText = (max = FREE_TEXT_MAX) =>
  boundedText(0, max, `Use até ${max} caracteres.`, { multiline: true });
