import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Pagination } from './Pagination';
import { paginationRange } from './pagination-range';
import { Popover } from './Popover';
import { Switch } from './Switch';
import { TabPanel, Tabs } from './Tabs';
import { TOAST_DURATION_MS, ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

describe('Button', () => {
  it('blocks clicks while loading, keeps focus and says it is loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Entrar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Entrar, Carregando' });
    button.focus();
    await user.click(button);

    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveFocus();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not submit forms unless asked to', () => {
    render(<Button>Cancelar</Button>);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute('type', 'button');
  });
});

describe('Switch', () => {
  it('reports its state and toggles', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [on, setOn] = useState(false);
      return <Switch checked={on} onCheckedChange={setOn} label="Segunda-feira ativa" />;
    }
    render(<Harness />);
    const toggle = screen.getByRole('switch', { name: 'Segunda-feira ativa' });

    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Tabs', () => {
  function Harness() {
    const [tab, setTab] = useState<'confirmadas' | 'pendentes' | 'historico'>('confirmadas');
    return (
      <>
        <Tabs
          id="agenda"
          label="Agenda"
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'confirmadas', label: 'Confirmadas' },
            { value: 'pendentes', label: 'A confirmar' },
            { value: 'historico', label: 'Histórico' },
          ]}
        />
        <TabPanel tabsId="agenda" value={tab}>
          Conteúdo {tab}
        </TabPanel>
      </>
    );
  }

  it('links the selected tab to its panel', () => {
    render(<Harness />);

    expect(screen.getByRole('tab', { name: 'A confirmar' })).not.toHaveAttribute('aria-controls');

    expect(screen.getByRole('tab', { name: 'Confirmadas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Confirmadas' })).toHaveTextContent('Conteúdo confirmadas');
  });

  it('keeps a single tab stop and moves with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    expect(screen.getByRole('tab', { name: 'Confirmadas' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'A confirmar' })).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Histórico' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteúdo historico');

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Confirmadas' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Pagination', () => {
  it.each([
    [1, 5, [1, 2, 3, 4, 5]],
    [2, 20, [1, 2, 3, 4, 5, 'gap', 20]],
    [10, 20, [1, 'gap', 9, 10, 11, 'gap', 20]],
    [19, 20, [1, 'gap', 16, 17, 18, 19, 20]],
  ])('shows a compact range around page %i of %i', (page, total, expected) => {
    expect(paginationRange(page, total)).toEqual(expected);
  });

  it('marks the current page and blocks moving past the edges without losing focus', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);
    const previous = screen.getByRole('button', { name: 'Página anterior' });

    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    await user.click(previous);
    expect(previous).toHaveFocus();
    expect(onPageChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Próxima página' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('treats a page past the end as the last page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={5} totalPages={2} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={() => undefined} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('Popover', () => {
  it('opens a labelled panel and closes with Escape, returning focus', async () => {
    const user = userEvent.setup();
    render(
      <Popover label="Notificações, 3 não lidas" title="Notificações" icon={<span />}>
        <p>Consulta confirmada</p>
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'Notificações, 3 não lidas' });

    await user.click(trigger);
    const panel = screen.getByRole('dialog', { name: 'Notificações' });
    expect(panel).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(panel).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe('Popover links', () => {
  it('closes when a link inside it is followed', async () => {
    const user = userEvent.setup();
    render(
      <Popover label="Notificações" title="Notificações" icon={<span />}>
        <a href="#agendados">Ver agendamento</a>
      </Popover>,
    );

    await user.click(screen.getByRole('button', { name: 'Notificações' }));
    await user.click(screen.getByRole('link', { name: 'Ver agendamento' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Toast', () => {
  function Trigger() {
    const { show } = useToast();
    return (
      <button type="button" onClick={() => show({ message: 'Consulta cancelada', tone: 'success' })}>
        Cancelar consulta
      </button>
    );
  }

  it('announces the message in a live region and hides it after a while', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar consulta' }));
    expect(screen.getByRole('status')).toHaveTextContent('Consulta cancelada');

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    vi.useRealTimers();
  });

  it('waits while the pointer is over it', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar consulta' }));
    const toast = screen.getByText('Consulta cancelada').closest('div');
    if (toast) fireEvent.pointerEnter(toast);
    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS * 2);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Sucesso: Consulta cancelada');
    vi.useRealTimers();
  });

  it('keeps errors until they are closed and announces them as alerts', () => {
    vi.useFakeTimers();
    function ErrorTrigger() {
      const { show } = useToast();
      return (
        <button type="button" onClick={() => show({ message: 'Não foi possível salvar', tone: 'danger' })}>
          Salvar
        </button>
      );
    }
    render(
      <ToastProvider>
        <ErrorTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS * 3);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Erro: Não foi possível salvar');
    vi.useRealTimers();
  });

  it('can be dismissed right away', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar consulta' }));
    await user.click(screen.getByRole('button', { name: 'Fechar aviso' }));

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('requires the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Trigger />)).toThrow(/ToastProvider/);
    vi.restoreAllMocks();
  });
});
