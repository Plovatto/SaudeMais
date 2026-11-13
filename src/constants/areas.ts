import type { IconType } from 'react-icons';
import {
  LuCalendarCog,
  LuCalendarDays,
  LuHeart,
  LuHeartPulse,
  LuPlus,
  LuSettings,
  LuStethoscope,
  LuSyringe,
  LuTrendingUp,
  LuUser,
  LuUserCog,
} from 'react-icons/lu';

export type Role = 'patient' | 'doctor' | 'admin';

export const DEFAULT_ROLE: Role = 'patient';

export interface AreaPage {
  path: string;
  title: string;
  nav?: { label: string; icon: IconType; sections?: readonly string[] };
}

export interface Area {
  role: Role;
  base: string;
  label: string;
  description: string;
  icon: IconType;
  pages: readonly AreaPage[];
}

const home = (title: string, sections: readonly string[] = []): AreaPage => ({
  path: '',
  title,
  nav: { label: 'Início', icon: LuHeart, sections },
});
const profilePage: AreaPage = { path: 'perfil', title: 'Meu perfil' };
const profile: AreaPage = { ...profilePage, nav: { label: 'Perfil', icon: LuUser } };

export const areas: Record<Role, Area> = {
  patient: {
    role: 'patient',
    base: '/paciente',
    label: 'Paciente',
    description: 'Agendar consultas e gerenciar minha saúde',
    icon: LuHeartPulse,
    pages: [
      home('Início', ['agendamentos']),
      {
        path: 'consultas/nova',
        title: 'Agendar consulta',
        nav: { label: 'Consultas', icon: LuPlus, sections: ['consultas'] },
      },
      {
        path: 'exames/novo',
        title: 'Agendar exame',
        nav: { label: 'Exames', icon: LuSyringe, sections: ['exames'] },
      },
      profile,
      { path: 'agendamentos', title: 'Meus agendamentos' },
      { path: 'consultas/:id/reagendar', title: 'Reagendar consulta' },
      { path: 'exames/:id/reagendar', title: 'Reagendar exame' },
      { path: 'exames/:id/resultado', title: 'Resultado do exame' },
    ],
  },
  doctor: {
    role: 'doctor',
    base: '/medico',
    label: 'Médico',
    description: 'Gerenciar agenda e atender pacientes',
    icon: LuStethoscope,
    pages: [
      home('Início', ['pacientes']),
      { path: 'agenda', title: 'Agenda', nav: { label: 'Agenda', icon: LuCalendarDays } },
      {
        path: 'disponibilidade',
        title: 'Gerenciar agenda',
        nav: { label: 'Gerenciar', icon: LuCalendarCog },
      },
      profile,
      { path: 'pacientes/:id/exames', title: 'Exames do paciente' },
    ],
  },
  admin: {
    role: 'admin',
    base: '/admin',
    label: 'Administrador',
    description: 'Gerenciar sistema e usuários',
    icon: LuSettings,
    pages: [
      home('Painel'),
      {
        path: 'usuarios',
        title: 'Usuários',
        nav: { label: 'Usuários', icon: LuUserCog, sections: ['usuarios'] },
      },
      { path: 'relatorios', title: 'Relatórios', nav: { label: 'Relatórios', icon: LuTrendingUp } },
      {
        path: 'configuracoes/*',
        title: 'Configurações',
        nav: { label: 'Configurações', icon: LuSettings, sections: ['configuracoes'] },
      },
      { path: 'usuarios/:id', title: 'Editar usuário' },
      { path: 'usuarios/:id/medico', title: 'Cadastro de médico' },
      profilePage,
    ],
  },
};

export function navState(area: Area, page: AreaPage, pathname: string): 'page' | 'section' | undefined {
  const url = pageUrl(area, page);
  if (pathname === url) return 'page';
  const relative = pathname.startsWith(`${area.base}/`) ? pathname.slice(area.base.length + 1) : undefined;
  if (relative === undefined) return undefined;
  const inSection = (page.nav?.sections ?? []).some(
    (section) => relative === section || relative.startsWith(`${section}/`),
  );
  return inSection ? 'section' : undefined;
}

export function pageUrl(area: Area, page: AreaPage): string {
  const path = page.path.replace(/\/\*$/, '');
  return path ? `${area.base}/${path}` : area.base;
}
