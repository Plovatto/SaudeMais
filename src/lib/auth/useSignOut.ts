import { useNavigate } from 'react-router';
import { apiFetch } from '@lib/api/api-fetch';
import { endSession, sessionToken } from './session';

export function useSignOut(): (options?: { notifyServer?: boolean }) => Promise<void> {
  const navigate = useNavigate();
  return async ({ notifyServer = true } = {}) => {
    const token = sessionToken();
    endSession('signed-out');
    const leaving = navigate('/login', { replace: true });
    if (token && notifyServer) await apiFetch('post', '/api/users/logout', { token }).catch(() => undefined);
    await leaving;
  };
}
