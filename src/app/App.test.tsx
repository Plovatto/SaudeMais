import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { routes } from './routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return { router, user: userEvent.setup() };
}

async function mainNav() {
  const [nav] = await screen.findAllByRole('navigation', { name: 'Navegação principal' });
  if (!nav) throw new Error('Main navigation not found');
  return within(nav);
}

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('role areas', () => {
  it.each([
    ['/paciente', ['Início', 'Consultas', 'Exames', 'Perfil']],
    ['/medico', ['Início', 'Agenda', 'Gerenciar', 'Perfil']],
    ['/admin', ['Início', 'Usuários', 'Relatórios', 'Configurações']],
  ])('shows the four tabs of %s and marks the current one', async (path, labels) => {
    renderAt(path);

    const nav = await mainNav();
    expect(nav.getAllByRole('link').map((link) => link.textContent)).toEqual(labels);
    expect(nav.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
  });

  it('applies the role colors to the area', async () => {
    renderAt('/medico/agenda');

    expect(
      (await screen.findByRole('heading', { level: 1, name: 'Agenda' })).closest('[data-role]'),
    ).toHaveAttribute('data-role', 'doctor');
  });

  it('moves the current tab, the page title and the focus when navigating', async () => {
    const { user } = renderAt('/paciente');
    const nav = await mainNav();

    await user.click(nav.getByRole('link', { name: 'Consultas' }));

    const heading = await screen.findByRole('heading', { level: 1, name: 'Agendar consulta' });
    expect(heading).toHaveFocus();
    expect(document.title).toBe('Agendar consulta · Saúde+');
    expect(nav.getByRole('link', { name: 'Consultas' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current');
  });
});

describe('account menu', () => {
  it('opens the profile of the current area and switches the profile', async () => {
    const { user, router } = renderAt('/medico');

    await user.click(await screen.findByRole('button', { name: 'Menu da conta, Médico' }));
    await user.click(screen.getByRole('menuitem', { name: 'Meu perfil' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Meu perfil' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/medico/perfil');

    await user.click(screen.getByRole('button', { name: 'Menu da conta, Médico' }));
    await user.click(screen.getByRole('menuitem', { name: 'Trocar perfil' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Escolha seu perfil' })).toBeInTheDocument();
  });

  it('switches the theme and marks the current choice', async () => {
    const { user } = renderAt('/paciente');
    const trigger = await screen.findByRole('button', { name: 'Menu da conta, Paciente' });

    await user.click(trigger);
    await user.click(screen.getByRole('menuitemradio', { name: 'Tema escuro' }));
    await user.click(trigger);

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('menuitemradio', { name: 'Tema escuro' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'Tema claro' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });
});

describe('public pages and errors', () => {
  it('offers the theme choice on public pages', async () => {
    const { user } = renderAt('/login');

    await user.click(await screen.findByRole('button', { name: 'Tema' }));

    expect(screen.getByRole('menuitemradio', { name: 'Tema claro' })).toBeInTheDocument();
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

  it('shows the 403 page', async () => {
    renderAt('/403');

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
