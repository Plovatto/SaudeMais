import { describe, expect, it } from 'vitest';
import { ApiError } from '@lib/api/api-error';
import { errorMessage, GENERIC_ERROR_MESSAGE } from './errors.pt-BR';

describe('errorMessage', () => {
  it('chooses the text by the error code', () => {
    expect(errorMessage(new ApiError(409, 'EMAIL_TAKEN', 'Email already registered'))).toBe(
      'Este e-mail já está cadastrado.',
    );
    expect(errorMessage(new ApiError(0, 'NETWORK_ERROR', ''))).toBe(
      'Não foi possível conectar. Verifique sua internet e tente de novo.',
    );
  });

  it('falls back to the API message for codes it does not know', () => {
    expect(errorMessage(new ApiError(422, 'SLOT_TAKEN', 'Este horário acabou de ser ocupado.'))).toBe(
      'Este horário acabou de ser ocupado.',
    );
  });

  it('uses a generic text when there is nothing better', () => {
    expect(errorMessage(new ApiError(400, 'UNKNOWN_ERROR', ''))).toBe(GENERIC_ERROR_MESSAGE);
    expect(errorMessage(new Error('boom'))).toBe(GENERIC_ERROR_MESSAGE);
  });
});
