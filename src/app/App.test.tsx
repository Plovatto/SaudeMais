import { render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import type { Role } from '@constants/areas';
import { mockApi, renderApp, renderRouter } from '@/test/render-app';

const ALL_ROLES: Role[] = ['patient', 'doctor', 'admin'];

function renderAt(path: string, basename?: string, signedIn = true) {
  return renderApp(path, { ...(basename && { basename }), ...(signedIn && { signedInAs: ALL_ROLES }) });
}

async function navigation(name: string) {
  const [nav] = await screen.findAllByRole('navigation', { name });
  if (!nav) throw new Error(`${name} navigation not found`);
  return within(nav);
}

const itemName = (link: HTMLElement) =>
  (link.getAttribute('aria-label') ?? link.querySelector('span')?.textContent ?? '').trim();

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('role areas', () => {
  it.each([
    ['/paciente', ['Início', 'Meus agendamentos', 'Agendar consulta', 'Agendar exame']],
    ['/medico', ['Início', 'Agenda', 'Horários de atendimento']],
    ['/admin', ['Painel', 'Usuários', 'Relatórios', 'Configurações']],
  ])('lists the menu of %s and marks the current page', async (path, labels) => {
    renderAt(path);

    const menu = await navigation('Menu');
    expect(menu.getAllByRole('link').map(itemName)).toEqual(labels);
    expect(menu.getAllByRole('link')[0]).toHaveAttribute('aria-current', 'page');
    expect((await navigation('Conta')).getAllByRole('link').map(itemName)).toEqual([
      'Notificações',
      'Meu perfil',
    ]);
  });

  it.each([
    ['/paciente', ['Início', 'Agenda', 'Agendar consulta', 'Avisos', 'Perfil']],
    ['/medico', ['Início', 'Agenda', 'Horários de atendimento', 'Avisos', 'Perfil']],
    ['/admin', ['Painel', 'Usuários', 'Relatórios', 'Ajustes']],
  ])('puts the main actions of %s in the bottom bar', async (path, labels) => {
    renderAt(path);

    const bar = await navigation('Principal');
    expect(bar.getAllByRole('link').map(itemName)).toEqual(labels);
  });

  it('does not move the focus on the first load', async () => {
    renderAt('/medico');

    const heading = await screen.findByRole('heading', { level: 1, name: 'Início' });
    expect(heading).not.toHaveFocus();
  });

  it.each([
    ['/paciente/consultas/1/reagendar', 'Meus agendamentos'],
    ['/paciente/exames/1/resultado', 'Meus agendamentos'],
    ['/medico/pacientes/1/exames', 'Agenda'],
    ['/admin/configuracoes/especialidades', 'Configurações'],
  ])('marks the section of %s without calling it the current page', async (path, label) => {
    renderAt(path);

    const menu = await navigation('Menu');
    const item = menu.getAllByRole('link').find((link) => itemName(link) === label);
    expect(item).toHaveAttribute('aria-current', 'true');
  });

  it('links the crumb of a page with an id to its parent', async () => {
    renderAt('/medico/pacientes/42/exames');

    const crumbs = await navigation('Você está em');
    expect(crumbs.getByRole('link', { name: 'Agenda' })).toHaveAttribute('href', '/medico/agenda');
  });

  it('sends the old user links to the list with the user panel open', async () => {
    const { router } = renderAt('/admin/usuarios/42/medico');

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/usuarios'));
    expect(router.state.location.search).toBe('?usuario=42&secao=medico');
  });

  it('shows where the page sits and links back to its parent', async () => {
    renderAt('/paciente/exames/1/resultado');

    const crumbs = await navigation('Você está em');
    expect(crumbs.getByRole('link', { name: 'Meus agendamentos' })).toHaveAttribute(
      'href',
      '/paciente/agendamentos',
    );
    expect(crumbs.getByText('Resultado do exame')).toHaveAttribute('aria-current', 'page');
  });

  it.each([
    ['/medico/perfil', 'Meu perfil'],
    ['/notificacoes?perfil=medico', 'Notificações'],
  ])('places %s under the account crumb', async (path, title) => {
    renderAt(path);

    const crumbs = await navigation('Você está em');
    expect(crumbs.getByRole('link', { name: 'Conta' })).toHaveAttribute('href', '/medico/perfil');
    expect(crumbs.getByText(title)).toHaveAttribute('aria-current', 'page');
  });

  it('shortens the reschedule crumb but keeps the full page title', async () => {
    renderAt('/paciente/consultas/1/reagendar');

    const crumbs = await navigation('Você está em');
    expect(crumbs.getByText('Reagendar')).toHaveAttribute('aria-current', 'page');
    await waitFor(() => expect(document.title).toBe('Reagendar consulta · Saúde+'));
  });

  it('skips straight to the main content', async () => {
    renderAt('/paciente');

    const skip = await screen.findByRole('link', { name: 'Pular para o conteúdo' });
    const target = document.querySelector(skip.getAttribute('href') ?? '');
    expect(target?.tagName).toBe('MAIN');
  });

  it('applies the role colors to the area', async () => {
    renderAt('/medico/agenda');

    expect(
      (await screen.findByRole('heading', { level: 1, name: 'Agenda' })).closest('[data-role]'),
    ).toHaveAttribute('data-role', 'doctor');
  });

  it('moves the current page, the page title and the focus when navigating', async () => {
    const { user } = renderAt('/paciente');
    const menu = await navigation('Menu');

    await user.click(menu.getByRole('link', { name: 'Agendar consulta' }));

    const heading = await screen.findByRole('heading', { level: 1, name: 'Agendar consulta' });
    await waitFor(() => expect(document.title).toBe('Agendar consulta · Saúde+'));
    expect(heading).toHaveFocus();
    expect(menu.getByRole('link', { name: 'Agendar consulta' })).toHaveAttribute('aria-current', 'page');
    expect(menu.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current');
  });

  it('hides the bottom bar on booking steps', async () => {
    renderAt('/paciente/consultas/nova');

    await screen.findByRole('heading', { level: 1, name: 'Agendar consulta' });
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();
  });
});

describe('account', { timeout: 15_000 }, () => {
  it('opens the profile of the current area and switches the profile', async () => {
    const { user, router } = renderAt('/medico');

    await user.click((await navigation('Conta')).getByRole('link', { name: 'Meu perfil' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Meu perfil' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/medico/perfil');

    await user.click(screen.getByRole('link', { name: 'Perfil atual Médico Trocar' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Escolha seu perfil' }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it('hides the profile switch for accounts with a single role', async () => {
    renderApp('/paciente/perfil', { signedInAs: ['patient'] });

    await screen.findByRole('heading', { level: 1, name: 'Meu perfil' });

    expect(screen.queryByRole('link', { name: /^Perfil atual/ })).not.toBeInTheDocument();
  });

  it('leaves the account from the profile page', async () => {
    mockApi({ status: 204 });
    const { user, router } = renderAt('/admin/perfil');

    await user.click(await screen.findByRole('button', { name: 'Sair da conta' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Sair' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('switches the theme from the top bar and keeps it on public pages', async () => {
    const { user, router } = renderAt('/paciente');

    const [toggle] = await screen.findAllByRole('button', { name: 'Usar tema escuro' });
    if (!toggle) throw new Error('Theme toggle not found');
    await user.click(toggle);

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getAllByRole('button', { name: 'Usar tema claro' }).length).toBeGreaterThan(0);
    await router.navigate('/termos');
    expect(await screen.findByRole('button', { name: 'Usar tema claro' })).toBeInTheDocument();
  });
});

describe('public pages and errors', () => {
  it('toggles the theme on public pages', async () => {
    const { user } = renderAt('/login', undefined, false);

    await user.click(await screen.findByRole('button', { name: 'Usar tema escuro' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Usar tema claro' })).toBeInTheDocument();
  });

  it.each(['/pagina-que-nao-existe', '/paciente/pagina-que-nao-existe'])(
    'shows the 404 page for %s',
    async (path) => {
      renderAt(path);

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
    },
  );

  it('links back to the start of the site when it is served under a base path', async () => {
    renderAt('/SaudeMais/pagina-que-nao-existe', '/SaudeMais/', false);

    expect(await screen.findByRole('link', { name: 'Voltar ao início' })).toHaveAttribute(
      'href',
      '/SaudeMais/',
    );
  });

  it('names the browser tab after the error screen', async () => {
    renderAt('/pagina-que-nao-existe');

    await waitFor(() => expect(document.title).toBe('Página não encontrada · Saúde+'));
  });

  it('shows the connection screen when a page fails to download', async () => {
    const { RouteError } = await import('@features/errors');
    const router = createMemoryRouter(
      [
        {
          path: '/',
          ErrorBoundary: RouteError,
          lazy: () => Promise.reject(new TypeError('Failed to fetch dynamically imported module: /x.js')),
        },
      ],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Não foi possível conectar' }),
    ).toBeInTheDocument();
  });

  it('keeps the area navigation when a page inside it fails', async () => {
    const { RouteError } = await import('@features/errors');
    const { RoleLayout } = await import('@components/layout/RoleLayout');
    const router = createMemoryRouter(
      [
        {
          path: '/paciente',
          handle: { role: 'patient' },
          Component: RoleLayout,
          children: [
            {
              index: true,
              ErrorBoundary: RouteError,
              Component: () => {
                throw new Error('boom');
              },
            },
          ],
        },
      ],
      { initialEntries: ['/paciente'] },
    );
    renderRouter(router, { signedInAs: ['patient'] });

    expect(await screen.findByRole('heading', { level: 1, name: 'Algo deu errado' })).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: 'Menu' }).length).toBeGreaterThan(0);
  });

  it('shows the 403 page', async () => {
    renderAt('/403', undefined, false);

    expect(await screen.findByRole('heading', { level: 1, name: 'Acesso negado' })).toBeInTheDocument();
  });

  it('shows a recovery screen when a route fails', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          ErrorBoundary: (await import('@features/errors')).RouteErrorBoundary,
          Component: () => {
            throw new Error('boom');
          },
        },
      ],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Algo deu errado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});
