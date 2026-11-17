import { LuCheck } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { hasLettersAndNumbers } from '@lib/validation/account-fields';

const levels = [
  { label: 'Escolha uma senha forte', bar: '' },
  { label: 'Senha fraca', bar: 'bg-danger' },
  { label: 'Senha média', bar: 'bg-warning' },
  { label: 'Senha forte', bar: 'bg-success' },
];

function scoreOf(password: string): number {
  if (!password) return 0;
  const points = [
    password.length >= 8,
    hasLettersAndNumbers(password),
    password.length >= 12 || /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  return Math.max(1, points);
}

export function PasswordStrength({ password, current }: { password: string; current: string }) {
  const score = scoreOf(password);
  const level = levels[score] ?? levels[0];
  const rules = [
    { label: 'Pelo menos 8 caracteres', ok: password.length >= 8 },
    { label: 'Letras e números', ok: hasLettersAndNumbers(password) },
    { label: 'Diferente da senha atual', ok: password !== '' && password !== current },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div aria-hidden className="flex flex-1 gap-1">
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={cx(
                'bg-surface-strong h-[5px] flex-1 rounded-full transition-colors duration-200',
                score >= step && level?.bar,
              )}
            />
          ))}
        </div>
        <span className="text-text-muted min-w-24 text-end text-xs lg:min-w-28">{level?.label}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {rules.map((rule) => (
          <li
            key={rule.label}
            className={cx(
              'flex items-center gap-2.5 text-[0.8125rem]',
              rule.ok ? 'text-text' : 'text-text-muted',
            )}
          >
            <span
              aria-hidden
              className={cx(
                'grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-150 [&_svg]:size-2.5',
                rule.ok ? 'border-success bg-success text-white' : 'border-border-field text-transparent',
              )}
            >
              <LuCheck strokeWidth={3} />
            </span>
            {rule.label}
            <span className="sr-only">{rule.ok ? ', atendido' : ', pendente'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
