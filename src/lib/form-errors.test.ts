import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@lib/api/api-error';
import { applyApiErrors } from './form-errors';

type Values = { email: string; phone: string };

describe('applyApiErrors', () => {
  it('puts each known field error on its field and focuses only the first one', () => {
    const setError = vi.fn();
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos.', {
      email: 'E-mail inválido.',
      phone: 'Telefone inválido.',
    });

    const alert = applyApiErrors<Values>(error, setError, ['email', 'phone']);

    expect(alert).toBeNull();
    expect(setError).toHaveBeenNthCalledWith(
      1,
      'email',
      { message: 'E-mail inválido.' },
      { shouldFocus: true },
    );
    expect(setError).toHaveBeenNthCalledWith(
      2,
      'phone',
      { message: 'Telefone inválido.' },
      { shouldFocus: false },
    );
  });

  it('shows the message of a field the form does not have instead of a generic text', () => {
    const setError = vi.fn();
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos.', {
      _root: 'Envie o nome ou o telefone.',
    });

    expect(applyApiErrors<Values>(error, setError, ['email', 'phone'])).toBe('Envie o nome ou o telefone.');
    expect(setError).not.toHaveBeenCalled();
  });

  it('falls back to the text for the error code when there are no field errors', () => {
    const error = new ApiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');

    expect(applyApiErrors<Values>(error, vi.fn(), ['email'])).toBeTruthy();
  });
});
