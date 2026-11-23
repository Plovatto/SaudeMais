import { describe, expect, it } from 'vitest';
import { cursorProperties } from './cursor';

const decode = (value: string) =>
  decodeURIComponent(value.slice(value.indexOf(',') + 1, value.indexOf('")')));

describe('cursorProperties', () => {
  const properties = cursorProperties({ fill: '#0c7c7e', outline: '#ffffff' });

  it('falls back to the native cursors when the image cannot load', () => {
    expect(properties['--cursor']).toMatch(/, auto$/);
    expect(properties['--cursor-pointer']).toMatch(/, pointer$/);
  });

  it('paints the arrow with the role colour and the surface outline', () => {
    const arrow = decode(properties['--cursor']);
    expect(arrow).toContain('fill="#0c7c7e"');
    expect(arrow).toContain('stroke="#ffffff"');
  });

  it('draws the pointing hand from every path of the icon', () => {
    const hand = decode(properties['--cursor-pointer']);
    expect(hand.match(/<path /g)?.length).toBeGreaterThanOrEqual(10);
    expect(hand).toContain('stroke="#0c7c7e"');
  });
});
