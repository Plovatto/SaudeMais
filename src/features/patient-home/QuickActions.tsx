import { LuArrowRight, LuFlaskConical, LuStethoscope } from 'react-icons/lu';
import { Link } from 'react-router';
import { areas } from '@constants/areas';
import { cx } from '@lib/cx';

const PATIENT = areas.patient.base;

const ACTIONS = [
  {
    to: `${PATIENT}/consultas/nova`,
    title: 'Agendar consulta',
    hint: 'Escolha o médico e o horário',
    icon: LuStethoscope,
    primary: true,
  },
  {
    to: `${PATIENT}/exames/novo`,
    title: 'Agendar exame',
    hint: 'Sangue, urina e imagem',
    icon: LuFlaskConical,
  },
];

export function QuickActions() {
  return (
    <nav aria-label="Agendar" className="grid grid-cols-2 gap-2.5 sm:gap-4">
      {ACTIONS.map(({ to, title, hint, icon: Icon, primary }) => (
        <Link
          key={to}
          to={to}
          className={cx(
            'group can-hover:-translate-y-px flex flex-col items-start gap-3 rounded-[18px] border p-4 transition-[translate,box-shadow,border-color] duration-150 sm:flex-row sm:items-center sm:gap-4 sm:px-[22px] sm:py-5',
            primary
              ? 'border-role-strong bg-role-strong text-on-role shadow-[0_14px_30px_-16px_var(--role-strong)]'
              : 'border-border bg-surface text-text shadow-card can-hover:border-role-soft-strong can-hover:shadow-raised',
          )}
        >
          <span
            className={cx(
              'sm:rounded-card grid size-11 shrink-0 place-items-center rounded-[13px] sm:size-[52px]',
              primary ? 'text-on-role bg-white/16' : 'bg-role-soft text-role-text',
            )}
          >
            <Icon aria-hidden className="size-[22px]" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[0.96875rem] font-[650] tracking-[-0.01em] sm:text-[1.0625rem]">
              {title}
            </span>
            <span
              className={cx('text-xs sm:text-[0.8125rem]', primary ? 'opacity-85' : 'text-text-secondary')}
            >
              {hint}
            </span>
          </span>
          <LuArrowRight
            aria-hidden
            className={cx(
              'size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-[3px] max-sm:hidden',
              primary ? 'opacity-85' : 'text-text-muted',
            )}
          />
        </Link>
      ))}
    </nav>
  );
}
