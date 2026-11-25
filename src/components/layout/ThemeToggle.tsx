import { LuMoon, LuSun } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { setThemePreference, type Theme } from '@lib/theme';
import { useTheme } from '@hooks/useTheme';

const base =
  'relative inline-flex size-11 shrink-0 items-center justify-center rounded-field text-xl transition-[background-color,color,transform] duration-200 pressable:scale-90 lg:size-10';

const tones = {
  default: 'text-text-secondary can-hover:bg-surface-strong can-hover:text-text',
  brand: 'text-white/80 can-hover:bg-white/10 can-hover:text-white',
  'brand-until-desktop':
    'text-white/80 can-hover:bg-white/10 can-hover:text-white lg:text-text-secondary lg:can-hover:bg-surface-strong lg:can-hover:text-text',
};

const layer =
  'absolute inset-0 size-full transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]';

const shown = 'rotate-0 scale-100 opacity-100 blur-0';

const hidden = (turn: string) => `${turn} scale-0 opacity-0 blur-[3px]`;

const REVEAL_MS = 800;

function applyWithReveal(next: Theme, origin: { x: number; y: number }): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof document.startViewTransition !== 'function') {
    setThemePreference(next);
    return;
  }
  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );
  const transition = document.startViewTransition(() => setThemePreference(next));
  void transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${origin.x}px ${origin.y}px)`,
          `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
        ],
      },
      {
        duration: REVEAL_MS,
        easing: 'cubic-bezier(0.65, 0, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    );
  });
}

export function ThemeToggle({ tone = 'default' }: { tone?: keyof typeof tones }) {
  const dark = useTheme() === 'dark';
  return (
    <button
      type="button"
      aria-label={dark ? 'Usar tema claro' : 'Usar tema escuro'}
      className={cx(base, tones[tone])}
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        applyWithReveal(dark ? 'light' : 'dark', {
          x: box.left + box.width / 2,
          y: box.top + box.height / 2,
        });
      }}
    >
      <span aria-hidden className="relative block size-[1em]">
        <LuSun className={cx(layer, dark ? shown : hidden('rotate-90'))} />
        <LuMoon
          className={cx(layer, '-inset-[0.0556em] size-[1.1112em]', dark ? hidden('-rotate-90') : shown)}
        />
      </span>
    </button>
  );
}
