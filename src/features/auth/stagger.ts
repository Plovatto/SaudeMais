import type { CSSProperties } from 'react';

export const stagger = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });
