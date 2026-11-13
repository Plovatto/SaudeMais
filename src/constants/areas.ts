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

export interface AreaPage {
  path: string;
  title: string;
  nav?: { label: string; icon: IconType };
}

export interface Area {
  role: Role;
  base: string;
  label: string;
  icon: IconType;
  pages: readonly AreaPage[];
}

const home = (title: string): AreaPage => ({ path: '', title, nav: { label: 'Início', icon: LuHeart } });
const profile: AreaPage = { path: 'perfil', title: 'Meu perfil', nav: { label: 'Perfil', icon: LuUser } };

export const areas: Record<Role, Area> = {
  patient: {
    role: 'patient',
    base: '/paciente',
    label: 'Paciente',
    icon: LuHeartPulse,
    pages: [
      home('Início'),
      { path: 'consultas/nova', title: 'Agendar consulta', nav: { label: 'Consultas', icon: LuPlus } },
      { path: 'exames/novo', title: 'Agendar exame', nav: { label: 'Exames', icon: LuSyringe } },
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
    icon: LuStethoscope,
    pages: [
      home('Início'),
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
    icon: LuSettings,
    pages: [
      home('Painel'),
      { path: 'usuarios', title: 'Usuários', nav: { label: 'Usuários', icon: LuUserCog } },
      { path: 'relatorios', title: 'Relatórios', nav: { label: 'Relatórios', icon: LuTrendingUp } },
      { path: 'configuracoes/*', title: 'Configurações', nav: { label: 'Configurações', icon: LuSettings } },
      { path: 'usuarios/:id', title: 'Editar usuário' },
      { path: 'usuarios/:id/medico', title: 'Cadastro de médico' },
      { path: 'perfil', title: 'Meu perfil' },
    ],
  },
};

export function pageUrl(area: Area, page: AreaPage): string {
  const path = page.path.replace(/\/\*$/, '');
  return path ? `${area.base}/${path}` : area.base;
}
