import { PageHeader } from '@components/layout/PageHeader';
import { Card } from '@components/ui';
import { formatLongDate } from '@lib/date';
import { privacyPolicy, termsOfUse, type LegalDocument } from './legal-content';

function LegalPage({ legal }: { legal: LegalDocument }) {
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
      </Card>
    </>
  );
}

export function TermsPage() {
  return <LegalPage legal={termsOfUse} />;
}

export function PrivacyPage() {
  return <LegalPage legal={privacyPolicy} />;
}
