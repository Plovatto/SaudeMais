import { cx } from '@lib/cx';

export const disabledState = 'disabled:cursor-not-allowed disabled:opacity-50';

export const controlInput =
  'min-w-0 flex-1 bg-transparent py-3 text-base outline-none focus-visible:outline-none disabled:cursor-not-allowed';

export function controlBox(invalid: boolean): string {
  return cx(
    'flex min-h-12 items-center gap-2.5 rounded-field border bg-surface-muted px-3.5 text-text transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60',
    invalid ? 'border-danger' : 'border-border-field hover:border-text-secondary',
  );
}

export function floatingPanel(align: 'start' | 'end'): string {
  return cx(
    'absolute top-full z-40 rounded-tile border border-border bg-surface text-text shadow-card',
    align === 'end' ? 'end-0' : 'start-0',
  );
}
