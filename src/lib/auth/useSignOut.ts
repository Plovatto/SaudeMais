import { useNavigate } from 'react-router';
import { apiFetch } from '@lib/api/api-fetch';
import { endSession, sessionToken } from './session';

export function useSignOut(): () => Promise<void> {
  const navigate = useNavigate();
  return async () => {
    const token = sessionToken();
    endSession('signed-out');
    const leaving = navigate('/login', { replace: true });
    if (token) await apiFetch('post', '/api/users/logout', { token }).catch(() => undefined);
    await leaving;
  };
}
