import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp, serveApi, type MockResponse } from '@/test/render-app';
import { ExamResultView } from '@components/exam-results/ExamResultView';
import type { ResultItem } from '@components/exam-results/ResultVersion';
import type { ExamResult } from '@lib/api/models';

const PAGE = '/paciente/exames/b1/resultado';

const version = (overrides: Partial<ExamResult['current']> = {}): ExamResult['current'] => ({
  version: 1,
  status: 'final',
  issuedAt: '2030-01-11T15:00:00.000Z',
  receivedAt: '2030-01-11T15:01:00.000Z',
  items: [
    {
      name: 'Hemoglobina',
      value: 13.8,
      unit: 'g/dL',
      referenceRange: '12,0 a 16,0',
      flag: 'normal',
      range: null,
      about: null,
    },
    {
      name: 'Leucócitos',
      value: 3100,
      unit: '/mm³',
      referenceRange: '4.000 a 11.000',
      flag: 'low',
      range: null,
      about: null,
    },
    {
      name: 'Glicose',
      value: 130,
      unit: 'mg/dL',
      referenceRange: '70 a 99',
      flag: 'high',
      range: null,
      about: null,
    },
    {
      name: 'Potássio',
      value: 7.1,
      unit: 'mmol/L',
      referenceRange: null,
      flag: 'critical',
      range: null,
      about: null,
    },
  ],
  report: null,
  ...overrides,
});

const result = (overrides: Partial<ExamResult> = {}): ExamResult => ({
  booking: {
    id: 'b1',
    publicCode: 'EX-7F3K2Q',
    examType: { id: 'e1', name: 'Hemograma', kind: 'lab' },
    unit: { id: 'u1', name: 'Unidade Central', address: 'Rua das Flores, 123', phone: '+551133334444' },
    startsAt: '2030-01-10T13:00:00.000Z',
  },
  current: version(),
  previous: [],
  ...overrides,
});

const serve = (response: MockResponse) =>
  serveApi(['patient'], { '/api/patient/exam-results/b1': () => response });

afterEach(() => vi.restoreAllMocks());

const ranged = version({
  items: [
    {
      name: 'Hemoglobina',
      value: 13.8,
      unit: 'g/dL',
      referenceRange: '12,0 a 16,0',
      flag: 'normal',
      range: { low: 12, high: 16 },
      about: 'Proteína que carrega o oxigênio.',
    },
    {
      name: 'Leucócitos',
      value: 3100,
      unit: '/mm³',
      referenceRange: '4.000 a 11.000',
      flag: 'low',
      range: { low: 4000, high: 11000 },
      about: null,
    },
  ],
});

const items = () => within(screen.getByRole('region', { name: 'Itens do exame' })).getAllByRole('listitem');

