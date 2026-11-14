import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEMO_DOCTOR } from '@constants/demo-accounts';
import { SESSION_STORAGE_KEY } from '@lib/auth/token-store';
import { mockFetch, renderApp, serveApi, TEST_TOKEN, testUser, type MockResponse } from '@/test/render-app';

const PATH = '/api/doctor/schedule';

const unitHours = [1, 2, 3, 4, 5].map((weekday) => ({ weekday, openMin: 420, closeMin: 1140 }));

const schedule = {
  days: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    isActive: weekday === 1 || weekday === 2,
    ranges:
      weekday === 1
        ? [{ startMin: 480, endMin: 720 }]
        : weekday === 2
          ? [
              { startMin: 480, endMin: 720 },
              { startMin: 780, endMin: 1020 },
            ]
          : [],
  })),
  unitHours,
};

const serve = (save: (body: unknown) => MockResponse = () => ({ status: 500 })) =>
  serveApi(['doctor'], {
    [PATH]: (method, body) => (method === 'PUT' ? save(body) : { status: 200, body: schedule }),
  });

const day = async (name: string) =>
  within((await screen.findByText(name, { selector: 'h2' })).closest('section') as HTMLElement);

const saveButton = () => screen.getByText('Salvar agenda', { selector: 'button' });

const savedBody = (calls: ReturnType<typeof serve>['calls']) =>
  calls.find((call) => call.method === 'PUT')?.body as typeof schedule | undefined;

