import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render-app';

import {
  actions,
  appointment,
  confirmed,
  counts,
  FUTURE,
  home,
  HOME,
  LIST,
  openComplete,
  PAST,
  posts,
  serve,
  unrecorded,
} from './doctor-fixtures';

const NOW = '2030-01-10T12:42:00.000Z';
const EARLY = '2030-01-10T11:00:00.000Z';
const STARTED = '2030-01-10T12:00:00.000Z';
const AFTERNOON = '2030-01-10T17:00:00.000Z';
const TOMORROW = '2030-01-11T13:00:00.000Z';
const SERVER_ERROR = { status: 500, body: { code: 'INTERNAL_ERROR', message: 'x' } };

const patient = (id: string, fullName: string) => ({ id, fullName, phone: null });

const region = (name: string) => screen.findByRole('region', { name });

type FetchMock = ReturnType<typeof serve>['fetchMock'];

const intercept = (
  fetchMock: FetchMock,
  matches: (url: string) => boolean,
  respond: () => Promise<Response>,
) => {
  const served = fetchMock.getMockImplementation();
  let active = true;
  fetchMock.mockImplementation((url, init) =>
    active && matches(url instanceof Request ? url.url : url.toString())
      ? respond()
      : (served?.(url, init) ?? Promise.reject(new Error('no api'))),
  );
  return () => {
    active = false;
  };
};

const serverError = () =>
  Promise.resolve(new Response(JSON.stringify(SERVER_ERROR.body), { status: SERVER_ERROR.status }));

