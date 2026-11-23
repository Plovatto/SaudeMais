import type { ReactElement } from 'react';
import { LuMousePointer2, LuPointer } from 'react-icons/lu';
import type { IconType } from 'react-icons';

export interface CursorColors {
  fill: string;
  outline: string;
}

type IconElement = ReactElement<{ children: ReactElement<{ d: string }>[] }>;

function pathsOf(icon: IconType): string[] {
  const { children } = (icon({}) as IconElement).props;
  if (!Array.isArray(children)) throw new Error('Unexpected icon shape for the cursor');
  return children.map((path) => path.props.d);
}

const arrowPaths = pathsOf(LuMousePointer2);
const handPaths = pathsOf(LuPointer);

const path = (d: string, fill: string, stroke: string, width: number) =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;

const image = (body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="-2 -2 28 28" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`,
  )}")`;

export function cursorProperties({
  fill,
  outline,
}: CursorColors): Record<'--cursor' | '--cursor-pointer', string> {
  const arrow = arrowPaths.map((d) => path(d, fill, outline, 1.5)).join('');
  const hand = [
    ...handPaths.map((d) => path(d, 'none', outline, 4.5)),
    ...handPaths.map((d) => path(d, 'none', fill, 2)),
  ].join('');
  return {
    '--cursor': `${image(arrow)} 7 7, auto`,
    '--cursor-pointer': `${image(hand)} 11 4, pointer`,
  };
}