describe('doctor schedule', { timeout: 15_000 }, () => {
  it('shows every weekday with its switch, ranges and unit hours', async () => {
    serve();
    renderApp('/medico/disponibilidade');

    expect(await screen.findByRole('heading', { level: 1, name: 'Gerenciar agenda' })).toBeInTheDocument();
    expect(await screen.findAllByRole('switch')).toHaveLength(7);
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ]);
    const monday = await day('Segunda-feira');
    expect(monday.getByRole('switch', { name: 'Ativo: Segunda-feira' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(monday.getByText('1 horário configurado')).toBeInTheDocument();
    expect(monday.getByText('Unidade aberta 07:00–19:00')).toBeInTheDocument();
    expect(monday.getByRole('combobox', { name: 'Início da faixa 1 de segunda-feira' })).toHaveValue('480');
    expect(
      monday.getByRole('button', { name: 'Remover faixa 08:00–12:00 de segunda-feira' }),
    ).toBeInTheDocument();
    const sunday = await day('Domingo');
    expect(sunday.getByRole('switch', { name: 'Ativo: Domingo' })).toHaveAttribute('aria-checked', 'false');
    expect(sunday.getByText('Nenhum horário configurado')).toBeInTheDocument();
    expect(sunday.getByText('Unidade fechada')).toBeInTheDocument();
    const nav = within(screen.getAllByRole('navigation', { name: 'Navegação principal' })[0] as HTMLElement);
    expect(nav.getByRole('link', { name: 'Gerenciar' })).toHaveAttribute('aria-current', 'page');
  });

  it('activates a day, adds a range, saves and shows the warnings', async () => {
    const { calls } = serve((body) => ({
      status: 200,
      body: {
        ...(body as typeof schedule),
        unitHours,
        warnings: [{ appointmentId: 'a1', startsAt: '2026-11-23T11:00:00.000Z' }],
      },
    }));
    const { user } = renderApp('/medico/disponibilidade');
    const wednesday = await day('Quarta-feira');

    await user.click(wednesday.getByRole('switch', { name: 'Ativo: Quarta-feira' }));
    await user.click(wednesday.getByRole('button', { name: 'Adicionar Horário' }));
    expect(wednesday.getByRole('combobox', { name: 'Início da faixa 1 de quarta-feira' })).toHaveFocus();
    await user.selectOptions(
      wednesday.getByRole('combobox', { name: 'Fim da faixa 1 de quarta-feira' }),
      '600',
    );
    await user.click(saveButton());

    expect(await screen.findByText('Agenda salva.')).toBeInTheDocument();
    const body = savedBody(calls);
    expect(body?.days).toHaveLength(7);
    expect(body?.days[3]).toEqual({ weekday: 3, isActive: true, ranges: [{ startMin: 420, endMin: 600 }] });
    expect(screen.getByText(/1 consulta futura ficou fora das novas faixas/)).toHaveAttribute(
      'role',
      'alert',
    );
  });

  it('removes a range and saves the rest of the day', async () => {
    const { calls } = serve((body) => ({
      status: 200,
      body: { ...(body as typeof schedule), unitHours, warnings: [] },
    }));
    const { user } = renderApp('/medico/disponibilidade');
    const tuesday = await day('Terça-feira');

    await user.click(tuesday.getByRole('button', { name: 'Remover faixa 13:00–17:00 de terça-feira' }));
    expect(tuesday.getByText('1 horário configurado')).toBeInTheDocument();
    expect(tuesday.getByRole('button', { name: 'Adicionar Horário' })).toHaveFocus();
    await user.click(saveButton());

    expect(await screen.findByText('Agenda salva.')).toBeInTheDocument();
    expect(savedBody(calls)?.days[2]).toEqual({
      weekday: 2,
      isActive: true,
      ranges: [{ startMin: 480, endMin: 720 }],
    });
    expect(screen.queryByText(/fora das novas faixas/)).not.toBeInTheDocument();
  });

  it('keeps the ranges of an inactive day visible', async () => {
    serve();
    const { user } = renderApp('/medico/disponibilidade');
    const monday = await day('Segunda-feira');

    await user.click(monday.getByRole('switch', { name: 'Ativo: Segunda-feira' }));

    expect(monday.getByText('1 horário configurado · não gera vagas')).toBeInTheDocument();
    expect(monday.getByRole('list', { name: 'Faixas de segunda-feira' })).toHaveClass('opacity-75');
    expect(monday.queryByRole('button', { name: 'Adicionar Horário' })).not.toBeInTheDocument();
  });

  it('checks the ranges before saving', async () => {
    const { calls } = serve();
    const { user } = renderApp('/medico/disponibilidade');
    const monday = await day('Segunda-feira');
    const start = monday.getByRole('combobox', { name: 'Início da faixa 1 de segunda-feira' });

    await user.selectOptions(start, '780');
    await user.click(saveButton());

    const message = await monday.findByText('O fim precisa ser depois do início.');
    expect(start).toHaveFocus();
    expect(start).toHaveAttribute('aria-invalid', 'true');
    expect(start.getAttribute('aria-describedby')).toBe(message.id);
    expect(monday.getByRole('combobox', { name: 'Fim da faixa 1 de segunda-feira' })).toHaveAttribute(
      'aria-describedby',
      message.id,
    );
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
  });

  it('points the API errors at the offending ranges', async () => {
    serve(() => ({
      status: 422,
      body: {
        code: 'OUTSIDE_UNIT_HOURS',
        message: 'Esta faixa fica fora do horário da unidade.',
        fields: { 'days.2.ranges.1.endMin': 'Esta faixa fica fora do horário da unidade.' },
      },
    }));
    const { user } = renderApp('/medico/disponibilidade');
    const tuesday = await day('Terça-feira');

    await user.click(saveButton());

    const message = await tuesday.findByText('Esta faixa fica fora do horário da unidade.');
    const start = tuesday.getByRole('combobox', { name: 'Início da faixa 2 de terça-feira' });
    expect(start).toHaveFocus();
    expect(start).toHaveAttribute('aria-describedby', message.id);
    expect(tuesday.getByRole('combobox', { name: 'Início da faixa 1 de terça-feira' })).not.toHaveAttribute(
      'aria-invalid',
    );
  });

  it('shows the demo doctor a read-only schedule', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
    mockFetch((path) =>
      path === '/api/me'
        ? { status: 200, body: { ...testUser(['doctor', 'patient']), email: DEMO_DOCTOR.email } }
        : path === PATH
          ? { status: 200, body: schedule }
          : undefined,
    );
    renderApp('/medico/disponibilidade');

    expect(await screen.findByRole('note')).toHaveTextContent(/conta de demonstração/);
    expect(screen.getByRole('switch', { name: 'Ativo: Segunda-feira' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Início da faixa 1 de segunda-feira' })).toBeDisabled();
    expect(saveButton()).toBeDisabled();
  });

  it('locks the schedule when the API refuses a protected account', async () => {
    serve(() => ({
      status: 403,
      body: {
        code: 'PROTECTED_ACCOUNT',
        message: 'Esta é uma conta de demonstração e não pode ser alterada.',
      },
    }));
    const { user } = renderApp('/medico/disponibilidade');
    const monday = await day('Segunda-feira');
    await user.click(monday.getByRole('switch', { name: 'Ativo: Segunda-feira' }));

    await user.click(saveButton());

    expect(await screen.findByRole('note')).toHaveTextContent(/conta de demonstração/);
    await waitFor(() => expect(saveButton()).toBeDisabled());
    expect(monday.getByRole('switch', { name: 'Ativo: Segunda-feira' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('explains when the account has no doctor profile', async () => {
    serveApi(['doctor'], {
      [PATH]: () => ({ status: 404, body: { code: 'NOT_FOUND', message: 'Sem perfil.' } }),
    });
    renderApp('/medico/disponibilidade');

    expect(await screen.findByText(/ainda não tem perfil médico/)).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});
