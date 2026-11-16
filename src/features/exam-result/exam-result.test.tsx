import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp, serveApi, type MockResponse } from '@/test/render-app';
import { ExamResultView } from '@components/exam-results/ExamResultView';
import type { ExamResult } from '@lib/api/models';

const PAGE = '/paciente/exames/b1/resultado';

const version = (overrides: Partial<ExamResult['current']> = {}): ExamResult['current'] => ({
  version: 1,
  status: 'final',
  issuedAt: '2030-01-11T15:00:00.000Z',
  receivedAt: '2030-01-11T15:01:00.000Z',
  items: [
    { name: 'Hemoglobina', value: 13.8, unit: 'g/dL', referenceRange: '12,0 a 16,0', flag: 'normal' },
    { name: 'Leucócitos', value: 3100, unit: '/mm³', referenceRange: '4.000 a 11.000', flag: 'low' },
    { name: 'Glicose', value: 130, unit: 'mg/dL', referenceRange: '70 a 99', flag: 'high' },
    { name: 'Potássio', value: 7.1, unit: 'mmol/L', referenceRange: null, flag: 'critical' },
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

describe('exam result', { timeout: 15_000 }, () => {
  it('shows the header and the items with their indicators', async () => {
    serve({ status: 200, body: result() });
    renderApp(PAGE);

    expect(await screen.findByRole('heading', { level: 2, name: 'Hemograma' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'Resultado do exame' })).toBeVisible();
    expect(screen.getByText('EX-7F3K2Q')).toBeVisible();
    expect(screen.getByText('10/01/2030, 10:00')).toBeVisible();
    expect(screen.getByText('Unidade Central')).toBeVisible();
    expect(screen.queryByText('Retificado')).not.toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Itens do exame' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Exame', 'Resultado', 'Referência', 'Indicador']);
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
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
    expect(within(rows[1] as HTMLElement).getByText('3.100')).toBeVisible();
    expect(within(rows[3] as HTMLElement).getByText('—')).toBeVisible();
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

    expect(await screen.findByRole('heading', { level: 2, name: 'Ultrassom' })).toBeVisible();
    expect(screen.getByText('Retificado')).toBeVisible();
    expect(screen.getByText('Versão 2')).toBeVisible();
    expect(screen.getByText('Fígado de dimensões normais.')).toBeVisible();
    expect(screen.getByText('Conclusão: exame sem alterações.')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Fígado aumentado.')).not.toBeVisible();

    await user.click(screen.getByText('Versões anteriores (1)'));

    expect(screen.getByRole('heading', { level: 3, name: 'Versão 1' })).toBeVisible();
    expect(screen.getByText('Fígado aumentado.')).toBeVisible();
  });

  it('prints the page', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    serve({ status: 200, body: result() });
    const { user } = renderApp(PAGE);

    await user.click(await screen.findByRole('button', { name: 'Imprimir' }));

    expect(print).toHaveBeenCalledOnce();
    expect(screen.getByText('Paciente: Ana Maria Silva')).toBeInTheDocument();
    expect(screen.getByText(/^Impresso em \d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: 'Imprimir' })).not.toBeInTheDocument();
  });

  it('offers a retry when the result fails to load', async () => {
    serve({ status: 500 });
    renderApp(PAGE);

    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  });

  it('keeps every decimal, text values and the narrow reference inside the result cell', async () => {
    serve({
      status: 200,
      body: result({
        current: version({
          items: [
            { name: 'TSH', value: 2.34567, unit: 'mUI/L', referenceRange: '0,4 a 4,0', flag: 'normal' },
            { name: 'Urina', value: 'Negativo', unit: null, referenceRange: null, flag: 'normal' },
          ],
        }),
      }),
    });
    renderApp(PAGE);

    const table = await screen.findByRole('table', { name: 'Itens do exame' });
    const [tsh, urine] = within(table).getAllByRole('row').slice(1);
    const tshResult = within(tsh as HTMLElement).getAllByRole('cell')[0] as HTMLElement;
    expect(within(tshResult).getByText('2,34567')).toBeVisible();
    expect(within(tshResult).getByText('Referência: 0,4 a 4,0')).toBeInTheDocument();
    expect(within(urine as HTMLElement).getByText('Negativo')).toBeVisible();
  });

  it('nests its headings under the given level', async () => {
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
