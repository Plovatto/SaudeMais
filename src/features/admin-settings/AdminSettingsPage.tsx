import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, type ReactNode } from 'react';
import { LuCheck, LuSlidersHorizontal } from 'react-icons/lu';
import { Navigate, useNavigate, useParams } from 'react-router';
import { PageColumn } from '@components/layout/PageColumn';
import { PageHeader } from '@components/layout/PageHeader';
import { Button, CtaBar, ctaButton, stagger, TabPanel, Tabs } from '@components/ui';
import { DESKTOP_QUERY, useMediaQuery } from '@hooks/useMediaQuery';
import { cx } from '@lib/cx';
import { queryKeys } from '@lib/query-keys';
import { ExamTypesSection } from './ExamTypesSection';
import { IntegrationsSection } from './IntegrationsSection';
import { OffersSection } from './OffersSection';
import { PolicySection } from './PolicySection';
import { POLICY_FORM_ID, usePolicySettings } from './usePolicySettings';
import { SpecialtiesSection } from './SpecialtiesSection';
import { UnitsSection } from './UnitsSection';

const BASE = '/admin/configuracoes';
const TABS_ID = 'admin-settings';

const TABS = [
  { value: 'agendamento', label: 'Agendamento' },
  { value: 'unidades', label: 'Unidades' },
  { value: 'catalogo', label: 'Catálogo' },
  { value: 'integracoes', label: 'Integrações' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

const TAB_OF: Record<string, TabValue> = {
  '': 'agendamento',
  agendamento: 'agendamento',
  politica: 'agendamento',
  unidades: 'unidades',
  ofertas: 'unidades',
  catalogo: 'catalogo',
  especialidades: 'catalogo',
  exames: 'catalogo',
  integracoes: 'integracoes',
};

export function AdminSettingsPage() {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const policy = usePolicySettings();
  const section = useParams()['*'] ?? '';
  const tab = TAB_OF[section];
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const loading = useIsFetching({ queryKey: queryKeys.catalog.all });
  const scrollPending = useRef(false);

  useEffect(() => {
    const card = section === '' ? null : document.getElementById(section);
    if (!card) return;
    card.focus({ preventScroll: true });
    card.scrollIntoView({ block: 'start' });
    scrollPending.current = true;
    const keepPosition = () => {
      scrollPending.current = false;
    };
    const events = ['wheel', 'touchmove', 'keydown'] as const;
    events.forEach((name) => window.addEventListener(name, keepPosition, { once: true, passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, keepPosition));
  }, [section]);

  useEffect(() => {
    if (!scrollPending.current || queryClient.isFetching({ queryKey: queryKeys.catalog.all }) > 0) return;
    scrollPending.current = false;
    document.getElementById(section)?.scrollIntoView({ block: 'start' });
  }, [loading, section, queryClient]);

  if (!tab) return <Navigate to={BASE} replace />;

  const save = (label: string, className?: string) => (
    <Button
      type="submit"
      form={POLICY_FORM_ID}
      icon={<LuCheck />}
      loading={policy.submitting}
      loadingLabel="Salvando"
      className={className}
    >
      {label}
    </Button>
  );

  const panel = (value: TabValue, children: ReactNode) => (
    <TabPanel
      tabsId={TABS_ID}
      value={value}
      className={cx('flex flex-col gap-4 focus-visible:outline-none lg:gap-5', tab !== value && 'hidden')}
    >
      {children}
    </TabPanel>
  );

  return (
    <>
      <PageColumn>
        <PageHeader
          title="Configurações"
          subtitle="Regras que valem para toda a clínica."
          action={desktop && policy.dirty && save('Salvar configurações')}
        />
        <div className={cx('flex flex-col gap-4 lg:gap-5', stagger(0))}>
          <Tabs<TabValue>
            id={TABS_ID}
            label="Seções das configurações"
            variant="line"
            items={[...TABS]}
            value={tab}
            onValueChange={(next) => void navigate(next === 'agendamento' ? BASE : `${BASE}/${next}`)}
          />
          {panel('agendamento', <PolicySection policy={policy} />)}
          {panel(
            'unidades',
            <>
              <UnitsSection />
              <OffersSection />
            </>,
          )}
          {panel(
            'catalogo',
            <>
              <SpecialtiesSection />
              <ExamTypesSection />
            </>,
          )}
          {panel('integracoes', <IntegrationsSection />)}
        </div>
      </PageColumn>
      {!desktop && policy.dirty && (
        <CtaBar aboveNav icon={<LuSlidersHorizontal />} title="Configurações" sub="Valem para toda a clínica">
          {save('Salvar', ctaButton)}
        </CtaBar>
      )}
    </>
  );
}
