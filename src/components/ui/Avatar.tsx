import type { Role } from '@constants/areas';
import { cx } from '@lib/cx';
import { hueOf, initials } from '@lib/initials';
import { softTones } from './styles';

const hues = [
  'bg-[#dff3f1] text-[#0b6a64] dark:bg-[#17302f] dark:text-[#86c7c1]',
  'bg-[#e4edfb] text-[#2b5aa0] dark:bg-[#1a2639] dark:text-[#9fbbe0]',
  'bg-[#eee8fb] text-[#5a3fa3] dark:bg-[#252036] dark:text-[#b7a9dd]',
  'bg-[#fcefd9] text-[#8a5600] dark:bg-[#2e2718] dark:text-[#d8b878]',
  'bg-[#fbe6ec] text-[#a3304f] dark:bg-[#311f26] dark:text-[#d9a0b0]',
  'bg-[#e3f3e6] text-[#23703a] dark:bg-[#192c20] dark:text-[#93c9a2]',
];

const roleHues: Record<Role, number> = { patient: 0, doctor: 1, admin: 3 };

const sizes = {
  sm: 'size-7 text-[0.6875rem]',
  md: 'size-9 text-[0.8125rem]',
  lg: 'size-12 text-base',
  xl: 'size-16 text-[1.3125rem]',
};

export interface AvatarProps {
  name: string;
  seed?: string;
  role?: Role;
  size?: keyof typeof sizes;
  square?: boolean;
  muted?: boolean;
  className?: string;
}

export function Avatar({
  name,
  seed = name,
  role,
  size = 'md',
  square = false,
  muted = false,
  className,
}: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cx(
        'inline-grid shrink-0 place-items-center font-bold tracking-[0.01em]',
        square ? 'rounded-field' : 'rounded-full',
        muted ? softTones.neutral : hues[role ? roleHues[role] : hueOf(seed)],
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
