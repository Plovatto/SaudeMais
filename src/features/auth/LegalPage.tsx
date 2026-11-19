import type { ReactNode } from 'react';
import { PageHeader } from '@components/layout/PageHeader';
import { Button, Card } from '@components/ui';
import { analyticsEnabled } from '@lib/analytics';
import { reopenConsent } from '@lib/consent';
import { formatLongDate } from '@lib/date';
import { analyticsSection, privacyPolicy, termsOfUse, type LegalDocument } from './legal-content';

function LegalPage({ legal, children }: { legal: LegalDocument; children?: ReactNode }) {
  return (
    <>
      <PageHeader title={legal.title} back backFallback="/cadastro" />
      <Card className="flex flex-col gap-5">
        <p className="text-text-secondary text-sm">Versão de {formatLongDate(legal.version)}</p>
        {legal.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="text-text text-base font-semibold">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-text-secondary text-sm leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        {children}
      </Card>
    </>
  );
}

export function TermsPage() {
  return <LegalPage legal={termsOfUse} />;
}

export function PrivacyPage() {
  if (!analyticsEnabled) return <LegalPage legal={privacyPolicy} />;
  return (
    <LegalPage legal={{ ...privacyPolicy, sections: [...privacyPolicy.sections, analyticsSection] }}>
      <div>
        <Button variant="secondary" onClick={reopenConsent}>
          Alterar minha escolha sobre a medição de uso
        </Button>
      </div>
    </LegalPage>
  );
}
