import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { LuCheck, LuSlidersHorizontal } from 'react-icons/lu';
import { Navigate, useParams } from 'react-router';
import { PageHeader } from '@components/layout/PageHeader';
import { Button, CtaBar, ctaButton, stagger } from '@components/ui';
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

const SECTIONS = ['unidades', 'ofertas', 'integracoes', 'politica', 'especialidades', 'exames'];

const column = 'flex min-w-0 flex-col gap-4 lg:gap-5';

export function AdminSettingsPage() {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const policy = usePolicySettings();
  const section = useParams()['*'] ?? '';
  const known = section === '' || SECTIONS.includes(section);

  const queryClient = useQueryClient();
  const loading = useIsFetching({ queryKey: queryKeys.catalog.all });
  const scrollPending = useRef(false);

  useEffect(() => {
    const card = section === '' ? null : document.getElementById(section);
    if (!card) return;
    card.focus({ preventScroll: true });
    card.scrollIntoView({ block: 'start' });
    scrollPending.current = true;
  }, [section]);

  useEffect(() => {
    if (!scrollPending.current || queryClient.isFetching({ queryKey: queryKeys.catalog.all }) > 0) return;
    scrollPending.current = false;
    document.getElementById(section)?.scrollIntoView({ block: 'start' });
  }, [loading, section, queryClient]);

  if (!known) return <Navigate to="/admin/configuracoes" replace />;

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

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Regras que valem para toda a clínica."
        action={desktop && policy.dirty && save('Salvar configurações')}
      />
      <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-5">
        <div className={cx(column, stagger(0))}>
          <UnitsSection />
          <OffersSection />
          <IntegrationsSection />
        </div>
        <div className={cx(column, stagger(1))}>
          <PolicySection policy={policy} />
          <SpecialtiesSection />
          <ExamTypesSection />
        </div>
      </div>
      {!desktop && policy.dirty && (
        <CtaBar aboveNav icon={<LuSlidersHorizontal />} title="Configurações" sub="Valem para toda a clínica">
          {save('Salvar', ctaButton)}
        </CtaBar>
      )}
    </>
  );
}
