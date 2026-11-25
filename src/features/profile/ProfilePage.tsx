import { useState } from 'react';
import { PageColumn } from '@components/layout/PageColumn';
import { PageHeader } from '@components/layout/PageHeader';
import { useAreaRole } from '@components/layout/route-handle';
import { useSignOutConfirm } from '@components/layout/useSignOutConfirm';
import { stagger, TabPanel, Tabs } from '@components/ui';
import { areas, TAB_PARAM } from '@constants/areas';
import { useSearchParam } from '@hooks/useSearchParam';
import { useCurrentUser } from '@lib/auth/useSession';
import { AppearanceSection } from './AppearanceSection';
import { EditProfileDrawer } from './EditProfileDrawer';
import { EmailPreferencesSection } from './EmailPreferencesSection';
import { PasswordDrawer } from './PasswordDrawer';
import { PersonalDataSection } from './PersonalDataSection';
import { ProfileHero } from './ProfileHero';
import { SecuritySection } from './SecuritySection';
import { SessionsSection } from './SessionsSection';

type Panel = 'edit' | 'password' | null;

const TABS_ID = 'profile';

const TABS = [
  { value: 'dados', label: 'Dados pessoais' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'preferencias', label: 'Preferências' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

const isTab = (value: string): value is TabValue => TABS.some((tab) => tab.value === value);

export function ProfilePage() {
  const user = useCurrentUser();
  const role = useAreaRole();
  const logout = useSignOutConfirm();
  const [panel, setPanel] = useState<Panel>(null);
  const close = () => setPanel(null);
  const withBirthDate = role === 'patient';
  const Area = areas[role];
  const [tabParam, setTab] = useSearchParam(TAB_PARAM, TABS[0].value);
  const tab = isTab(tabParam) ? tabParam : TABS[0].value;

  return (
    <>
      <PageColumn>
        <PageHeader
          title="Meu perfil"
          subtitle="Seus dados, segurança e preferências."
          back
          backFallback={Area.base}
        />
        <div className="flex flex-col gap-4 lg:gap-5">
          <div className={stagger(0)}>
            <ProfileHero user={user} role={role} onEdit={() => setPanel('edit')} />
          </div>
          <div className={stagger(1)}>
            <Tabs<TabValue>
              id={TABS_ID}
              label="Seções do perfil"
              variant="line"
              items={[...TABS]}
              value={tab}
              onValueChange={(next) => setTab(next, { replace: true })}
            />
            <TabPanel
              tabsId={TABS_ID}
              value={tab}
              className="mt-4 flex flex-col gap-4 focus-visible:outline-none lg:mt-5 lg:gap-5"
            >
              {tab === 'dados' && (
                <PersonalDataSection
                  user={user}
                  withBirthDate={withBirthDate}
                  onEdit={() => setPanel('edit')}
                />
              )}
              {tab === 'seguranca' && (
                <>
                  <SecuritySection
                    passwordChangedAt={user.passwordChangedAt}
                    onChangePassword={() => setPanel('password')}
                    onLogout={logout.ask}
                  />
                  <SessionsSection />
                </>
              )}
              {tab === 'preferencias' && (
                <>
                  <EmailPreferencesSection role={role} />
                  <AppearanceSection />
                </>
              )}
            </TabPanel>
          </div>
        </div>
      </PageColumn>
      <EditProfileDrawer
        open={panel === 'edit'}
        user={user}
        role={role}
        withBirthDate={withBirthDate}
        onClose={close}
      />
      <PasswordDrawer open={panel === 'password'} onClose={close} />
      {logout.dialog}
    </>
  );
}
