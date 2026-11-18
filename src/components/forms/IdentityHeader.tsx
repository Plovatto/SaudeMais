import type { ReactNode } from 'react';
import { Avatar } from '@components/ui';

interface IdentityHeaderProps {
  name: string;
  seed: string;
  detail: ReactNode;
}

export function IdentityHeader({ name, seed, detail }: IdentityHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} seed={seed} size="lg" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-text truncate text-sm font-semibold">{name}</p>
        <p className="text-text-secondary text-[0.8125rem]">{detail}</p>
      </div>
    </div>
  );
}
