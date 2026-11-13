import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

function Harness({ onClose = () => undefined }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Agendar
      </button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
        title="Exame agendado!"
        description="Seu exame foi agendado com sucesso!"
      >
        <button type="button">Ver detalhes</button>
      </Dialog>
    </>
  );
}

async function openDialog() {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<Harness onClose={onClose} />);
  await user.click(screen.getByRole('button', { name: 'Agendar' }));
  return { user, onClose, dialog: screen.getByRole('dialog', { name: 'Exame agendado!' }) };
}

describe('Dialog', () => {
  it('opens as a labelled and described modal', async () => {
    const { dialog } = await openDialog();

    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAccessibleDescription('Seu exame foi agendado com sucesso!');
  });

  it('moves focus inside when it opens', async () => {
    const { dialog } = await openDialog();

    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it('closes from the close button and returns focus to what opened it', async () => {
    const { user, onClose, dialog } = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(dialog).not.toHaveAttribute('open');
    expect(screen.getByRole('button', { name: 'Agendar' })).toHaveFocus();
  });

  it('closes when the backdrop is clicked, but not when clicking its content', async () => {
    const { user, onClose, dialog } = await openDialog();

    await user.click(screen.getByText('Seu exame foi agendado com sucesso!'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(dialog);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('reports a native close, as triggered by the Escape key', async () => {
    const { onClose, dialog } = await openDialog();

    (dialog as HTMLDialogElement).close();

    expect(onClose).toHaveBeenCalledOnce();
  });
});
