import { describe, expect, it } from 'vitest';
import { groupBy, groupConsecutive } from './group';

describe('groupConsecutive', () => {
  it('starts a new group whenever the key changes', () => {
    expect(groupConsecutive(['a1', 'a2', 'b1', 'a3'], (item) => item[0] ?? '')).toEqual([
      { key: 'a', items: ['a1', 'a2'] },
      { key: 'b', items: ['b1'] },
      { key: 'a', items: ['a3'] },
    ]);
  });

  it('returns no groups for no items', () => {
    expect(groupConsecutive([], String)).toEqual([]);
  });
});

describe('groupBy', () => {
  it('collects every item under its key in first-seen order', () => {
    const groups = groupBy(['b1', 'a1', 'b2', 'a2', 'c1'], (item) => item.charAt(0));
    expect([...groups]).toEqual([
      ['b', ['b1', 'b2']],
      ['a', ['a1', 'a2']],
      ['c', ['c1']],
    ]);
  });
});