describe('exam result', { timeout: 15_000 }, () => {
  it('shows the exam, when and where it was collected and the items with their indicators', async () => {
    serve({ status: 200, body: result() });
    renderApp(PAGE);

    expect(await screen.findByRole('heading', { level: 1, name: 'Hemograma' })).toBeVisible();
    expect(screen.getByText('Coletado em 10/01/2030 · Unidade Central')).toBeVisible();
    expect(screen.getByText('Emitido em 11/01/2030')).toBeVisible();
    expect(screen.queryByText(/Retificado/)).not.toBeInTheDocument();
    const rows = items();
    expect(rows.map((row) => row.querySelector('p')?.textContent)).toEqual([
      'Hemoglobina',
      'Leucócitos',
      'Glicose',
      'Potássio',
    ]);
    expect(rows.map((row) => row.lastElementChild?.textContent)).toEqual([
      'Normal',
      'Baixo',
      'Alto',
      'Crítico',
    ]);
    expect(within(rows[0] as HTMLElement).getByText('13,8')).toBeVisible();
    expect(within(rows[0] as HTMLElement).getByText('12,0 a 16,0')).toBeVisible();
    expect(within(rows[3] as HTMLElement).getByText('—')).toBeInTheDocument();
  });

  it('sums up the items out of the reference', async () => {
    serve({ status: 200, body: result() });
    renderApp(PAGE);

    const summary = await screen.findByRole('region', { name: 'Resumo do resultado' });
    expect(summary).toHaveTextContent('3 de 4 itens fora da referência');
    expect(summary).toHaveTextContent('Leucócitos baixo · Glicose alto · Potássio crítico');
    expect(within(summary).getByRole('img')).toHaveAccessibleName('1 normal, 1 baixo, 1 alto, 1 crítico');
  });

  it('tells when every item is inside the reference', async () => {
    serve({ status: 200, body: result({ current: version({ items: [ranged.items?.[0] as ResultItem] }) }) });
    renderApp(PAGE);

    const summary = await screen.findByRole('region', { name: 'Resumo do resultado' });
    expect(summary).toHaveTextContent('Todos os itens dentro da referência');
    expect(summary).toHaveTextContent('1 item analisado');
  });

  it('draws the numeric range and explains an item on demand', async () => {
    serve({ status: 200, body: result({ current: ranged }) });
    const { user } = renderApp(PAGE);

    expect(await screen.findByRole('img', { name: 'Referência de 12,0 a 16,0, valor normal' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Referência de 4.000 a 11.000, valor baixo' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'O que é Leucócitos?' })).not.toBeInTheDocument();
    const about = screen.getByRole('button', { name: 'O que é Hemoglobina?' });
    expect(about).toHaveAttribute('aria-expanded', 'false');

    await user.click(about);

    expect(about).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Proteína que carrega o oxigênio.')).toHaveAttribute(
      'id',
      about.getAttribute('aria-controls'),
    );
    await user.click(about);
    expect(screen.queryByText('Proteína que carrega o oxigênio.')).not.toBeInTheDocument();
  });

  it('clamps a value far outside the range and keeps an unusual reference text', async () => {
    serve({
      status: 200,
      body: result({
        current: version({
          items: [
            {
              name: 'Ferritina',
              value: 900,
              unit: 'ng/mL',
              referenceRange: '15 - 150',
              flag: 'high',
              range: { low: 15, high: 150 },
              about: null,
            },
          ],
        }),
      }),
    });
    renderApp(PAGE);

    const bar = await screen.findByRole('img', { name: 'Referência de 15 a 150, valor alto' });
    expect((bar.lastElementChild as HTMLElement).style.insetInlineStart).toBe('96%');
  });

  it('downloads the report as a PDF named after the exam code', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'], shouldAdvanceTime: true });
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:laudo');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const { calls } = serveApi(['patient'], {
      '/api/patient/exam-results/b1': () => ({ status: 200, body: result() }),
      '/api/patient/exam-results/b1/pdf': () => ({ status: 200, body: '%PDF' }),
    });
    const { user } = renderApp(PAGE);

    await user.click(await screen.findByRole('button', { name: 'Baixar laudo em PDF' }));

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('laudo-EX-7F3K2Q.pdf');
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:laudo');
    vi.useRealTimers();
    expect(calls.some((call) => call.url.pathname === '/api/patient/exam-results/b1/pdf')).toBe(true);
  });

  it('warns when the PDF cannot be generated', async () => {
    serveApi(['patient'], {
      '/api/patient/exam-results/b1': () => ({ status: 200, body: result() }),
      '/api/patient/exam-results/b1/pdf': () => ({ status: 500 }),
    });
    const { user } = renderApp(PAGE);

    await user.click(await screen.findByRole('button', { name: 'Baixar laudo em PDF' }));

    expect(await screen.findByText('Algo deu errado. Tente de novo em instantes.')).toBeVisible();
  });

  it('shows the imaging report, the amendment and the previous versions', async () => {
    const report = 'Fígado de dimensões normais.\n\nConclusão: exame sem alterações.';
    serve({
      status: 200,
      body: result({
        booking: { ...result().booking, examType: { id: 'e2', name: 'Ultrassom', kind: 'imaging' } },
        current: version({ version: 2, status: 'amended', items: null, report }),
        previous: [version({ items: null, report: 'Fígado aumentado.' })],
      }),
    });
    const { user } = renderApp(PAGE);

    expect(await screen.findByRole('heading', { level: 1, name: 'Ultrassom' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Laudo' })).toHaveTextContent('Retificado · versão 2');
    expect(screen.getByText('Fígado de dimensões normais.')).toBeVisible();
    expect(screen.getByText('Conclusão: exame sem alterações.')).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Resumo do resultado' })).not.toBeInTheDocument();
    expect(screen.getByText('Fígado aumentado.')).not.toBeVisible();

    await user.click(screen.getByText('Versões anteriores (1)'));

    expect(screen.getByRole('heading', { level: 2, name: 'Versão 1' })).toBeVisible();
    expect(screen.getByText('Fígado aumentado.')).toBeVisible();
  });

  it.each([
    [404, 'NOT_FOUND'],
    [400, 'VALIDATION_ERROR'],
  ])('explains a missing result (%i) and links back to the past bookings', async (status, code) => {
    serve({ status, body: { code, message: 'API', fields: {} } });
    renderApp(PAGE);

    expect(await screen.findByText('Resultado não encontrado')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Voltar para meus agendamentos' })).toHaveAttribute(
      'href',
      '/paciente/agendamentos?aba=realizados',
    );
    expect(screen.queryByRole('button', { name: 'Baixar laudo em PDF' })).not.toBeInTheDocument();
  });

  it('offers a retry when the result fails to load', async () => {
    serve({ status: 500 });
    renderApp(PAGE);

    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  });

  it('keeps every decimal and text values', async () => {
    serve({
      status: 200,
      body: result({
        current: version({
          items: [
            {
              name: 'TSH',
              value: 2.34567,
              unit: 'mUI/L',
              referenceRange: '0,4 a 4,0',
              flag: 'normal',
              range: null,
              about: null,
            },
            {
              name: 'Urina',
              value: 'Negativo',
              unit: null,
              referenceRange: null,
              flag: 'normal',
              range: null,
              about: null,
            },
          ],
        }),
      }),
    });
    renderApp(PAGE);

    expect(await screen.findByText('2,34567')).toBeVisible();
    expect(screen.getByText('0,4 a 4,0')).toBeVisible();
    expect(screen.getByText('Negativo')).toBeVisible();
  });

  it('nests the shared view headings under the given level', async () => {
    const user = userEvent.setup();
    render(
      <ExamResultView
        result={result({ current: version({ version: 2, status: 'amended' }), previous: [version()] })}
        headingLevel={3}
      />,
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Hemograma' })).toBeVisible();
    await user.click(screen.getByText('Versões anteriores (1)'));
    expect(screen.getByRole('heading', { level: 4, name: 'Versão 1' })).toBeVisible();
  });
});
