const steps = [
  'motion-safe:animate-rise',
  'motion-safe:animate-rise motion-safe:[animation-delay:50ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:100ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:150ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:200ms]',
];

export const stagger = (index: number) => steps[index] ?? '';
