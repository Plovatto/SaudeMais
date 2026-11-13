import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import { RootRoute } from '@components/layout/RootRoute';
import { areas, type Area } from '@constants/areas';
import { ForbiddenPage, NotFoundPage, RouteErrorBoundary } from '@features/errors';

const lazyComponent = (load: () => Promise<ComponentType>) => async () => ({ Component: await load() });

const placeholder = lazyComponent(
  async () => (await import('@components/layout/PlaceholderPage')).PlaceholderPage,
);

const notFound: RouteObject = {
  path: '*',
  handle: { title: 'Página não encontrada' },
  Component: NotFoundPage,
};

const publicPages = [
  ['', 'Saúde+'],
  ['login', 'Entrar'],
  ['cadastro', 'Criar conta'],
  ['esqueci-senha', 'Esqueci a senha'],
  ['redefinir-senha', 'Redefinir senha'],
  ['termos', 'Termos de uso'],
  ['privacidade', 'Política de privacidade'],
  ['perfis', 'Escolha seu perfil'],
] as const;

const page = (path: string, title: string): RouteObject => ({
  ...(path === '' ? { index: true } : { path }),
  handle: { title },
  lazy: placeholder,
});

const areaRoute = (area: Area): RouteObject => ({
  path: area.base,
  handle: { role: area.role },
  lazy: lazyComponent(async () => (await import('@components/layout/RoleLayout')).RoleLayout),
  children: [...area.pages.map(({ path, title }) => page(path, title)), notFound],
});

export const routes: RouteObject[] = [
  {
    Component: RootRoute,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        lazy: lazyComponent(async () => (await import('@components/layout/PublicLayout')).PublicLayout),
        children: [
          ...publicPages.map(([path, title]) => page(path, title)),
          { path: '403', handle: { title: 'Acesso negado' }, Component: ForbiddenPage },
          notFound,
        ],
      },
      ...Object.values(areas).map(areaRoute),
    ],
  },
];
