import { PageHeader } from '@components/layout/PageHeader';
import { Card } from '@components/ui';
import { privacyPolicy, termsOfUse, type LegalDocument } from './legal-content';

const versionDate = (version: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(version));

function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <>
      <PageHeader title={document.title} back backFallback="/cadastro" />
      <Card className="flex flex-col gap-5">
        <p className="text-text-secondary text-sm">Versão de {versionDate(document.version)}</p>
        {document.sections.map((section) => (
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
  return <LegalPage document={termsOfUse} />;
}

export function PrivacyPage() {
  return <LegalPage document={privacyPolicy} />;
}