const rows = (section: HTMLElement) => Array.from(section.querySelectorAll('li'), (item) => item.textContent);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('doctor home', { timeout: 15_000 }, () => {
  it('shows the next appointment, the shortcuts, both queues and the agenda of today', async () => {
    serve({
      homeData: home({
        pending: [appointment('a1', { startsAt: TOMORROW })],
        awaitingRecord: [unrecorded('a2', { patient: patient('p2', 'Beatriz Neves') })],
        counts: { ...counts, pending: 5, awaiting: 1 },
      }),
      lists: {
        confirmed: [confirmed('a3', { patient: patient('p3', 'Carlos Pereira'), visitType: 'follow_up' })],
      },
    });
    renderApp('/medico');

    const next = await screen.findByRole('button', { name: /^Próxima consulta/ });
    expect(next).toHaveTextContent('Hoje · 10:00');
    expect(next).toHaveTextContent('Carlos Pereira · Retorno');
    expect(next).toHaveTextContent('em 18 min');

    const shortcuts = screen.getByRole('navigation', { name: 'Atalhos' });
    expect(within(shortcuts).getByRole('link', { name: /Abrir agenda/ })).toHaveAttribute(
      'href',
      '/medico/agenda',
    );
    expect(within(shortcuts).getByRole('link', { name: /Horários de atendimento/ })).toHaveAttribute(
      'href',
      '/medico/disponibilidade',
    );

    const awaiting = await region('Aguardando registro');
    expect(within(awaiting).getByText('1 no total')).toBeInTheDocument();
    expect(within(awaiting).getByRole('button', { name: /^Beatriz Neves, ver detalhes/ })).toHaveTextContent(
      'Rotina · Sex, 10/01 às 10:00',
    );
    expect(within(awaiting).getByRole('button', { name: /^Não compareceu: Beatriz Neves/ })).toBeVisible();
    expect(within(awaiting).getByRole('button', { name: /^Concluir: Beatriz Neves/ })).toBeVisible();
    expect(within(awaiting).queryByRole('link', { name: 'Ver todos' })).not.toBeInTheDocument();

    const requests = await region('Pedidos a confirmar');
    expect(within(requests).getByText('5 no total')).toBeInTheDocument();
    expect(within(requests).getByRole('button', { name: /^Andreia Soares, ver detalhes/ })).toHaveTextContent(
      'Rotina · Sex, 11/01 às 10:00',
    );
    expect(within(requests).getByRole('button', { name: /^Recusar: Andreia Soares/ })).toBeVisible();
    expect(within(requests).getByRole('button', { name: /^Confirmar: Andreia Soares/ })).toBeVisible();
    expect(within(requests).getByRole('link', { name: 'Ver todos' })).toHaveAttribute(
      'href',
      '/medico/agenda?aba=consultas&situacao=a-confirmar',
    );

    const today = await region('Agenda de hoje');
    expect(within(today).getByRole('link', { name: 'Ver tudo' })).toHaveAttribute('href', '/medico/agenda');
  });

  it('shows placeholders while the home and the agenda load', async () => {
    const { fetchMock } = serve({});
    intercept(
      fetchMock,
      (url) => url.includes('/api/doctor/'),
      () => new Promise<Response>(() => undefined),
    );
    renderApp('/medico');

    expect(await region('Pedidos a confirmar')).toHaveAttribute('aria-busy', 'true');
    expect(await region('Agenda de hoje')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('button', { name: /^Próxima consulta/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Tudo confirmado')).not.toBeInTheDocument();
    expect(screen.queryByText('Sem consultas hoje.')).not.toBeInTheDocument();
  });

  it('shows the empty states when nothing is booked or waiting', async () => {
    serve({});
    renderApp('/medico');

    expect(await screen.findByText('Nenhuma consulta confirmada por vir')).toBeVisible();
    expect(screen.getByText('Veja a agenda dos próximos dias.')).toBeVisible();
    expect(await screen.findByText('Tudo confirmado')).toBeVisible();
    expect(screen.getByText('Novos pedidos de consulta aparecem aqui.')).toBeVisible();
    expect(await screen.findByText('Sem consultas hoje.')).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Aguardando registro' })).not.toBeInTheDocument();
    expect(within(await region('Agenda de hoje')).getByText('0 consultas')).toBeVisible();
  });

  it('shows a next appointment of another day without the countdown', async () => {
    serve({ lists: { confirmed: [confirmed('a1', { startsAt: TOMORROW })] } });
    renderApp('/medico');

    const next = await screen.findByRole('button', { name: /^Próxima consulta/ });
    expect(next).toHaveTextContent('Sex, 11/01 · 10:00');
    expect(next).not.toHaveTextContent(/em \d/);
  });

  it('asks the next appointment and the agenda of today from the São Paulo day', async () => {
    const { calls } = serve({});
    renderApp('/medico');

    await screen.findByText('Sem consultas hoje.');
    const queries = calls
      .filter((call) => call.url.pathname === LIST)
      .map(({ url }) => Object.fromEntries(url.searchParams));
    expect(queries).toEqual(
      expect.arrayContaining([
        { tab: 'confirmed', page: '1', pageSize: '1', from: '2030-01-10' },
        { tab: 'all', page: '1', pageSize: '50', from: '2030-01-10', to: '2030-01-10' },
      ]),
    );
  });

  it('lists today in order and puts the now line between past and upcoming appointments', async () => {
    serve({
      lists: {
        history: [
          confirmed('h3', {
            status: 'cancelled',
            startsAt: AFTERNOON,
            patient: patient('p9', 'Vanessa Ramos'),
          }),
          unrecorded('h2', { startsAt: STARTED, patient: patient('p2', 'Beatriz Neves') }),
          confirmed('h1', {
            status: 'completed',
            startsAt: EARLY,
            patient: patient('p1', 'Lúcia Fernandes'),
          }),
          confirmed('h0', { status: 'completed', startsAt: PAST, patient: patient('p0', 'Otávio Mendes') }),
        ],
        confirmed: [
          confirmed('c1', { startsAt: FUTURE, patient: patient('p3', 'Carlos Pereira') }),
          confirmed('c2', { startsAt: TOMORROW, patient: patient('p4', 'Fernanda Rocha') }),
        ],
        pending: [appointment('r1', { startsAt: AFTERNOON, patient: patient('p5', 'Paulo Oliveira') })],
      },
    });
    renderApp('/medico');

    const today = await region('Agenda de hoje');
    await within(today).findByText('4 consultas');
    expect(rows(today)).toEqual([
      expect.stringMatching(/^.*Lúcia Fernandes08:00 · RotinaConcluída$/),
      expect.stringMatching(/Beatriz Neves09:00 · RotinaAguardando registro$/),
      'Agora · 09:42',
      expect.stringMatching(/Carlos Pereira10:00 · RotinaConfirmado$/),
      expect.stringMatching(/Paulo Oliveira14:00 · RotinaA confirmar$/),
    ]);
  });

  it('puts the now line after the last appointment when the day is over', async () => {
    serve({
      lists: {
        history: [
          confirmed('h1', {
            status: 'completed',
            startsAt: EARLY,
            patient: patient('p1', 'Lúcia Fernandes'),
          }),
        ],
      },
    });
    renderApp('/medico');

    const today = await region('Agenda de hoje');
    await within(today).findByText('1 consulta');
    expect(rows(today)).toEqual([expect.stringMatching(/Lúcia Fernandes/), 'Agora · 09:42']);
  });

  it('opens the appointment detail from a row of today', async () => {
    serve({
      lists: {
        confirmed: [
          confirmed('c1', {
            notes: 'Trazer o hemograma de outubro.',
            patient: patient('p3', 'Carlos Pereira'),
          }),
        ],
      },
    });
    const { user } = renderApp('/medico');

    const today = await region('Agenda de hoje');
    await user.click(await within(today).findByRole('button', { name: /^Carlos Pereira/ }));

    const detail = within(screen.getByRole('dialog', { name: 'Detalhes da consulta' }));
    expect(detail.getByText('Hospital Central')).toBeVisible();
    expect(detail.getByText('Telefone indisponível')).toBeVisible();
    expect(detail.getByText('Trazer o hemograma de outubro.')).toBeVisible();
    expect(detail.getByRole('button', { name: /^Cancelar consulta: Carlos Pereira/ })).toBeVisible();
  });

  it('shows the error of the home with a retry that loads it again', async () => {
    const { fetchMock } = serve({
      homeData: home({ pending: [appointment('a1')], counts: { ...counts, pending: 1 } }),
    });
    const recover = intercept(fetchMock, (url) => url.endsWith(HOME), serverError);
    const { user } = renderApp('/medico');

    const requests = await region('Pedidos a confirmar');
    const retry = await within(requests).findByRole('button', { name: 'Tentar de novo' });
    recover();
    await user.click(retry);

    expect(await within(requests).findByRole('button', { name: /^Andreia Soares/ })).toBeVisible();
  });

  it('shows the error of the agenda of today with a retry', async () => {
    const { fetchMock } = serve({});
    const recover = intercept(fetchMock, (url) => url.includes('tab=all'), serverError);
    const { user } = renderApp('/medico');

    const today = await region('Agenda de hoje');
    const retry = await within(today).findByRole('button', { name: 'Tentar de novo' });
    recover();
    await user.click(retry);

    expect(await within(today).findByText('Sem consultas hoje.')).toBeVisible();
  });

  it('confirms a request with the start time it showed', async () => {
    const data = home({
      pending: [appointment('a1', { startsAt: TOMORROW })],
      counts: { ...counts, pending: 1 },
    });
    const { calls } = serve({
      homeData: data,
      action: () => {
        data.pending = [];
        data.counts = counts;
        return { status: 200, body: {} };
      },
    });
    const { user } = renderApp('/medico');

    const requests = await region('Pedidos a confirmar');
    await user.click(await within(requests).findByRole('button', { name: /^Confirmar: Andreia Soares/ }));

    expect(await screen.findByText('Consulta confirmada.')).toBeVisible();
    expect(posts(calls)[0]?.url.pathname).toBe('/api/appointments/a1/confirm');
    expect(posts(calls)[0]?.body).toEqual({ startsAt: TOMORROW });
    expect(await within(requests).findByText('Tudo confirmado')).toBeVisible();
    await waitFor(() => expect(requests).toHaveFocus());
  });

  it('refuses a request with a required reason', async () => {
    const data = home({
      pending: [appointment('a1', { startsAt: TOMORROW })],
      counts: { ...counts, pending: 1 },
    });
    const { calls } = serve({ homeData: data, action: () => ({ status: 200, body: {} }) });
    const { user } = renderApp('/medico');

    const requests = await region('Pedidos a confirmar');
    await user.click(await within(requests).findByRole('button', { name: /^Recusar: Andreia Soares/ }));
    const dialog = within(screen.getByRole('dialog', { name: 'Recusar pedido?' }));
    await user.click(dialog.getByRole('button', { name: 'Recusar pedido' }));
    expect(await dialog.findByText('Informe o motivo do cancelamento.')).toBeVisible();
    expect(posts(calls)).toHaveLength(0);

    await user.type(dialog.getByRole('textbox', { name: /Motivo/ }), 'Agenda cheia');
    await user.click(dialog.getByRole('button', { name: 'Recusar pedido' }));

    expect(await screen.findByText('Pedido recusado.')).toBeVisible();
    expect(posts(calls)[0]?.url.pathname).toBe('/api/appointments/a1/cancel');
    expect(posts(calls)[0]?.body).toEqual({ startsAt: TOMORROW, reason: 'Agenda cheia' });
  });

  it('completes an awaiting appointment with the metrics dialog', async () => {
    const { calls } = serve({
      homeData: home({ awaitingRecord: [unrecorded('a1')], counts: { ...counts, awaiting: 1 } }),
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp('/medico');

    const awaiting = await region('Aguardando registro');
    const dialog = await openComplete(user, within(awaiting));
    expect(dialog.getByRole('textbox', { name: 'Peso (kg)' })).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Concluir consulta' }));

    expect(await screen.findByText('Consulta concluída.')).toBeVisible();
    expect(posts(calls)[0]?.url.pathname).toBe('/api/appointments/a1/complete');
    expect(posts(calls)[0]?.body).toEqual({ startsAt: PAST });
  });

  it('asks before registering a no-show of an awaiting appointment', async () => {
    const { calls } = serve({
      homeData: home({ awaitingRecord: [unrecorded('a1')], counts: { ...counts, awaiting: 1 } }),
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp('/medico');

    const awaiting = await region('Aguardando registro');
    await user.click(within(awaiting).getByRole('button', { name: /^Não compareceu/ }));
    expect(posts(calls)).toHaveLength(0);
    const dialog = screen.getByRole('dialog', { name: 'Registrar falta?' });
    await user.click(within(dialog).getByRole('button', { name: 'Registrar falta' }));

    expect(await screen.findByText('Falta registrada.')).toBeVisible();
    expect(posts(calls)[0]?.url.pathname).toBe('/api/appointments/a1/no-show');
    expect(posts(calls)[0]?.body).toEqual({ startsAt: PAST });
  });

  it('shows only the outcomes the API allows in the queues', async () => {
    serve({
      homeData: home({
        pending: [appointment('a1', { actions: actions({ canConfirm: true }) })],
        awaitingRecord: [unrecorded('a2', { actions: actions({ canNoShow: true }) })],
        counts: { ...counts, pending: 1, awaiting: 1 },
      }),
    });
    renderApp('/medico');

    const requests = await region('Pedidos a confirmar');
    expect(within(requests).queryByRole('button', { name: /^Recusar/ })).not.toBeInTheDocument();
    const awaiting = await region('Aguardando registro');
    expect(within(awaiting).queryByRole('button', { name: /^Concluir/ })).not.toBeInTheDocument();
    expect(within(awaiting).getByRole('button', { name: /^Não compareceu/ })).toBeVisible();
  });

  it('shows the last notification above the home', async () => {
    serve({
      homeData: home({
        lastNotification: {
          id: 'n1',
          type: 'appointment_cancelled_by_patient',
          params: { startsAt: FUTURE },
          bookingId: 'a1',
          readAt: null,
          createdAt: NOW,
        },
      }),
    });
    renderApp('/medico');

    const notice = await screen.findByRole('link', { name: /Consulta cancelada pelo paciente/ });
    expect(notice).toHaveAttribute('href', '/medico/agenda?aba=consultas&situacao=historico');
  });
});
