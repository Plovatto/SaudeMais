import { ApiError } from '@lib/api/api-error';

export const isProtectedAccount = (error: unknown) =>
  error instanceof ApiError && error.code === 'PROTECTED_ACCOUNT';

export function handleProtectedAccount(onProtected: () => void, resetForm: () => void) {
  return (error: unknown) => {
    if (!isProtectedAccount(error)) return false;
    onProtected();
    resetForm();
    return true;
  };
}
