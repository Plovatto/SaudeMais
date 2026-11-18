import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SHEET_QUERY } from '@hooks/useSheetDrag';
import { stubMatchMedia } from '../../test/match-media';
import { Dialog, type DialogProps } from './Dialog';
import { SheetMore } from './SheetMore';

const MIN = 300;
let natural = 520;
let resizeCallback: () => void = () => undefined;

function mockGeometry() {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    if (!(this instanceof HTMLDialogElement)) return 0;
    if (this.style.height) return parseFloat(this.style.height);
    return this.dataset.sheet === 'full' ? natural : MIN;
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return { height: this.style.height ? parseFloat(this.style.height) : MIN } as DOMRect;
  });
}

function Harness(props: Partial<DialogProps>) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Reabrir
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Detalhes" placement="sheet" bare {...props}>
        <button type="button">Primeiro</button>
        <SheetMore>Antes de ir</SheetMore>
      </Dialog>
    </>
  );
}

function renderSheet(props: Partial<DialogProps> = {}) {
  render(<Harness {...props} />);
  return { dialog: screen.getByRole('dialog', { name: 'Detalhes' }), grab: screen.getByRole('separator') };
}

const down = (grab: HTMLElement, clientY: number, pointerId = 1) =>
  fireEvent.pointerDown(grab, { clientY, button: 0, buttons: 1, pointerId });
const move = (grab: HTMLElement, clientY: number, pointerId = 1) =>
  fireEvent.pointerMove(grab, { clientY, buttons: 1, pointerId });
const up = (grab: HTMLElement, clientY: number, pointerId = 1) =>
  fireEvent.pointerUp(grab, { clientY, pointerId });

function drag(grab: HTMLElement, from: number, to: number) {
  down(grab, from);
  move(grab, to);
  up(grab, to);
}

