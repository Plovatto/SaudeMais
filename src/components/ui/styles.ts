import { cx } from '@lib/cx';

export const disabledState = 'unavailable:cursor-not-allowed unavailable:opacity-50';

export const buttonVariants = {
  primary: 'bg-role-strong text-on-role shadow-button can-hover:bg-role-strong/90',
  secondary: 'border border-role-strong bg-surface text-role-text can-hover:bg-role-soft',
  ghost: 'text-role-text can-hover:bg-role-soft',
  danger: 'bg-danger-strong text-on-danger shadow-button can-hover:bg-danger-strong/90',
};

export type ButtonVariant = keyof typeof buttonVariants;

export const buttonSizes = {
  md: 'min-h-11 px-4 text-[0.9375rem] font-semibold',
  lg: 'min-h-[50px] px-6 text-lg font-bold',
};

export interface ButtonStyle {
  variant?: ButtonVariant | undefined;
  size?: keyof typeof buttonSizes | undefined;
  fullWidth?: boolean | undefined;
}

export function buttonClass({ variant = 'primary', size = 'md', fullWidth = false }: ButtonStyle): string {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-field transition-[background-color,translate] select-none pressable:translate-y-px',
    disabledState,
    buttonVariants[variant],
    buttonSizes[size],
    fullWidth && 'w-full',
  );
}

export const squareButton = cx(
  'inline-flex size-11 shrink-0 items-center justify-center rounded-field transition-colors',
  disabledState,
);

export const controlInput =
  'min-w-0 flex-1 bg-transparent py-3 text-base outline-none focus-visible:outline-none disabled:cursor-not-allowed';

export function controlBox(invalid: boolean): string {
  return cx(
    'flex min-h-12 items-center gap-2.5 rounded-field border bg-surface-muted px-3.5 text-text transition-colors has-[:is(input,select,textarea):focus-visible]:outline-2 has-[:is(input,select,textarea):focus-visible]:outline-offset-2 has-[:is(input,select,textarea):focus-visible]:outline-focus has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60',
    invalid ? 'border-danger' : 'border-border-field can-hover:border-text-secondary',
  );
}

export function floatingPanel(align: 'start' | 'end'): string {
  return cx(
    'absolute top-full z-40 rounded-tile border border-border bg-surface text-text shadow-card',
    align === 'end' ? 'end-0' : 'start-0',
  );
}
