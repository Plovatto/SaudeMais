import { describe, expect, it } from 'vitest';
import { optionalNumber } from './number';

const weight = optionalNumber({
  min: 1,
  max: 500,
  decimals: 2,
  format: 'formato',
  precision: 'casas',
  range: 'faixa',
});

const whole = optionalNumber({ min: 50, max: 300, format: 'inteiro', range: 'faixa' });

describe('optionalNumber', () => {
  it.each([
    ['', undefined],
    ['  ', undefined],
    [' 72,4 ', 72.4],
    ['72.45', 72.45],
    ['72,450', 72.45],
    ['1', 1],
    ['500,00', 500],
  ])('reads %j as %j', (value, expected) => {
    expect(weight.parse(value)).toBe(expected);
  });

  it.each([
    ['abc', 'formato'],
    ['-5', 'formato'],
    ['72,', 'formato'],
    ['1.000,5', 'formato'],
    ['72,456', 'casas'],
    ['0,99', 'faixa'],
    ['500,01', 'faixa'],
  ])('rejects %j with %j', (value, message) => {
    expect(weight.safeParse(value).error?.issues[0]?.message).toBe(message);
  });

  it('uses the format message for decimals on whole numbers and accepts trailing zeros', () => {
    expect(whole.safeParse('120,5').error?.issues[0]?.message).toBe('inteiro');
    expect(whole.parse('120,0')).toBe(120);
    expect(whole.safeParse('400').error?.issues[0]?.message).toBe('faixa');
  });
});