describe('draggable sheet', () => {
  beforeEach(() => {
    natural = 520;
    stubMatchMedia((query) => query === SHEET_QUERY);
    mockGeometry();
    class TestPointerEvent extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
      }
    }
    vi.stubGlobal('PointerEvent', TestPointerEvent);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resizeCallback = callback;
        }
        observe = () => undefined;
        disconnect = () => undefined;
      },
    );
    const captured = new Set<number>();
    Object.assign(HTMLElement.prototype, {
      setPointerCapture: (id: number) => captured.add(id),
      hasPointerCapture: (id: number) => captured.has(id),
      releasePointerCapture: (id: number) => captured.delete(id),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, 'setPointerCapture');
    Reflect.deleteProperty(HTMLElement.prototype, 'hasPointerCapture');
    Reflect.deleteProperty(HTMLElement.prototype, 'releasePointerCapture');
  });

  it('exposes a labelled horizontal separator without taking the initial focus', () => {
    const { grab } = renderSheet();
    expect(grab).toHaveAccessibleName('Arraste para ajustar a altura');
    expect(grab).toHaveAttribute('aria-orientation', 'horizontal');
    expect(grab).toHaveAttribute('tabindex', '0');
    expect(grab).toHaveAttribute('aria-valuenow', '0');
    expect(grab).toHaveAttribute('aria-valuetext', 'Recolhido');
    expect(screen.getByRole('button', { name: 'Primeiro' })).toHaveFocus();
  });

  it('opens at its natural height with the extras hidden and expandable', () => {
    const { dialog } = renderSheet();
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    expect(dialog).toHaveAttribute('data-grow', 'true');
  });

  it('keeps the extras visible when the sheet cannot grow', () => {
    natural = MIN + 10;
    const { dialog } = renderSheet();
    expect(dialog).toHaveAttribute('data-grow', 'false');
  });

  it('ignores ArrowUp when the sheet cannot grow', async () => {
    natural = MIN + 10;
    const user = userEvent.setup();
    const { dialog, grab } = renderSheet();
    grab.focus();
    await user.keyboard('{ArrowUp}');
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    expect(grab).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders no handle on other placements or wider screens', () => {
    const { unmount } = render(<Harness placement="center" />);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    unmount();
    stubMatchMedia(() => false);
    render(<Harness />);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('expands and collapses with the arrow keys and closes from the collapsed state', async () => {
    const user = userEvent.setup();
    const { dialog, grab } = renderSheet();
    grab.focus();
    await user.keyboard('{ArrowUp}');
    expect(grab).toHaveAttribute('aria-valuenow', '100');
    expect(grab).toHaveAttribute('aria-valuetext', 'Expandido');
    expect(dialog).toHaveAttribute('data-sheet', 'full');
    expect(dialog.style.height).toBe('520px');
    await user.keyboard('{ArrowDown}');
    expect(grab).toHaveAttribute('aria-valuenow', '0');
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    expect(dialog.style.height).toBe(`${MIN}px`);
    expect(dialog).toHaveAttribute('open');
    await user.keyboard('{ArrowDown}');
    expect(dialog).not.toHaveAttribute('open');
  });

  it('resets to collapsed when closed and reopened', async () => {
    const user = userEvent.setup();
    const { dialog, grab } = renderSheet();
    grab.focus();
    await user.keyboard('{ArrowUp}');
    act(() => {
      (dialog as HTMLDialogElement).close();
    });
    await user.click(screen.getByRole('button', { name: 'Reabrir', hidden: true }));
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '0');
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    expect(dialog.style.height).toBe('');
  });

  it('snaps to full past the threshold and back to min otherwise', () => {
    const { dialog, grab } = renderSheet();
    drag(grab, 500, 380);
    expect(dialog).toHaveAttribute('data-sheet', 'full');
    expect(dialog.style.height).toBe('520px');
    drag(grab, 400, 600);
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    drag(grab, 500, 480);
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    expect(dialog.style.height).toBe(`${MIN}px`);
  });

  it('reveals the extras while dragging up', () => {
    const { dialog, grab } = renderSheet();
    down(grab, 500);
    move(grab, 480);
    expect(dialog).toHaveAttribute('data-sheet', 'full');
    expect(dialog).toHaveAttribute('data-dragging');
    move(grab, 520);
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    up(grab, 520);
    expect(dialog).not.toHaveAttribute('data-dragging');
  });

  it('toggles on a tap and does not count a wander that returns as a tap', () => {
    const { dialog, grab } = renderSheet();
    drag(grab, 500, 500);
    expect(dialog).toHaveAttribute('data-sheet', 'full');
    down(grab, 500);
    move(grab, 470);
    up(grab, 500);
    expect(dialog).toHaveAttribute('data-sheet', 'full');
    drag(grab, 500, 502);
    expect(dialog).toHaveAttribute('data-sheet', 'min');
  });

  it('translates while pulled down and closes past the threshold', () => {
    const { dialog, grab } = renderSheet();
    down(grab, 400);
    move(grab, 440);
    expect(dialog.style.transform).toBe('translateY(40px)');
    up(grab, 440);
    expect(dialog).toHaveAttribute('open');
    expect(dialog.style.transform).toBe('');
    drag(grab, 400, 520);
    expect(dialog).not.toHaveAttribute('open');
  });

  it('does not close a non-dismissible sheet when pulled down', () => {
    const { dialog, grab } = renderSheet({ dismissible: false });
    drag(grab, 400, 600);
    expect(dialog).toHaveAttribute('open');
    expect(dialog.style.transform).toBe('');
  });

  it('restores the previous state on pointercancel and never closes', () => {
    const { dialog, grab } = renderSheet();
    down(grab, 400);
    move(grab, 600);
    fireEvent.pointerCancel(grab, { clientY: 600, pointerId: 1 });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    expect(dialog.style.transform).toBe('');
    expect(dialog.style.height).toBe(`${MIN}px`);
    expect(dialog).not.toHaveAttribute('data-dragging');
  });

  it('ignores a second pointer while a drag is active', () => {
    const { dialog, grab } = renderSheet();
    down(grab, 500, 1);
    down(grab, 100, 2);
    move(grab, 100, 2);
    up(grab, 100, 2);
    expect(dialog).toHaveAttribute('data-dragging');
    move(grab, 380, 1);
    up(grab, 380, 1);
    expect(dialog).toHaveAttribute('data-sheet', 'full');
  });

  it('ignores moves once the buttons are released', () => {
    const { dialog, grab } = renderSheet();
    down(grab, 500);
    fireEvent.pointerMove(grab, { clientY: 300, buttons: 0, pointerId: 1 });
    expect(dialog.style.height).toBe(`${MIN}px`);
    up(grab, 500);
  });

  it('remeasures when the content or the viewport changes and keeps the expanded state', async () => {
    const user = userEvent.setup();
    const { dialog, grab } = renderSheet();
    grab.focus();
    await user.keyboard('{ArrowUp}');
    natural = 700;
    act(() => resizeCallback());
    expect(dialog.style.height).toBe('700px');
    expect(dialog).toHaveAttribute('data-sheet', 'full');
    natural = MIN + 10;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(dialog).toHaveAttribute('data-grow', 'false');
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    expect(grab).toHaveAttribute('aria-valuenow', '0');
    expect(dialog.style.height).toBe('');
  });
});
