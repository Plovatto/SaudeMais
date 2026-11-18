import { describe, expect, it } from 'vitest';
import { firstName, hueOf, initials } from './initials';

describe('initials', () => {
  it.each([
    ['Ana Maria Silva', 'AS'],
    ['Dr. João Silveira', 'JS'],
    ['Dra. Carla Mendes', 'CM'],
    ['carla', 'C'],
    ['  Bruno   Lima  ', 'BL'],
    ['', ''],
  ])('reads %s as %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});

describe('firstName', () => {
  it.each([
    ['Ana Maria Silva', 'Ana'],
    ['Dr. João Silveira', 'João'],
    ['  Bruno   Lima  ', 'Bruno'],
    ['', ''],
  ])('reads %s as %s', (name, expected) => {
    expect(firstName(name)).toBe(expected);
  });
});

describe('hueOf', () => {
  it('keeps the same color for the same seed, within six tones', () => {
    expect(hueOf('abc')).toBe(hueOf('abc'));
    for (const seed of ['a', 'b', 'c', 'Dr. João', 'uuid-1']) expect(hueOf(seed)).toBeLessThan(6);
  });
});
