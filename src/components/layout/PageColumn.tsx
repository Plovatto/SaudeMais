import type { ReactNode } from 'react';

export function PageColumn({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[856px]">{children}</div>;
}
