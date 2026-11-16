import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp, serveApi, type MockResponse } from '@/test/render-app';
import type { components } from '@lib/api/schema';

type ExamResult = components['schemas']['ExamResult'];

const PATIENT = '0190c2a0-0000-7000-8000-0000000000aa';
const PATH = `/api/doctor/patients/${PATIENT}/exam-results`;
const PAGE = `/medico/pacientes/${PATIENT}/exames`;
const NO_LINK =
  'Você só vê os resultados de um paciente com quem tem uma consulta de avaliação de exames confirmada ou concluída nos últimos 30 dias.';

const result = (id: string, name: string): ExamResult => ({
  booking: {
    id,
    publicCode: `EX-${id}`,
    examType: { id: `t-${id}`, name, kind: 'lab' },
    unit: { id: 'u1', name: 'Unidade Central', address: 'Rua das Flores, 123', phone: '+551133334444' },
    startsAt: '2026-11-10T11:00:00.000Z',
  },
  current: {
    version: 1,
    status: 'final',
    issuedAt: '2026-11-11T11:00:00.000Z',
    receivedAt: '2026-11-11T11:05:00.000Z',
    items: [
      { name: 'Hemoglobina', value: 13.8, unit: 'g/dL', referenceRange: '12,0 a 16,0', flag: 'normal' },
    ],
    report: null,
  },
  previous: [],
});

const serve = (respond: (url: URL) => MockResponse) =>
  serveApi(['doctor'], { [PATH]: (_method, _body, url) => respond(url) });

const page = (items: ExamResult[], total = items.length) => ({
  status: 200,
  body: { items, page: 1, pageSize: 10, total },
});

describe('patient results for the doctor', { timeout: 15_000 }, () => {
  it('lists the results of the patient with a generic title when opened directly', async () => {
    serve(() => page([result('b1', 'Hemograma'), result('b2', 'Glicemia')]));
    renderApp(PAGE);

    expect(await screen.findByText('2 resultados')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'Exames do paciente' })).toBeVisible();
    expect(screen.getByRole('button', { name: /^Hemograma/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /^Glicemia/ })).toBeVisible();
  });

  it('explains the missing link with a way back to the agenda', async () => {
    serve(() => ({ status: 403, body: { code: 'FORBIDDEN_NO_LINK', message: 'Sem vínculo.' } }));
    renderApp(PAGE);

    expect(await screen.findByText(NO_LINK)).toBeVisible();
    expect(screen.getByText('Sem acesso aos exames deste paciente')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Voltar para a agenda' })).toHaveAttribute(
      'href',
      '/medico/agenda',
    );
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).not.toBeInTheDocument();
  });

  it('paginates through the URL', async () => {
    const { calls } = serve(() => page([result('b1', 'Hemograma')], 25));
    const { user, router } = renderApp(PAGE);

    expect(await screen.findByText('25 resultados')).toBeVisible();
    await user.click(
      within(screen.getByRole('navigation', { name: 'Paginação' })).getByRole('button', { name: 'Página 2' }),
    );

    expect(router.state.location.search).toBe('?pagina=2');
    await waitFor(() => expect(calls.at(-1)?.url.searchParams.get('page')).toBe('2'));
    expect(calls.at(-1)?.url.searchParams.get('pageSize')).toBe('10');
  });

  it('shows an empty state when the patient has no results', async () => {
    serve(() => page([]));
    renderApp(PAGE);

    expect(await screen.findByText('Nenhum resultado de exame')).toBeVisible();
  });

  it('offers a retry when the results fail to load', async () => {
    serve(() => ({ status: 500, body: { code: 'INTERNAL_ERROR', message: 'x' } }));
    renderApp(PAGE);

    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  });
});
