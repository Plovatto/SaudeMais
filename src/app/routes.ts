import type { ComponentType } from 'react';
import { redirect, type RouteObject } from 'react-router';
import { RootFallback, RootRoute } from '@components/layout/RootRoute';
import type { RouteSeo } from '@components/layout/route-handle';
import { PUBLIC_PAGES } from '@config/site';
import { adminUserUrl, DOCTOR_SECTION } from '@constants/admin-users';
import { areas, NOTIFICATIONS_PATH, type Area } from '@constants/areas';
import { ForbiddenPage, NotFoundPage, RouteError, RouteErrorBoundary } from '@features/errors';
import { PublicOnly, RequireRole, RequireSession } from './guards';

const lazyComponent = (load: () => Promise<ComponentType>) => async () => ({ Component: await load() });

const placeholder = lazyComponent(
  async () => (await import('@components/layout/PlaceholderPage')).PlaceholderPage,
);

const indexable = (path: string): RouteSeo => {
  const found = PUBLIC_PAGES.find((candidate) => candidate.path === path);
  return { index: true, ...(found && { title: found.title, description: found.description }) };
};

const notFound: RouteObject = {
  path: '*',
  handle: { title: 'Página não encontrada' },
  Component: NotFoundPage,
};

interface PageOptions {
  lazy?: typeof placeholder;
  surface?: 'brand';
  crumb?: string | undefined;
  seo?: RouteSeo;
}

const page = (
  path: string,
  title: string,
  { lazy = placeholder, surface, crumb, seo }: PageOptions = {},
): RouteObject => ({
  ...(path === '' ? { index: true } : { path }),
  handle: { title, ...(surface && { surface }), ...(crumb && { crumb }), ...(seo && { seo }) },
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
  agendamentos: lazyComponent(async () => (await import('@features/patient-bookings')).PatientBookingsPage),
  usuarios: lazyComponent(async () => (await import('@features/admin-users')).UsersPage),
  relatorios: lazyComponent(async () => (await import('@features/admin-reports')).AdminReportsPage),
  'configuracoes/*': lazyComponent(async () => (await import('@features/admin-settings')).AdminSettingsPage),
  agenda: lazyComponent(async () => (await import('@features/doctor-agenda')).DoctorAgendaPage),
  'pacientes/:id/exames': lazyComponent(
    async () => (await import('@features/patient-results')).PatientResultsPage,
  ),
  disponibilidade: lazyComponent(async () => (await import('@features/doctor-schedule')).DoctorSchedulePage),
  'consultas/nova': lazyComponent(
    async () => (await import('@features/book-appointment')).BookAppointmentPage,
  ),
  'exames/novo': lazyComponent(async () => (await import('@features/book-exam')).BookExamPage),
  'consultas/:id/reagendar': lazyComponent(
    async () => (await import('@features/book-appointment')).RescheduleAppointmentPage,
  ),
  'exames/:id/reagendar': lazyComponent(async () => (await import('@features/book-exam')).RescheduleExamPage),
  'exames/:id/resultado': lazyComponent(async () => (await import('@features/exam-result')).ExamResultPage),
};

const homeScreens: Partial<Record<Area['role'], typeof placeholder>> = {
  patient: lazyComponent(async () => (await import('@features/patient-home')).PatientHomePage),
  doctor: lazyComponent(async () => (await import('@features/doctor-agenda')).DoctorHomePage),
  admin: lazyComponent(async () => (await import('@features/admin-home')).AdminHomePage),
};

const areaRedirects: Partial<Record<Area['role'], RouteObject[]>> = {
  admin: [
    { path: 'usuarios/:id', loader: ({ params }) => redirect(adminUserUrl(params.id ?? '')) },
    {
      path: 'usuarios/:id/medico',
      loader: ({ params }) => redirect(adminUserUrl(params.id ?? '', DOCTOR_SECTION)),
    },
  ],
};

const screenFor = (area: Area, path: string) =>
  (path === '' ? homeScreens[area.role] : areaScreens[path]) ?? placeholder;

const roleRoute = (path: string, children: RouteObject[], role?: Area['role']): RouteObject => ({
  path,
  ...(role && { handle: { role } }),
  Component: RequireRole,
  children: [
    {
      lazy: lazyComponent(async () => (await import('@components/layout/RoleLayout')).RoleLayout),
      children,
    },
  ],
});

const areaRoute = (area: Area): RouteObject =>
  roleRoute(
    area.base,
    [
      ...area.pages.map(({ path, title, crumb }) =>
        page(path, title, { lazy: screenFor(area, path), crumb }),
      ),
      ...(areaRedirects[area.role] ?? []),
      notFound,
    ],
    area.role,
  );

const notificationsRoute = roleRoute(NOTIFICATIONS_PATH, [
  page('', 'Notificações', {
    lazy: lazyComponent(async () => (await import('@features/notifications')).NotificationsPage),
  }),
]);

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
              page('login', 'Entrar', {
                lazy: authScreen('LoginPage'),
                surface: 'brand',
                seo: indexable('/login'),
              }),
              page('cadastro', 'Criar conta', {
                lazy: authScreen('RegisterPage'),
                surface: 'brand',
                seo: indexable('/cadastro'),
              }),
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
          page('termos', 'Termos de uso', { lazy: authScreen('TermsPage'), seo: indexable('/termos') }),
          page('privacidade', 'Política de privacidade', {
            lazy: authScreen('PrivacyPage'),
            seo: indexable('/privacidade'),
          }),
          page('redefinir-senha', 'Criar nova senha', {
            lazy: authScreen('ResetPasswordPage'),
            surface: 'brand',
          }),
          { path: '403', handle: { title: 'Acesso negado' }, Component: ForbiddenPage },
          notFound,
        ],
      },
      { Component: RequireSession, children: [...Object.values(areas).map(areaRoute), notificationsRoute] },
    ],
  },
];
