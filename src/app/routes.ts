import type { ComponentType } from 'react';
import { redirect, type RouteObject } from 'react-router';
import { RootFallback, RootRoute } from '@components/layout/RootRoute';
import { areas, type Area } from '@constants/areas';
import { ForbiddenPage, NotFoundPage, RouteError, RouteErrorBoundary } from '@features/errors';
import { PublicOnly, RequireRole, RequireSession } from './guards';

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
] as const;

interface PageOptions {
  lazy?: typeof placeholder;
  surface?: 'brand';
}

const page = (
  path: string,
  title: string,
  { lazy = placeholder, surface }: PageOptions = {},
): RouteObject => ({
  ...(path === '' ? { index: true } : { path }),
  handle: { title, ...(surface && { surface }) },
  ErrorBoundary: RouteError,
  lazy,
});

const authScreen = (name: 'LoginPage' | 'RegisterPage' | 'TermsPage' | 'PrivacyPage' | 'RoleSelectPage') =>
  lazyComponent(async () => (await import('@features/auth'))[name]);

const areaRoute = (area: Area): RouteObject => ({
  path: area.base,
  handle: { role: area.role },
  Component: RequireRole,
  children: [
    {
      lazy: lazyComponent(async () => (await import('@components/layout/RoleLayout')).RoleLayout),
      children: [...area.pages.map(({ path, title }) => page(path, title)), notFound],
    },
  ],
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
          {
            Component: PublicOnly,
            children: [
              page('login', 'Entrar', { lazy: authScreen('LoginPage'), surface: 'brand' }),
              page('cadastro', 'Criar conta', { lazy: authScreen('RegisterPage'), surface: 'brand' }),
            ],
          },
          {
            Component: RequireSession,
            children: [
              page('perfis', 'Escolha seu perfil', { lazy: authScreen('RoleSelectPage'), surface: 'brand' }),
            ],
          },
          page('termos', 'Termos de uso', { lazy: authScreen('TermsPage') }),
          page('privacidade', 'Política de privacidade', { lazy: authScreen('PrivacyPage') }),
          ...placeholderPages.map(([path, title]) => page(path, title)),
          { path: '403', handle: { title: 'Acesso negado' }, Component: ForbiddenPage },
          notFound,
        ],
      },
      { Component: RequireSession, children: Object.values(areas).map(areaRoute) },
    ],
  },
];
