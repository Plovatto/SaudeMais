const steps = [
  'motion-safe:animate-rise',
  'motion-safe:animate-rise motion-safe:[animation-delay:40ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:80ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:120ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:160ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:200ms]',
];

export const stagger = (index: number) => steps[Math.min(Math.max(index, 0), steps.length - 1)] ?? '';
