import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MOTION_QUERY } from '@lib/motion';
import { stubMatchMedia } from '@/test/match-media';
import { Button } from './Button';
import { Pagination } from './Pagination';
import { paginationRange } from './pagination-range';
import { Popover } from './Popover';
import { SectionCard } from './SectionCard';
import { Switch } from './Switch';
import { TabPanel, Tabs } from './Tabs';
import { TOAST_DURATION_MS, TOAST_EXIT_MS, ToastProvider } from './ToastProvider';
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
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).not.toHaveAttribute('disabled');
    expect(button).toHaveFocus();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not submit its form while loading, by click or by Enter in a field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <input aria-label="E-mail" />
        <Button type="submit" loading>
          Entrar
        </Button>
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Entrar, Carregando' }));
    await user.type(screen.getByLabelText('E-mail'), 'a{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('stays natively disabled when it is also loading', () => {
    render(
      <Button disabled loading>
        Salvar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Salvar, Carregando' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
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

  it('marks itself busy without disabling and ignores clicks while saving', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} busy onCheckedChange={onCheckedChange} label="Segunda-feira ativa" />);
    const toggle = screen.getByRole('switch', { name: 'Segunda-feira ativa' });

    expect(toggle).toHaveAttribute('aria-busy', 'true');
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    expect(toggle).not.toHaveAttribute('disabled');
    await user.click(toggle);
    expect(onCheckedChange).not.toHaveBeenCalled();
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

  it('slides the line indicator under the selected tab', async () => {
    const offsets: Record<string, [number, number]> = { Hoje: [0, 60], Semana: [64, 80] };
    const box = (element: HTMLElement) => offsets[element.textContent] ?? [0, 0];
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
      return box(this)[0];
    });
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return box(this)[1];
    });
    function Line() {
      const [tab, setTab] = useState<'hoje' | 'semana'>('hoje');
      return (
        <Tabs
          id="periodo"
          label="Período"
          variant="line"
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'hoje', label: 'Hoje' },
            { value: 'semana', label: 'Semana' },
          ]}
        />
      );
    }
    const user = userEvent.setup();
    const { container } = render(<Line />);
    const indicator = () => container.querySelector('[data-tab-indicator]');

    expect(indicator()).toHaveStyle({ transform: 'translateX(0px) scaleX(60)' });
    expect(indicator()).not.toHaveClass('transition-transform');

    await user.click(screen.getByRole('tab', { name: 'Semana' }));
    expect(indicator()).toHaveStyle({ transform: 'translateX(64px) scaleX(80)' });
    expect(indicator()).toHaveClass('transition-transform');
    vi.restoreAllMocks();
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

  it('keeps an error visible when newer messages arrive', () => {
    function Burst() {
      const { show } = useToast();
      return (
        <button
          type="button"
          onClick={() => {
            show({ message: 'Falha ao salvar', tone: 'danger' });
            for (const n of [1, 2, 3, 4]) show({ message: `Aviso ${n}` });
          }}
        >
          Disparar
        </button>
      );
    }
    render(
      <ToastProvider>
        <Burst />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Disparar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao salvar');
    expect(screen.getByRole('status')).not.toHaveTextContent('Aviso 1');
    expect(screen.getByRole('status')).toHaveTextContent('Aviso 4');
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

  it('fades out before leaving when motion is allowed', async () => {
    stubMatchMedia((query) => query === MOTION_QUERY);
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar consulta' }));
    await user.click(screen.getByRole('button', { name: 'Fechar aviso' }));

    const toast = screen.getByText('Consulta cancelada').closest('div');
    expect(toast).toHaveAttribute('inert');
    expect(toast).toHaveClass('animate-fade-out');

    if (toast) fireEvent.animationEnd(toast);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('returns focus and still leaves when the exit animation never ends', () => {
    vi.useFakeTimers();
    stubMatchMedia((query) => query === MOTION_QUERY);
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'Cancelar consulta' });

    fireEvent.click(trigger);
    trigger.focus();
    const close = screen.getByRole('button', { name: 'Fechar aviso' });
    close.focus();
    fireEvent.click(close);

    expect(trigger).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Consulta cancelada');
    act(() => {
      vi.advanceTimersByTime(TOAST_EXIT_MS);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    vi.useRealTimers();
  });

  it('moves focus to the main content when the previous element is gone', async () => {
    function OneShot() {
      const { show } = useToast();
      const [sent, setSent] = useState(false);
      if (sent) return null;
      return (
        <button
          type="button"
          onClick={() => {
            show({ message: 'Consulta cancelada', tone: 'success' });
            setSent(true);
          }}
        >
          Cancelar consulta
        </button>
      );
    }
    const user = userEvent.setup();
    render(
      <>
        <main tabIndex={-1}>Conteúdo</main>
        <ToastProvider>
          <OneShot />
        </ToastProvider>
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar consulta' }));
    await user.click(screen.getByRole('button', { name: 'Fechar aviso' }));

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('requires the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Trigger />)).toThrow(/ToastProvider/);
    vi.restoreAllMocks();
  });
});

describe('SectionCard', () => {
  it('marks an optional section in the title and keeps a two-part action together', () => {
    render(
      <SectionCard
        title="Observação"
        optional
        action={
          <>
            <span>2 consultas</span>
            <a href="/agenda">Ver tudo</a>
          </>
        }
      >
        <p>Conteúdo</p>
      </SectionCard>,
    );

    expect(screen.getByRole('region', { name: 'Observação (opcional)' })).toBeVisible();
    expect(screen.getByText('(opcional)')).toHaveClass('font-normal');
    const count = screen.getByText('2 consultas');
    expect(count.parentElement).toContainElement(screen.getByRole('link', { name: 'Ver tudo' }));
    expect(count.parentElement).toHaveClass('shrink-0');
  });
});
