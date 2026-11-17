import type { IconType } from 'react-icons';
import {
  LuCalendarCheck,
  LuCalendarDays,
  LuClock,
  LuFlaskConical,
  LuHeart,
  LuHeartPulse,
  LuLayoutDashboard,
  LuPlus,
  LuShieldCheck,
  LuSlidersHorizontal,
  LuStethoscope,
  LuTrendingUp,
  LuUsers,
} from 'react-icons/lu';
import { generatePath, matchPath } from 'react-router';

export type Role = 'patient' | 'doctor' | 'admin';

export const DEFAULT_ROLE: Role = 'patient';

export type NavBadge = 'patient-upcoming' | 'doctor-pending';

export interface AreaPage {
  path: string;
  title: string;
  parent?: string;
  flow?: boolean;
  nav?: { label: string; short?: string; icon: IconType; badge?: NavBadge };
}

export interface Area {
  role: Role;
  base: string;
  label: string;
  title: string;
  description: string;
  icon: IconType;
  pages: readonly AreaPage[];
  tabs: readonly string[];
  fab?: { path: string; label: string; icon: IconType };
}

const PROFILE = 'perfil';

const profilePage: AreaPage = { path: PROFILE, title: 'Meu perfil' };

export const areas: Record<Role, Area> = {
  patient: {
    role: 'patient',
    base: '/paciente',
    label: 'Paciente',
    title: 'Área do paciente',
    description: 'Agendar consultas e gerenciar minha saúde',
    icon: LuHeartPulse,
    pages: [
      { path: '', title: 'Início', nav: { label: 'Início', icon: LuHeart } },
      {
        path: 'agendamentos',
        title: 'Meus agendamentos',
        parent: '',
        nav: {
          label: 'Meus agendamentos',
          short: 'Agenda',
          icon: LuCalendarCheck,
          badge: 'patient-upcoming',
        },
      },
      {
        path: 'consultas/nova',
        title: 'Agendar consulta',
        parent: '',
        flow: true,
        nav: { label: 'Agendar consulta', icon: LuStethoscope },
      },
      {
        path: 'exames/novo',
        title: 'Agendar exame',
        parent: '',
        flow: true,
        nav: { label: 'Agendar exame', icon: LuFlaskConical },
      },
      profilePage,
      { path: 'consultas/:id/reagendar', title: 'Reagendar consulta', parent: 'agendamentos', flow: true },
      { path: 'exames/:id/reagendar', title: 'Reagendar exame', parent: 'agendamentos', flow: true },
      { path: 'exames/:id/resultado', title: 'Resultado do exame', parent: 'agendamentos' },
    ],
    tabs: ['', 'agendamentos'],
    fab: { path: 'consultas/nova', label: 'Agendar consulta', icon: LuPlus },
  },
  doctor: {
    role: 'doctor',
    base: '/medico',
    label: 'Médico',
    title: 'Área do médico',
    description: 'Gerenciar agenda e atender pacientes',
    icon: LuStethoscope,
    pages: [
      { path: '', title: 'Início', nav: { label: 'Início', icon: LuHeart } },
      {
        path: 'agenda',
        title: 'Agenda',
        parent: '',
        nav: { label: 'Agenda', icon: LuCalendarDays, badge: 'doctor-pending' },
      },
      {
        path: 'disponibilidade',
        title: 'Gerenciar agenda',
        parent: '',
        nav: { label: 'Horários de atendimento', short: 'Horários', icon: LuClock },
      },
      profilePage,
      { path: 'pacientes/:id/exames', title: 'Exames do paciente', parent: 'agenda' },
    ],
    tabs: ['', 'agenda'],
    fab: { path: 'disponibilidade', label: 'Horários de atendimento', icon: LuClock },
  },
  admin: {
    role: 'admin',
    base: '/admin',
    label: 'Administrador',
    title: 'Administração',
    description: 'Gerenciar sistema e usuários',
    icon: LuShieldCheck,
    pages: [
      { path: '', title: 'Painel', nav: { label: 'Painel', icon: LuLayoutDashboard } },
      { path: 'usuarios', title: 'Usuários', parent: '', nav: { label: 'Usuários', icon: LuUsers } },
      {
        path: 'relatorios',
        title: 'Relatórios',
        parent: '',
        nav: { label: 'Relatórios', icon: LuTrendingUp },
      },
      {
        path: 'configuracoes/*',
        title: 'Configurações',
        parent: '',
        nav: { label: 'Configurações', short: 'Ajustes', icon: LuSlidersHorizontal },
      },
      { path: 'usuarios/:id', title: 'Editar usuário', parent: 'usuarios' },
      { path: 'usuarios/:id/medico', title: 'Cadastro de médico', parent: 'usuarios/:id' },
      profilePage,
    ],
    tabs: ['', 'usuarios', 'relatorios', 'configuracoes/*'],
  },
};

export function pageUrl(area: Area, page: Pick<AreaPage, 'path'>): string {
  const path = page.path.replace(/\/\*$/, '');
  return path ? `${area.base}/${path}` : area.base;
}

export const findPage = (area: Area, path: string) => area.pages.find((page) => page.path === path);

const patternOf = (area: Area, page: AreaPage) => (page.path ? `${area.base}/${page.path}` : area.base);

const matchOf = (area: Area, page: AreaPage, pathname: string) =>
  matchPath({ path: patternOf(area, page), end: true }, pathname);

export function currentPage(area: Area, pathname: string): AreaPage | undefined {
  return area.pages.find((page) => matchOf(area, page, pathname) !== null);
}

export function parentLink(area: Area, pathname: string): { label: string; to: string } | undefined {
  const page = currentPage(area, pathname);
  const parent = page?.parent === undefined ? undefined : findPage(area, page.parent);
  if (!page || !parent) return undefined;
  return {
    label: parent.nav?.label ?? parent.title,
    to: generatePath(
      patternOf(area, parent).replace(/\/\*$/, ''),
      matchOf(area, page, pathname)?.params ?? {},
    ),
  };
}

export type NavState = 'page' | 'section' | undefined;

export function navState(area: Area, navPath: string, pathname: string): NavState {
  let page = currentPage(area, pathname);
  let exact = true;
  while (page) {
    if (page.path === navPath) return exact && pathname === pageUrl(area, page) ? 'page' : 'section';
    if (page.parent === undefined || page.nav) return undefined;
    page = findPage(area, page.parent);
    exact = false;
  }
  return undefined;
}

export const profileUrl = (role: Role) => `${areas[role].base}/${PROFILE}`;

export const AREA_PARAM = 'perfil';

export const NOTIFICATIONS_PATH = '/notificacoes';

export const areaSlug = (role: Role) => areas[role].base.slice(1);

export function roleFromSlug(slug: string | null): Role | undefined {
  return Object.values(areas).find(({ role }) => areaSlug(role) === slug)?.role;
}

export const notificationsUrl = (role: Role) => `${NOTIFICATIONS_PATH}?${AREA_PARAM}=${areaSlug(role)}`;

export const PATIENT_BOOKINGS_PATH = `${areas.patient.base}/agendamentos`;

export const PATIENT_PAST_PATH = `${PATIENT_BOOKINGS_PATH}?aba=realizados`;

export const examResultUrl = (bookingId: string) => `${areas.patient.base}/exames/${bookingId}/resultado`;

export function parentUrl(pathname: string): string | undefined {
  const area = Object.values(areas).find(({ base }) => pathname === base || pathname.startsWith(`${base}/`));
  return area && parentLink(area, pathname)?.to;
}
