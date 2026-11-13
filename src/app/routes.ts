import type { ComponentType } from 'react';
import { redirect, type RouteObject } from 'react-router';
import { RootFallback, RootRoute } from '@components/layout/RootRoute';
import { areas, type Area } from '@constants/areas';
import { ForbiddenPage, NotFoundPage, RouteError, RouteErrorBoundary } from '@features/errors';

const lazyComponent = (load: () => Promise<ComponentType>) => async () => ({ Component: await load() });

const placeholder = lazyComponent(
  async () => (await import('@components/layout/PlaceholderPage')).PlaceholderPage,
);

const notFound: RouteObject = {
  path: '*',
  handle: { title: 'Página não encontrada' },
  Component: NotFoundPage,
};

const placeholderPages = [
  ['esqueci-senha', 'Esqueci a senha'],
  ['redefinir-senha', 'Redefinir senha'],
  ['perfis', 'Escolha seu perfil'],
] as const;

const authPage = (
  path: string,
  title: string,
  name: 'LoginPage' | 'RegisterPage' | 'TermsPage' | 'PrivacyPage',
  surface?: 'brand',
): RouteObject => ({
  path,
  handle: { title, ...(surface && { surface }) },
  ErrorBoundary: RouteError,
  lazy: lazyComponent(async () => (await import('@features/auth'))[name]),
});

const page = (path: string, title: string): RouteObject => ({
  ...(path === '' ? { index: true } : { path }),
  handle: { title },
  ErrorBoundary: RouteError,
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
    HydrateFallback: RootFallback,
    children: [
      {
        lazy: lazyComponent(async () => (await import('@components/layout/PublicLayout')).PublicLayout),
        children: [
          { index: true, loader: () => redirect('/login') },
          authPage('login', 'Entrar', 'LoginPage', 'brand'),
          authPage('cadastro', 'Criar conta', 'RegisterPage', 'brand'),
          authPage('termos', 'Termos de uso', 'TermsPage'),
          authPage('privacidade', 'Política de privacidade', 'PrivacyPage'),
          ...placeholderPages.map(([path, title]) => page(path, title)),
          { path: '403', handle: { title: 'Acesso negado' }, Component: ForbiddenPage },
          notFound,
        ],
      },
      ...Object.values(areas).map(areaRoute),
    ],
  },
];
