import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConnectionErrorPage } from './ErrorPages';

describe('ConnectionErrorPage', () => {
  it('explains the problem and retries on request', async () => {
    const onRetry = vi.fn();
    render(<ConnectionErrorPage onRetry={onRetry} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Não foi possível conectar' })).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
