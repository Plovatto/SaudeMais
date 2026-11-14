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

type AuthScreenName =
  | 'LoginPage'
  | 'RegisterPage'
  | 'ForgotPasswordPage'
  | 'ResetPasswordPage'
  | 'TermsPage'
  | 'PrivacyPage'
  | 'RoleSelectPage';

const authScreen = (name: AuthScreenName) =>
  lazyComponent(async () => (await import('@features/auth'))[name]);

const areaScreens: Record<string, typeof placeholder> = {
  perfil: lazyComponent(async () => (await import('@features/profile')).ProfilePage),
  usuarios: lazyComponent(async () => (await import('@features/admin-users')).UsersPage),
  'usuarios/:id': lazyComponent(async () => (await import('@features/admin-users')).EditUserPage),
  'usuarios/:id/medico': lazyComponent(async () => (await import('@features/admin-users')).DoctorProfilePage),
  'configuracoes/*': lazyComponent(async () => (await import('@features/admin-settings')).AdminSettingsPage),
  disponibilidade: lazyComponent(async () => (await import('@features/doctor-schedule')).DoctorSchedulePage),
  'consultas/nova': lazyComponent(
    async () => (await import('@features/book-appointment')).BookAppointmentPage,
  ),
};

const homeScreens: Partial<Record<Area['role'], typeof placeholder>> = {
  admin: lazyComponent(async () => (await import('@features/admin-home')).AdminHomePage),
};

const screenFor = (area: Area, path: string) =>
  (path === '' ? homeScreens[area.role] : areaScreens[path]) ?? placeholder;

const areaRoute = (area: Area): RouteObject => ({
  path: area.base,
  handle: { role: area.role },
  Component: RequireRole,
  children: [
    {
      lazy: lazyComponent(async () => (await import('@components/layout/RoleLayout')).RoleLayout),
      children: [
        ...area.pages.map(({ path, title }) => page(path, title, { lazy: screenFor(area, path) })),
        notFound,
      ],
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
              page('esqueci-senha', 'Esqueci a senha', {
                lazy: authScreen('ForgotPasswordPage'),
                surface: 'brand',
              }),
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
          page('redefinir-senha', 'Criar nova senha', {
            lazy: authScreen('ResetPasswordPage'),
            surface: 'brand',
          }),
          { path: '403', handle: { title: 'Acesso negado' }, Component: ForbiddenPage },
          notFound,
        ],
      },
      { Component: RequireSession, children: Object.values(areas).map(areaRoute) },
    ],
  },
];
