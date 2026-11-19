export const SITE_URL = 'https://saudemais.plovatto.dev';

export const SITE_NAME = 'Saúde+';

export const SITE_DESCRIPTION =
  'Agende consultas e exames, acompanhe seus agendamentos e receba os resultados em um só lugar. Crie sua conta no Saúde+.';

export const ROBOTS_INDEXABLE = 'index, follow, max-image-preview:large, max-snippet:-1';

export const ROBOTS_BLOCKED = 'noindex, nofollow';

export interface PublicPage {
  path: string;
  title: string;
  description: string;
}

export const PUBLIC_PAGES: readonly PublicPage[] = [
  { path: '/login', title: SITE_NAME, description: SITE_DESCRIPTION },
  {
    path: '/cadastro',
    title: 'Criar conta · Saúde+',
    description:
      'Crie sua conta no Saúde+ para agendar consultas e exames e acompanhar seus agendamentos e resultados.',
  },
  {
    path: '/termos',
    title: 'Termos de uso · Saúde+',
    description: 'Leia os termos de uso do Saúde+, o serviço para agendar consultas e exames.',
  },
  {
    path: '/privacidade',
    title: 'Política de privacidade · Saúde+',
    description: 'Saiba quais dados o Saúde+ guarda, como usa e como você exerce seus direitos pela LGPD.',
  },
];

export const pageUrl = (path: string) => `${SITE_URL}${path}`;
