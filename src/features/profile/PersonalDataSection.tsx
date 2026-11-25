import type { ReactNode } from 'react';
import { LuLock } from 'react-icons/lu';
import { Button, SectionCard } from '@components/ui';
import { ghostEnd } from '@components/ui/styles';
import type { CurrentUser } from '@lib/auth/useSession';
import { birthDateText, phoneText } from './profile-text';

const missing = <span className="text-text-muted font-normal">Não informado</span>;

function Row({ label, value, extra }: { label: string; value: ReactNode; extra?: ReactNode }) {
  return (
    <div className="grid gap-0.5 px-4 py-[13px] sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center sm:gap-3 sm:px-5 sm:py-[15px]">
      <dt className="text-text-muted text-xs sm:text-[0.8125rem]">{label}</dt>
      <dd className="flex min-w-0 items-center gap-3">
        <span className="text-text min-w-0 flex-1 text-sm font-semibold [overflow-wrap:anywhere]">
          {value}
        </span>
        {extra}
      </dd>
    </div>
  );
}

export interface PersonalDataSectionProps {
  user: CurrentUser;
  withBirthDate: boolean;
  onEdit: () => void;
}

export function PersonalDataSection({ user, withBirthDate, onEdit }: PersonalDataSectionProps) {
  return (
    <SectionCard
      title="Dados pessoais"
      flush
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          aria-label="Editar dados pessoais"
          className={ghostEnd}
        >
          Editar
        </Button>
      }
    >
      <dl className="divide-border flex flex-col divide-y">
        <Row label="Nome completo" value={user.fullName} />
        <Row
          label="E-mail"
          value={user.email}
          extra={
            <span className="text-text-muted inline-flex items-center gap-1.5 text-xs">
              <LuLock aria-hidden />
              Fixo
              <span className="sr-only">: usado para entrar, não pode ser alterado.</span>
            </span>
          }
        />
        <Row
          label="Telefone"
          value={<span className="tabular-nums">{phoneText(user.phone) ?? missing}</span>}
        />
        {withBirthDate && (
          <Row
            label="Nascimento"
            value={
              <span className="tabular-nums">{user.birthDate ? birthDateText(user.birthDate) : missing}</span>
            }
          />
        )}
      </dl>
    </SectionCard>
  );
}
