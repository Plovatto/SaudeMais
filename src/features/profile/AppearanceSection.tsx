import { LuCheck } from 'react-icons/lu';
import { SectionCard } from '@components/ui';
import { cx } from '@lib/cx';
import { setThemePreference, type ThemePreference } from '@lib/theme';
import { useThemePreference } from '@lib/useTheme';

const options: { value: ThemePreference; label: string; mock: string; bar: string; line: string }[] = [
  { value: 'light', label: 'Claro', mock: 'bg-[#edf3f3]', bar: 'bg-[#0c7c7e]', line: 'bg-white' },
  {
    value: 'dark',
    label: 'Escuro',
    mock: 'border-[#223132] bg-[#0b1213]',
    bar: 'bg-[#22bfc2]',
    line: 'bg-[#162122]',
  },
  {
    value: 'system',
    label: 'Sistema',
    mock: 'bg-[linear-gradient(115deg,#edf3f3_50%,#0b1213_50%)]',
    bar: 'bg-[linear-gradient(90deg,#0c7c7e_50%,#22bfc2_50%)]',
    line: 'bg-[linear-gradient(90deg,#fff_50%,#162122_50%)]',
  },
];

export function AppearanceSection() {
  const preference = useThemePreference();
  return (
    <SectionCard title="Aparência">
      <fieldset className="grid grid-cols-3 gap-2.5">
        <legend className="sr-only">Tema</legend>
        {options.map((option) => {
          const checked = preference === option.value;
          return (
            <label
              key={option.value}
              className={cx(
                'bg-surface has-[:focus-visible]:outline-focus flex cursor-pointer flex-col gap-2.5 rounded-[14px] border p-2 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 sm:p-2.5',
                checked
                  ? 'border-role-strong shadow-[0_0_0_1px_var(--role-strong),0_6px_16px_-8px_var(--role-strong)]'
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
              <span
                aria-hidden
                className={cx(
                  'border-border flex h-[58px] flex-col gap-[5px] rounded-[9px] border p-[9px] sm:h-[68px]',
                  option.mock,
                )}
              >
                <i className={cx('block h-[7px] w-[38%] rounded', option.bar)} />
                <b className={cx('block h-[11px] rounded', option.line)} />
                <b className={cx('block h-[11px] rounded', option.line)} />
              </span>
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
