import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { apiFetch } from '@lib/api/api-fetch';
import { endSession } from './session';

export function useSignOut(): () => Promise<void> {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await apiFetch('post', '/api/users/logout').catch(() => undefined);
    endSession('signed-out');
    queryClient.clear();
    await navigate('/login', { replace: true });
  };
}
