import { cx } from '@lib/cx';
import { hueOf, initials } from '@lib/initials';

const hues = [
  'bg-[#dff3f1] text-[#0b6a64] dark:bg-[#14393a] dark:text-[#6fd8d0]',
  'bg-[#e4edfb] text-[#2b5aa0] dark:bg-[#182c4a] dark:text-[#93bbf5]',
  'bg-[#eee8fb] text-[#5a3fa3] dark:bg-[#2a2147] dark:text-[#bba7f2]',
  'bg-[#fcefd9] text-[#8a5600] dark:bg-[#3a2e14] dark:text-[#f0c26b]',
  'bg-[#fbe6ec] text-[#a3304f] dark:bg-[#3e1f2a] dark:text-[#f29ab3]',
  'bg-[#e3f3e6] text-[#23703a] dark:bg-[#16341f] dark:text-[#7fd598]',
];

const sizes = {
  sm: 'size-7 text-[0.6875rem]',
  md: 'size-9 text-[0.8125rem]',
  lg: 'size-12 text-base',
  xl: 'size-16 text-[1.3125rem]',
};

export interface AvatarProps {
  name: string;
  seed?: string;
  size?: keyof typeof sizes;
  square?: boolean;
  className?: string;
}

export function Avatar({ name, seed = name, size = 'md', square = false, className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cx(
        'inline-grid shrink-0 place-items-center font-[650] tracking-[0.01em]',
        square ? 'rounded-field' : 'rounded-full',
        hues[hueOf(seed)],
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
