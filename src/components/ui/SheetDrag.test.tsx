import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SHEET_QUERY } from '@hooks/useSheetDrag';
import { stubMatchMedia } from '../../test/match-media';
import { Dialog } from './Dialog';
import { SheetMore } from './SheetMore';

const MIN = 300;
const NATURAL = 520;

function mockGeometry(natural: number) {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    if (!(this instanceof HTMLDialogElement)) return 0;
    if (this.style.height) return parseFloat(this.style.height);
    return this.dataset.sheet === 'full' ? natural : MIN;
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const height = this.style.height ? parseFloat(this.style.height) : MIN;
    return { height } as DOMRect;
  });
}

function renderSheet(onClose = vi.fn()) {
  render(
    <Dialog open onClose={onClose} title="Detalhes" placement="sheet" bare>
      <button type="button">Primeiro</button>
      <SheetMore>Antes de ir</SheetMore>
    </Dialog>,
  );
  return {
    onClose,
    dialog: screen.getByRole('dialog', { name: 'Detalhes' }),
    grab: screen.getByRole('separator'),
  };
}

function drag(grab: HTMLElement, from: number, to: number) {
  fireEvent.pointerDown(grab, { clientY: from, button: 0, pointerId: 1 });
  fireEvent.pointerMove(grab, { clientY: to, pointerId: 1 });
  fireEvent.pointerUp(grab, { clientY: to, pointerId: 1 });
}

describe('draggable sheet', () => {
  beforeEach(() => {
    stubMatchMedia((query) => query === SHEET_QUERY);
    mockGeometry(NATURAL);
    class TestPointerEvent extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
      }
    }
    vi.stubGlobal('PointerEvent', TestPointerEvent);
    Object.assign(HTMLElement.prototype, { setPointerCapture: () => undefined });
  });

  afterEach(() => vi.restoreAllMocks());

  it('exposes a labelled horizontal separator without taking the initial focus', () => {
    const { grab } = renderSheet();
    expect(grab).toHaveAccessibleName('Arraste para ajustar a altura');
    expect(grab).toHaveAttribute('aria-orientation', 'horizontal');
    expect(grab).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: 'Primeiro' })).toHaveFocus();
  });

  it('opens at its natural height with the extras hidden', () => {
    const { dialog } = renderSheet();
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    expect(dialog).toHaveAttribute('data-grow', 'true');
  });

  it('is only closable when there is nothing more to show', () => {
    mockGeometry(MIN + 10);
    const { dialog } = renderSheet();
    expect(dialog).toHaveAttribute('data-grow', 'false');
  });

  it('does not render the handle outside mobile widths or on other placements', () => {
    stubMatchMedia(() => false);
    const { unmount } = render(
      <Dialog open onClose={() => undefined} title="Desktop" placement="sheet" bare>
        <p>texto</p>
      </Dialog>,
    );
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    unmount();
  });

  it('expands and collapses with the arrow keys and closes from the collapsed state', async () => {
    const user = userEvent.setup();
    const { dialog, grab, onClose } = renderSheet();
    grab.focus();
    await user.keyboard('{ArrowUp}');
    expect(grab).toHaveAttribute('aria-valuenow', '100');
    expect(dialog).toHaveAttribute('data-sheet', 'full');
    expect(dialog.style.height).toBe(`${NATURAL}px`);
    await user.keyboard('{ArrowDown}');
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    expect(dialog.style.height).toBe(`${MIN}px`);
    expect(onClose).not.toHaveBeenCalled();
    await user.keyboard('{ArrowDown}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores ArrowUp when the sheet cannot grow', async () => {
    mockGeometry(MIN + 10);
    const user = userEvent.setup();
    const { dialog, grab } = renderSheet();
    grab.focus();
    await user.keyboard('{ArrowUp}');
    expect(dialog).toHaveAttribute('data-sheet', 'min');
  });

  it('snaps to full when dragged up past the threshold and back to min when dragged less', () => {
    const { dialog, grab } = renderSheet();
    drag(grab, 500, 380);
    expect(dialog).toHaveAttribute('data-sheet', 'full');
    expect(dialog.style.height).toBe(`${NATURAL}px`);
    drag(grab, 400, 600);
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    drag(grab, 500, 480);
    expect(dialog).toHaveAttribute('data-sheet', 'min');
    expect(dialog.style.height).toBe(`${MIN}px`);
  });

  it('toggles on a tap', () => {
    const { dialog, grab } = renderSheet();
    drag(grab, 500, 500);
    expect(dialog).toHaveAttribute('data-sheet', 'full');
    drag(grab, 500, 502);
    expect(dialog).toHaveAttribute('data-sheet', 'min');
  });

  it('translates while pulled down and closes past the threshold', () => {
    const { dialog, grab, onClose } = renderSheet();
    fireEvent.pointerDown(grab, { clientY: 400, button: 0 });
    fireEvent.pointerMove(grab, { clientY: 440 });
    expect(dialog.style.transform).toBe('translateY(40px)');
    fireEvent.pointerUp(grab, { clientY: 440 });
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog.style.transform).toBe('');
    drag(grab, 400, 520);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
