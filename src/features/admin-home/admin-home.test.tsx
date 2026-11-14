import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp, serveApi, type MockResponse } from '@/test/render-app';

const counts = { patients: 1234, doctors: 61, appointmentsToday: 24 };

const serve = (respond: () => MockResponse) => serveApi(['admin'], { '/api/admin/home': respond });

const summary = async () => within(await screen.findByRole('region', { name: 'Resumo do Sistema' }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('admin home', () => {
  it('shows the system counts from the API', async () => {
    serve(() => ({ status: 200, body: counts }));
    renderApp('/admin');

    expect(await screen.findByRole('heading', { level: 1, name: 'Painel Admin' })).toBeInTheDocument();
    const region = await summary();
    expect(await region.findByText('1.234')).toBeInTheDocument();
    expect(region.getAllByRole('term').map((item) => item.textContent)).toEqual([
      'Pacientes',
      'Consultas Hoje',
      'Médicos',
    ]);
    expect(region.getAllByRole('definition').map((item) => item.textContent)).toEqual(['1.234', '24', '61']);
  });

  it('marks the counts as busy while they load', async () => {
    const { fetchMock } = serve(() => ({ status: 200, body: counts }));
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => undefined));
    renderApp('/admin', { signedInAs: ['admin'] });

    const region = await summary();

    expect(region.getByText('Pacientes').closest('dl')).toHaveAttribute('aria-busy', 'true');
    expect(region.queryByText(/\d/)).not.toBeInTheDocument();
  });

  it('shows the error and loads the counts again on retry', async () => {
    let available = false;
    serve(() => (available ? { status: 200, body: counts } : { status: 500 }));
    const { user } = renderApp('/admin');
    const region = await summary();
    const retry = await region.findByRole('button', { name: 'Tentar de novo' });
    expect(region.getByRole('alert')).toHaveTextContent(/\S/);
    available = true;

    await user.click(retry);

    expect(await region.findByText('1.234')).toBeInTheDocument();
    expect(region.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['Gerenciar Usuários', '/admin/usuarios'],
    ['Relatórios', '/admin/relatorios'],
    ['Configurações', '/admin/configuracoes'],
  ])('opens %s from the shortcuts', async (name, path) => {
    serve(() => ({ status: 200, body: counts }));
    const { router, user } = renderApp('/admin');
    const shortcuts = within(await screen.findByRole('navigation', { name: 'Atalhos do painel' }));

    await user.click(shortcuts.getByRole('link', { name }));

    await waitFor(() => expect(router.state.location.pathname.startsWith(path)).toBe(true));
  });

  it('keeps the home placeholder for the other areas', async () => {
    serveApi(['patient'], {});
    renderApp('/paciente');

    expect(await screen.findByText('Em construção')).toBeInTheDocument();
    expect(screen.queryByText('Painel Admin')).not.toBeInTheDocument();
  });
});
