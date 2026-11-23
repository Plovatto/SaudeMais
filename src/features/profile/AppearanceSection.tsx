import { LuCheck } from 'react-icons/lu';
import { SectionCard } from '@components/ui';
import { cx } from '@lib/cx';
import { setThemePreference, THEME_OPTIONS, type Theme, type ThemePreference } from '@lib/theme';
import { useThemePreference } from '@hooks/useTheme';

const mockColors = {
  light: { background: 'bg-surface-strong', line: 'bg-surface' },
  dark: { background: 'bg-canvas', line: 'bg-surface-muted' },
};

function Mock({ theme, className }: { theme: Theme; className?: string }) {
  return (
    <span
      data-theme={theme}
      className={cx(
        mockColors[theme].background,
        'border-border absolute inset-0 flex flex-col gap-[5px] rounded-[9px] border p-[9px]',
        className,
      )}
    >
      <i className="bg-role block h-[7px] w-[38%] rounded" />
      {[0, 1].map((line) => (
        <b key={line} className={cx(mockColors[theme].line, 'block h-[11px] rounded')} />
      ))}
    </span>
  );
}

function Preview({ value }: { value: ThemePreference }) {
  return (
    <span aria-hidden className="relative block h-[58px] sm:h-[68px]">
      <Mock theme={value === 'dark' ? 'dark' : 'light'} />
      {value === 'system' && (
        <Mock theme="dark" className="[clip-path:polygon(65%_0,100%_0,100%_100%,35%_100%)]" />
      )}
    </span>
  );
}

export function AppearanceSection() {
  const preference = useThemePreference();
  return (
    <SectionCard title="Aparência">
      <fieldset className="grid grid-cols-3 gap-2.5">
        <legend className="sr-only">Tema</legend>
        {THEME_OPTIONS.map((option) => {
          const checked = preference === option.value;
          return (
            <label
              key={option.value}
              className={cx(
                'bg-surface has-[:focus-visible]:outline-focus flex cursor-pointer flex-col gap-2.5 rounded-[14px] border p-2 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 sm:p-2.5',
                checked
                  ? 'border-role-strong shadow-[0_0_0_1px_var(--role-strong),0_6px_16px_-8px_var(--role-glow)]'
                  : 'border-border-strong shadow-field can-hover:border-border-field',
              )}
            >
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={checked}
                onChange={() => setThemePreference(option.value)}
                className="sr-only"
              />
              <Preview value={option.value} />
              <span className="text-text flex items-center justify-between text-[0.8125rem] font-semibold sm:text-[0.84375rem]">
                {option.label}
                {checked && (
                  <span
                    aria-hidden
                    className="bg-role-strong text-on-role grid size-[18px] place-items-center rounded-full [&_svg]:size-[11px]"
                  >
                    <LuCheck strokeWidth={3} />
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </fieldset>
    </SectionCard>
  );
}
