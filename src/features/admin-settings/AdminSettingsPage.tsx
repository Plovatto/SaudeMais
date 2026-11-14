import type { ComponentType } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { PageHeader } from '@components/layout/PageHeader';
import { TabPanel, Tabs } from '@components/ui';
import { ExamTypesSection } from './ExamTypesSection';
import { OffersSection } from './OffersSection';
import { PolicySection } from './PolicySection';
import { SpecialtiesSection } from './SpecialtiesSection';
import { UnitsSection } from './UnitsSection';

const SECTIONS = [
  { value: 'especialidades', label: 'Especialidades', Component: SpecialtiesSection },
  { value: 'unidades', label: 'Unidades', Component: UnitsSection },
  { value: 'exames', label: 'Exames', Component: ExamTypesSection },
  { value: 'ofertas', label: 'Exames por unidade', Component: OffersSection },
  { value: 'politica', label: 'Política', Component: PolicySection },
] as const satisfies readonly { value: string; label: string; Component: ComponentType }[];

type SectionValue = (typeof SECTIONS)[number]['value'];

const TABS_ID = 'admin-settings';
const BASE = '/admin/configuracoes';

export function AdminSettingsPage() {
  const navigate = useNavigate();
  const current = useParams()['*'] ?? '';
  const section = SECTIONS.find((item) => item.value === current);
  if (!section) return <Navigate to={`${BASE}/${SECTIONS[0].value}`} replace />;
  const { Component } = section;
  return (
    <>
      <PageHeader title="Configurações" />
      <div className="flex flex-col gap-6">
        <Tabs<SectionValue>
          id={TABS_ID}
          label="Seções das configurações"
          items={SECTIONS}
          value={section.value}
          onValueChange={(value) => void navigate(`${BASE}/${value}`)}
          className="flex-wrap"
        />
        <TabPanel tabsId={TABS_ID} value={section.value}>
          <Component />
        </TabPanel>
      </div>
    </>
  );
}
