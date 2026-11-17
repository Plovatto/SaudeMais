import { useRef, useState } from 'react';
import { LuArrowUpDown, LuLogOut } from 'react-icons/lu';
import { Link } from 'react-router';
import { PageHeader } from '@components/layout/PageHeader';
import { useAreaRole } from '@components/layout/route-handle';
import { Button, Dialog, FormAlert } from '@components/ui';
import { areas } from '@constants/areas';
import { isDemoEmail } from '@constants/demo-accounts';
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

const STAGGER = [
  'motion-safe:animate-rise',
  'motion-safe:animate-rise motion-safe:[animation-delay:50ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:100ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:150ms]',
];

export function ProfilePage() {
  const user = useCurrentUser();
  const role = useAreaRole();
  const signOut = useSignOut();
  const [locked, setLocked] = useState(isDemoEmail(user.email));
  const [panel, setPanel] = useState<Panel>(null);
  const [leaving, setLeaving] = useState(false);
  const demoNote = useRef<HTMLDivElement>(null);
  const lock = () => setLocked(true);
  const close = () => setPanel(null);
  const withBirthDate = role === 'patient';
  const Area = areas[role];

  return (
    <>
      <PageHeader title="Meu perfil" subtitle="Seus dados, segurança e preferências." />
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
        {locked && (
          <div ref={demoNote} tabIndex={-1} className="outline-none">
            <FormAlert tone="warning" role="note">
              Esta é uma conta de demonstração, compartilhada com outros visitantes. Os dados e a senha não
              podem ser alterados.
            </FormAlert>
          </div>
        )}
        <div className={STAGGER[0]}>
          <ProfileHero user={user} role={role} locked={locked} onEdit={() => setPanel('edit')} />
        </div>
        <div className={`grid items-stretch gap-4 lg:grid-cols-2 lg:gap-5 ${STAGGER[1] ?? ''}`}>
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            <PersonalDataSection
              user={user}
              withBirthDate={withBirthDate}
              locked={locked}
              onEdit={() => setPanel('edit')}
            />
            <SecuritySection
              passwordChangedAt={user.passwordChangedAt}
              locked={locked}
              onChangePassword={() => setPanel('password')}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            <AppearanceSection />
            <EmailPreferencesSection locked={locked} onProtected={lock} />
          </div>
        </div>
        <div className={STAGGER[2]}>
          <SessionsSection locked={locked} onProtected={lock} />
        </div>
        <Button
          variant="danger"
          icon={<LuLogOut />}
          onClick={() => setPanel('logout')}
          className={`mx-auto mt-1 min-h-[50px] w-full sm:max-w-[360px] lg:min-h-12 ${STAGGER[3] ?? ''}`}
        >
          Sair da conta
        </Button>
      </div>
      <EditProfileDrawer
        open={panel === 'edit'}
        user={user}
        role={role}
        withBirthDate={withBirthDate}
        onClose={close}
        onProtected={lock}
        fallbackFocus={demoNote}
      />
      <PasswordDrawer
        open={panel === 'password'}
        onClose={close}
        onProtected={lock}
        fallbackFocus={demoNote}
      />
      <Dialog
        open={panel === 'logout'}
        onClose={close}
        title="Sair da conta?"
        description="Você vai precisar entrar de novo com seu e-mail e senha."
        icon={<LuLogOut />}
        centered
      >
        <div className="grid w-full grid-cols-2 gap-3">
          <Button variant="secondary" disabled={leaving} onClick={close}>
            Continuar aqui
          </Button>
          <Button
            loading={leaving}
            onClick={() => {
              setLeaving(true);
              void signOut();
            }}
          >
            Sair
          </Button>
        </div>
      </Dialog>
    </>
  );
}
