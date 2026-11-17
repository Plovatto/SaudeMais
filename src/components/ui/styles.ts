import { cx } from '@lib/cx';

export const disabledState = 'unavailable:cursor-not-allowed unavailable:opacity-45 unavailable:shadow-none';

export const buttonVariants = {
  primary:
    'border border-transparent bg-role-strong text-on-role shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(16_42_41/0.12),0_4px_12px_-4px_var(--role-soft-strong)] can-hover:bg-role-strong-hover',
  secondary:
    'border border-border-strong bg-surface text-text shadow-button can-hover:border-border-field can-hover:bg-surface-muted',
  ghost: 'border border-transparent text-role-text can-hover:bg-role-soft',
  soft: 'border border-transparent bg-role-soft text-role-text can-hover:bg-role-soft-strong',
  danger:
    'border border-transparent bg-danger-strong text-on-danger shadow-button can-hover:bg-danger-strong-hover',
  'danger-outline':
    'border border-border-strong bg-surface text-danger-text shadow-button can-hover:border-danger can-hover:bg-danger-soft',
  'danger-soft-outline':
    'border border-[color-mix(in_oklab,var(--danger)_35%,var(--border-strong))] bg-surface text-danger-text can-hover:bg-danger-soft',
  'success-outline':
    'border border-success bg-success-soft text-success-text can-hover:border-success-strong',
};

export type ButtonVariant = keyof typeof buttonVariants;

export const buttonSizes = {
  sm: 'min-h-9 rounded-field px-3 text-[0.8125rem] font-semibold lg:min-h-8',
  md: 'min-h-11 rounded-field px-4 text-sm font-semibold lg:min-h-10',
  lg: 'min-h-[50px] rounded-tile px-6 text-[0.9375rem] font-semibold lg:min-h-12',
};

export interface ButtonStyle {
  variant?: ButtonVariant | undefined;
  size?: keyof typeof buttonSizes | undefined;
  fullWidth?: boolean | undefined;
}

export function buttonClass({ variant = 'primary', size = 'md', fullWidth = false }: ButtonStyle): string {
  return cx(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap transition-[background-color,border-color,box-shadow,translate] duration-150 select-none pressable:translate-y-px',
    disabledState,
    buttonVariants[variant],
    buttonSizes[size],
    fullWidth && 'w-full',
  );
}

export const squareButton = cx(
  'relative inline-flex size-11 shrink-0 lg:size-10 items-center justify-center rounded-field transition-colors duration-150',
  disabledState,
);

export const controlInput =
  'min-w-0 flex-1 bg-transparent py-2.5 text-[0.9375rem] outline-none focus-visible:outline-none disabled:cursor-not-allowed lg:text-sm';

export function controlBox(invalid: boolean): string {
  return cx(
    'flex min-h-[50px] items-center gap-2.5 rounded-tile border bg-surface px-3 text-text shadow-field transition-[border-color,box-shadow] duration-150 lg:min-h-[42px] has-[:is(input,select,textarea):focus-visible]:border-role-strong has-[:is(input,select,textarea):focus-visible]:outline-2 has-[:is(input,select,textarea):focus-visible]:outline-offset-2 has-[:is(input,select,textarea):focus-visible]:outline-focus has-[:is(input,select,textarea):focus-visible]:shadow-[0_0_0_3px_var(--role-soft-strong)] has-[:is(input,select,textarea):disabled]:cursor-not-allowed has-[:is(input,select,textarea):disabled]:bg-surface-muted has-[:is(input,select,textarea):disabled]:shadow-none has-[:is(input,select,textarea):disabled]:opacity-60',
    invalid
      ? 'border-danger shadow-[0_0_0_3px_var(--danger-soft)]'
      : 'border-border-strong can-hover:border-border-field',
  );
}

export function floatingPanel(align: 'start' | 'end'): string {
  return cx(
    'absolute top-full z-40 origin-top rounded-card border border-border bg-surface text-text shadow-overlay motion-safe:animate-drop',
    align === 'end' ? 'end-0 origin-top-right' : 'start-0 origin-top-left',
  );
}

export const pill = {
  base: 'min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 lg:min-h-9',
  selected: 'border-role-strong bg-role-strong text-on-role',
  idle: 'border-border-strong bg-surface text-text-secondary can-hover:border-role-strong can-hover:text-role-text',
};

export const tile =
  'inline-grid size-9 shrink-0 place-items-center rounded-field bg-role-soft text-role-text [&_svg]:size-[18px]';

export const overline = 'text-[0.6875rem] font-semibold tracking-[0.06em] text-text-muted uppercase';
