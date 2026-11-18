import type { ReactNode } from 'react';
import { Brand, brandSurface } from '@components/layout/Brand';
import { PageTitle } from '@components/layout/PageTitle';
import { ThemeMenu } from '@components/layout/ThemeMenu';
import { areas, DEFAULT_ROLE } from '@constants/areas';
import { cx } from '@lib/cx';

export interface AuthArt {
  title: string;
  text: string;
}

export interface AuthScreenProps {
  art: AuthArt;
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}

export function AuthScreen({ art, title, subtitle, children }: AuthScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div
        className={cx(brandSurface, 'flex flex-col gap-10 px-6 py-7 lg:flex-[1_1_520px] lg:px-12 lg:py-10')}
      >
        <div className="flex items-center justify-between gap-3">
          <Brand icon={areas[DEFAULT_ROLE].icon} subtitle="Clínica integrada" />
          <ThemeMenu brand />
        </div>
        <div className="motion-safe:animate-fade mt-auto flex max-w-[420px] flex-col gap-3">
          <p className="text-[2rem] leading-[1.15] font-bold tracking-[-0.02em] text-balance">{art.title}</p>
          <p className="text-white/80">{art.text}</p>
        </div>
      </div>
      <div className="bg-surface grid flex-1 place-items-center content-start px-6 py-10 lg:flex-[1_1_480px] lg:content-center">
        <div className="motion-safe:animate-rise flex w-full max-w-[400px] flex-col gap-5">
          <header className="flex flex-col gap-2.5">
            <PageTitle className="text-[1.625rem] font-[650] tracking-[-0.025em]">{title}</PageTitle>
            <p className="text-text-secondary text-[0.9375rem]">{subtitle}</p>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
