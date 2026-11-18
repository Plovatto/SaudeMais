export const MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

export function motionAllowed(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(MOTION_QUERY).matches;
}
