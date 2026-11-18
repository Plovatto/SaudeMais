import { act, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render-app';
import { page, serveSettings as serve } from './settings-fixtures';

const API_KEY = 'slab_ab12cd34_q3Zp1vQx8n0rT2bYc4dEf6gHi8jKl0mNo2pQr4sTu6v';
const PATH = '/admin/configuracoes/integracoes';

const client = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name: `Laboratório ${id}`,
  keyPrefix: 'ab12cd34',
  createdAt: '2026-11-10T12:00:00.000Z',
  lastUsedAt: null,
  revokedAt: null,
  ...overrides,
});

const listCalls = (calls: ReturnType<typeof serve>['calls']) =>
  calls.filter((call) => call.method === 'GET' && call.url.pathname === '/api/admin/integration-clients');

async function createIntegration(name: string) {
  const { user, ...rest } = renderApp(PATH);
  await user.click(await screen.findByRole('button', { name: 'Adicionar integração' }));
  const panel = await screen.findByRole('dialog', { name: 'Nova integração' });
  await user.type(within(panel).getByLabelText('Nome'), name);
  await user.click(within(panel).getByRole('button', { name: 'Criar integração' }));
  return { user, ...rest };
}

describe('admin integrations', () => {
  it('lists clients with the key prefix, last use and status', async () => {
    serve({
      '/api/admin/integration-clients': () => ({
        status: 200,
        body: page([
          client('A', { lastUsedAt: new Date(Date.now() - 5 * 60_000).toISOString() }),
          client('B', { revokedAt: '2026-11-12T12:00:00.000Z' }),
          client('C'),
        ]),
      }),
    });
    renderApp(PATH);

    const active = (await screen.findByText('Laboratório A')).closest('li');
    const revoked = screen.getByText('Laboratório B').closest('li');
    if (!active || !revoked) throw new Error('rows not found');

    await waitFor(() => expect(document.getElementById('integracoes')).toHaveFocus());
    expect(within(active).getByText('slab_ab12cd34_…')).toBeInTheDocument();
    expect(within(active).getByText('há 5 min.')).toBeInTheDocument();
    expect(within(active).getByText('Ativa')).toBeInTheDocument();
    expect(within(active).getByRole('button', { name: 'Revogar Laboratório A' })).toBeInTheDocument();
    expect(within(revoked).getByText(/^Revogada em /)).toBeInTheDocument();
    expect(within(revoked).queryByText('Nunca usada')).not.toBeInTheDocument();
    expect(
      within(screen.getByText('Laboratório C').closest('li') as HTMLElement).getByText('Nunca usada'),
    ).toBeInTheDocument();
    expect(within(revoked).getByText('Revogada')).toBeInTheDocument();
    expect(within(revoked).queryByRole('button', { name: /Revogar/ })).not.toBeInTheDocument();
  });

  it('shows the new key once, copies it and forgets it after closing', async () => {
    let created = false;
    const { calls } = serve({
      '/api/admin/integration-clients': (method, body) => {
        if (method === 'POST') {
          created = true;
          return { status: 201, body: { ...client('N', body as Record<string, unknown>), apiKey: API_KEY } };
        }
        return { status: 200, body: page(created ? [client('N', { name: 'Laboratório Central' })] : []) };
      },
    });
    const { user, queryClient } = await createIntegration('Laboratório Central');

    const keyDialog = await screen.findByRole('dialog', { name: 'Chave da integração' });
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({ name: 'Laboratório Central' });
    expect(within(keyDialog).getByLabelText('Chave de API')).toHaveValue(API_KEY);
    expect(within(keyDialog).getByText(/não será exibida de novo/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Nova integração' })).not.toBeInTheDocument();

    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(within(keyDialog).getByRole('button', { name: 'Copiar' }));
    expect(writeText).toHaveBeenCalledWith(API_KEY);
    const status = within(keyDialog).getByRole('status');
    expect(status).toHaveTextContent('Chave copiada.');

    const announced: string[] = [];
    const observer = new MutationObserver(() => announced.push(status.textContent));
    observer.observe(status, { childList: true, characterData: true, subtree: true });
    await user.click(within(keyDialog).getByRole('button', { name: 'Copiar' }));
    observer.disconnect();
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(announced).toEqual(['', 'Chave copiada.']);

    await user.click(within(keyDialog).getByRole('button', { name: 'Já copiei' }));

    expect(screen.queryByRole('dialog', { name: 'Chave da integração' })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue(API_KEY)).not.toBeInTheDocument();
    expect(await screen.findByText('Laboratório Central')).toBeInTheDocument();
    expect(listCalls(calls).length).toBeGreaterThan(1);
    const cached = [
      ...queryClient
        .getQueryCache()
        .getAll()
        .map((query) => query.state.data),
      ...queryClient
        .getMutationCache()
        .getAll()
        .map((mutation) => mutation.state.data),
    ];
    expect(JSON.stringify(cached)).not.toContain(API_KEY);
  });

  it('selects the key for a manual copy when the clipboard fails', async () => {
    serve({
      '/api/admin/integration-clients': (method) =>
        method === 'POST'
          ? { status: 201, body: { ...client('N'), apiKey: API_KEY } }
          : { status: 200, body: page([]) },
    });
    const { user } = await createIntegration('Laboratório N');
    const keyDialog = await screen.findByRole('dialog', { name: 'Chave da integração' });
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));

    await user.click(within(keyDialog).getByRole('button', { name: 'Copiar' }));

    expect(within(keyDialog).getByRole('status')).toHaveTextContent(/A chave está selecionada/);
    const input = within(keyDialog).getByLabelText<HTMLInputElement>('Chave de API');
    expect(input).toHaveFocus();
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, API_KEY.length]);
  });

  it('keeps the panel open while the integration is being created', async () => {
    const { fetchMock } = serve({
      '/api/admin/integration-clients': () => ({ status: 200, body: page([]) }),
    });
    const { user } = renderApp(PATH);
    await user.click(await screen.findByRole('button', { name: 'Adicionar integração' }));
    const panel = await screen.findByRole('dialog', { name: 'Nova integração' });
    await user.type(within(panel).getByLabelText('Nome'), 'Laboratório Central');
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => undefined));

    await user.click(within(panel).getByRole('button', { name: 'Criar integração' }));

    await waitFor(() => expect(within(panel).getByRole('button', { name: 'Cancelar' })).toBeDisabled());
    expect(within(panel).queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();
    act(() => {
      (panel as HTMLDialogElement).close();
    });
    expect(panel).toHaveAttribute('open');
  });

  it('shows a taken name on the field', async () => {
    serve({
      '/api/admin/integration-clients': (method) =>
        method === 'POST'
          ? {
              status: 409,
              body: {
                message: 'Já existe uma integração com esse nome.',
                code: 'NAME_TAKEN',
                fields: { name: 'Já existe uma integração com esse nome.' },
              },
            }
          : { status: 200, body: page([]) },
    });
    await createIntegration('Laboratório Central');

    const panel = screen.getByRole('dialog', { name: 'Nova integração' });
    const field = within(panel).getByLabelText('Nome');
    await waitFor(() =>
      expect(field).toHaveAccessibleDescription(/Já existe uma integração com esse nome\./),
    );
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('dialog', { name: 'Chave da integração' })).not.toBeInTheDocument();
  });

  it('revokes only after confirming and refreshes the list', async () => {
    let revoked = false;
    const { calls } = serve({
      '/api/admin/integration-clients': () => ({
        status: 200,
        body: page([client('A', revoked ? { revokedAt: '2026-11-15T12:00:00.000Z' } : {})]),
      }),
      '/api/admin/integration-clients/A/revoke': () => {
        revoked = true;
        return { status: 200, body: client('A', { revokedAt: '2026-11-15T12:00:00.000Z' }) };
      },
    });
    const { user } = renderApp(PATH);

    await user.click(await screen.findByRole('button', { name: 'Revogar Laboratório A' }));
    const confirm = await screen.findByRole('dialog', { name: 'Revogar a chave de Laboratório A?' });
    expect(confirm).toHaveAccessibleDescription(/perde o acesso na hora/);
    await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }));
    expect(calls.some((call) => call.method === 'POST')).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Revogar Laboratório A' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Revogar a chave de Laboratório A?' })).getByRole(
        'button',
        { name: 'Revogar chave' },
      ),
    );

    expect(await screen.findByText('Revogada')).toBeInTheDocument();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Revogar Laboratório A' })).not.toBeInTheDocument();
    expect(await screen.findByText('Chave de Laboratório A revogada.')).toBeInTheDocument();
  });

  it('refreshes the list when the integration no longer exists', async () => {
    let removed = false;
    const { calls } = serve({
      '/api/admin/integration-clients': () => ({ status: 200, body: page(removed ? [] : [client('A')]) }),
      '/api/admin/integration-clients/A/revoke': () => {
        removed = true;
        return { status: 404, body: { message: 'Integração não encontrada.', code: 'NOT_FOUND' } };
      },
    });
    const { user } = renderApp(PATH);

    await user.click(await screen.findByRole('button', { name: 'Revogar Laboratório A' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Revogar a chave de Laboratório A?' })).getByRole(
        'button',
        { name: 'Revogar chave' },
      ),
    );

    expect(await screen.findByText('Esta integração não existe mais. Atualize a lista.')).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma integração criada.')).toBeInTheDocument();
    expect(listCalls(calls).length).toBeGreaterThan(1);
  });
});
