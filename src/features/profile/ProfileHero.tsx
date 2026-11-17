import { LuMail, LuPencil, LuPhone } from 'react-icons/lu';
import { Avatar, Button, StatusChip } from '@components/ui';
import { areas, type Role } from '@constants/areas';
import type { CurrentUser } from '@lib/auth/useSession';
import { ageText, phoneText } from './profile-text';

export interface ProfileHeroProps {
  user: CurrentUser;
  role: Role;
  onEdit: () => void;
}

export function ProfileHero({ user, role, onEdit }: ProfileHeroProps) {
  const age = role === 'patient' && user.birthDate ? ageText(user.birthDate) : null;
  return (
    <section
      aria-label="Resumo do perfil"
      className="rounded-card border-border bg-surface shadow-card overflow-hidden border"
    >
      <div
        aria-hidden
        className="h-[72px] bg-[radial-gradient(120%_140%_at_100%_0%,color-mix(in_oklab,var(--role-strong)_32%,transparent),transparent_60%),linear-gradient(120deg,var(--role-soft),color-mix(in_oklab,var(--role-strong)_18%,var(--surface)))] sm:h-[84px]"
      />
      <div className="-mt-8 flex flex-wrap items-end gap-x-3.5 gap-y-3 px-[18px] sm:-mt-[42px] sm:flex-nowrap sm:gap-[18px] sm:px-6">
        <Avatar
          name={user.fullName}
          seed={user.id}
          className="size-[72px] text-2xl shadow-[0_0_0_4px_var(--surface),0_8px_20px_-10px_rgb(16_42_41/0.4)] sm:size-[84px] sm:text-[28px]"
        />
        <div className="mt-9 flex min-w-0 flex-1 basis-[calc(100%-90px)] flex-col gap-1 pb-1 sm:mt-[42px] sm:basis-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h2 className="text-text text-[1.1875rem] leading-tight font-[650] tracking-[-0.02em] sm:text-[1.375rem]">
              {user.fullName}
            </h2>
            <StatusChip tone="info" dot={false}>
              {areas[role].label}
            </StatusChip>
          </div>
          {age && <p className="text-text-secondary text-[0.8125rem]">{age}</p>}
        </div>
        <Button
          icon={<LuPencil />}
          onClick={onEdit}
          className="mt-1.5 w-full max-sm:min-h-[50px] max-sm:text-[0.9375rem] sm:mt-[42px] sm:mb-1 sm:w-auto"
        >
          Editar perfil
        </Button>
      </div>
      <div className="border-border text-text-secondary mx-[18px] mt-4 flex flex-col gap-x-[22px] gap-y-2 border-t pt-3.5 pb-4 text-[0.84375rem] sm:mx-6 sm:mt-[18px] sm:flex-row sm:flex-wrap sm:pb-[18px]">
        <span className="inline-flex min-w-0 items-center gap-2">
          <LuMail aria-hidden className="text-text-muted shrink-0" />
          <span className="truncate">{user.email}</span>
        </span>
        <span className="inline-flex items-center gap-2 tabular-nums">
          <LuPhone aria-hidden className="text-text-muted shrink-0" />
          {phoneText(user.phone) ?? 'Telefone não informado'}
        </span>
      </div>
    </section>
  );
}
