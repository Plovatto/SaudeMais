import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Menu } from './Menu';

function setup() {
  const user = userEvent.setup();
  const onEdit = vi.fn();
  const onRemove = vi.fn();
  render(
    <>
      <Menu
        label="Ações de Ana Maria"
        items={[
          { label: 'Editar', onSelect: onEdit },
          { label: 'Tornar Médico', onSelect: () => undefined },
          { label: 'Remover', onSelect: onRemove, tone: 'danger' },
        ]}
      />
      <button type="button">Fora</button>
    </>,
  );
  const trigger = screen.getByRole('button', { name: 'Ações de Ana Maria' });
  return { user, onEdit, onRemove, trigger };
}

describe('Menu', () => {
  it('opens on click and focuses the first item', async () => {
    const { user, trigger } = setup();

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();
  });

  it('moves with the arrow keys, wrapping around, and jumps with Home and End', async () => {
    const { user, trigger } = setup();
    await user.click(trigger);

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Remover' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Remover' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();
  });

  it('opens on the last item with ArrowUp on the trigger', async () => {
    const { user, trigger } = setup();
    trigger.focus();

    await user.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitem', { name: 'Remover' })).toHaveFocus();
  });

  it('runs the chosen action, closes and returns focus to the trigger', async () => {
    const { user, trigger, onRemove } = setup();
    await user.click(trigger);

    await user.keyboard('{End}{Enter}');

    expect(onRemove).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes with Escape and returns focus to the trigger', async () => {
    const { user, trigger } = setup();
    await user.click(trigger);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes when clicking outside without running anything', async () => {
    const { user, trigger, onEdit } = setup();
    await user.click(trigger);

    await user.click(screen.getByRole('button', { name: 'Fora' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('closes when Tab leaves the menu', async () => {
    const { user, trigger } = setup();
    await user.click(trigger);

    await user.tab();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
