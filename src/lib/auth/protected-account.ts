import { ApiError } from '@lib/api/api-error';

export function handleProtectedAccount(onProtected: () => void, resetForm: () => void) {
  return (error: unknown) => {
    if (!(error instanceof ApiError) || error.code !== 'PROTECTED_ACCOUNT') return false;
    onProtected();
    resetForm();
    return true;
  };
}
