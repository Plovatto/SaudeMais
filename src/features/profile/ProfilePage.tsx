import { useState } from 'react';
import { LuArrowUpDown, LuLogOut } from 'react-icons/lu';
import { Link } from 'react-router';
import { PageHeader } from '@components/layout/PageHeader';
import { useAreaRole } from '@components/layout/route-handle';
import { ConfirmDialog, stagger } from '@components/ui';
import { areas } from '@constants/areas';
import { useCurrentUser } from '@lib/auth/useSession';
import { useSignOut } from '@lib/auth/useSignOut';
import { AppearanceSection } from './AppearanceSection';
import { EditProfileDrawer } from './EditProfileDrawer';
import { EmailPreferencesSection } from './EmailPreferencesSection';
import { PasswordDrawer } from './PasswordDrawer';
import { PersonalDataSection } from './PersonalDataSection';
import { ProfileHero } from './ProfileHero';
import { SecuritySection } from './SecuritySection';
import { SessionsSection } from './SessionsSection';

type Panel = 'edit' | 'password' | 'logout' | null;

export function ProfilePage() {
  const user = useCurrentUser();
  const role = useAreaRole();
  const signOut = useSignOut();
  const [panel, setPanel] = useState<Panel>(null);
  const [leaving, setLeaving] = useState(false);
  const close = () => setPanel(null);
  const withBirthDate = role === 'patient';
  const Area = areas[role];

  return (
    <>
      <PageHeader
        title="Meu perfil"
        subtitle="Seus dados, segurança e preferências."
        back
        backFallback={Area.base}
      />
      <div className="flex flex-col gap-4 lg:gap-5">
        {user.roles.length > 1 && (
          <Link
            to="/perfis"
            className="rounded-card border-border bg-surface shadow-field can-hover:border-border-strong flex items-center gap-3 border px-3.5 py-3 transition-colors duration-150"
          >
            <span
              aria-hidden
              className="bg-role-strong text-on-role rounded-field grid size-8 shrink-0 place-items-center"
            >
              <Area.icon />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-text-muted text-[0.6875rem] font-medium tracking-[0.02em]">
                Perfil atual
              </span>{' '}
              <b className="text-text text-[0.9375rem] font-[650]">{Area.label}</b>
            </span>{' '}
            <span className="text-role-text inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold">
              Trocar
              <LuArrowUpDown aria-hidden />
            </span>
          </Link>
        )}
        <div className={stagger(0)}>
          <ProfileHero user={user} role={role} onEdit={() => setPanel('edit')} />
        </div>
        <div className={`grid items-start gap-4 lg:grid-cols-2 lg:gap-5 ${stagger(1)}`}>
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            <PersonalDataSection user={user} withBirthDate={withBirthDate} onEdit={() => setPanel('edit')} />
            <SecuritySection
              passwordChangedAt={user.passwordChangedAt}
              onChangePassword={() => setPanel('password')}
              onLogout={() => setPanel('logout')}
            />
            <AppearanceSection />
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            <EmailPreferencesSection />
          </div>
        </div>
        <div className={stagger(2)}>
          <SessionsSection />
        </div>
      </div>
      <EditProfileDrawer
        open={panel === 'edit'}
        user={user}
        role={role}
        withBirthDate={withBirthDate}
        onClose={close}
      />
      <PasswordDrawer open={panel === 'password'} onClose={close} />
      <ConfirmDialog
        open={panel === 'logout'}
        onClose={close}
        title="Sair da conta?"
        description="Você vai precisar entrar de novo com seu e-mail e senha."
        icon={<LuLogOut />}
        centered
        tone="primary"
        cancelLabel="Continuar aqui"
        confirmLabel="Sair"
        loading={leaving}
        onConfirm={() => {
          setLeaving(true);
          void signOut();
        }}
      />
    </>
  );
}
