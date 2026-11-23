import type { ReactNode } from 'react';
import { Logo } from '@components/layout/Logo';
import { PageTitle } from '@components/layout/PageTitle';
import { APP_NAME } from '@components/layout/route-handle';
import { ThemeToggle } from '@components/layout/ThemeToggle';
import { cx } from '@lib/cx';
import { PulseLine } from '@components/layout/PulseLine';
import { FloatingCards } from './AuthShowcase';
import { stagger } from './stagger';

export interface AuthArt {
  title: string;
  text: string;
}

export interface AuthScreenProps {
  art: AuthArt;
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

const authGradient =
  'bg-[linear-gradient(160deg,#0a5f61_0%,#0d7f82_40%,#17a5a8_75%,#25c3c6_100%)] lg:bg-[linear-gradient(160deg,#06403f_0%,#084f51_45%,#0b6c6f_100%)] dark:bg-(image:--brand-backdrop) dark:lg:bg-(image:--brand-backdrop)';

const blob = 'pointer-events-none absolute -z-10 rounded-full';

const ripple = 'absolute inset-0 rounded-full border border-white/50 motion-safe:animate-ripple';

export function AuthScreen({ art, title, subtitle, children, wide = false }: AuthScreenProps) {
  return (
    <div
      className={cx(
        authGradient,
        'relative isolate flex min-h-dvh flex-col overflow-hidden text-white [--focus:#fff] lg:flex-row',
      )}
    >
      <div
        aria-hidden
        className={cx(
          blob,
          'motion-safe:animate-drift-a -start-[15vmax] -top-[20vmax] size-[60vmax] bg-[radial-gradient(circle,rgb(127_240_227/0.4),transparent_65%)] dark:opacity-25',
        )}
      />
      <div
        aria-hidden
        className={cx(
          blob,
          'motion-safe:animate-drift-b -end-[20vmax] -bottom-[25vmax] size-[70vmax] bg-[radial-gradient(circle,rgb(255_255_255/0.3),transparent_62%)] dark:opacity-15',
        )}
      />
      <div
        aria-hidden
        className={cx(
          blob,
          'motion-safe:animate-drift-b start-[10vmax] -bottom-[10vmax] size-[45vmax] bg-[radial-gradient(circle,rgb(3_50_52/0.5),transparent_65%)]',
        )}
      />
      <div className="lg:[&_button]:!text-text-secondary lg:[&_button]:hover:!bg-surface-strong lg:[&_button]:hover:!text-text lg:[&_button[aria-expanded=true]]:!bg-surface-strong lg:[&_button[aria-expanded=true]]:!text-text absolute end-3 top-3 z-10 lg:end-6 lg:top-6">
        <ThemeToggle tone="brand-until-desktop" />
      </div>
      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center gap-8 px-4 pt-14 pb-8 sm:px-6 lg:contents">
        <section className="flex flex-col items-center gap-3 text-center lg:flex-1 lg:items-start lg:justify-center lg:gap-10 lg:px-16 lg:py-16 lg:text-start xl:px-24">
          <div
            style={stagger(0)}
            className="motion-safe:animate-enter flex flex-col items-center gap-6 lg:flex-row lg:gap-3.5"
          >
            <span
              style={stagger(150)}
              className="motion-safe:animate-logo-in relative grid size-20 place-items-center rounded-full border border-white/30 bg-white/12 shadow-[0_16px_32px_-16px_rgb(2_40_42/0.6)] backdrop-blur-md lg:size-12"
            >
              <span aria-hidden className={ripple} />
              <span aria-hidden style={{ animationDelay: '1.6s' }} className={ripple} />
              <Logo className="w-11 lg:w-7" />
            </span>
            <p className="text-[1.75rem] leading-none font-semibold tracking-[-0.03em] lg:text-2xl">
              {APP_NAME}
            </p>
          </div>
          <div className="flex max-w-[460px] flex-col gap-4">
            <p
              style={stagger(120)}
              className="motion-safe:animate-wipe max-w-[34ch] text-[0.9375rem] text-balance text-white/85 lg:max-w-none lg:text-[2.625rem] lg:leading-[1.1] lg:font-semibold lg:tracking-[-0.02em] lg:text-white"
            >
              {art.title}
            </p>
            <p
              style={stagger(220)}
              className="motion-safe:animate-enter hidden text-[1.0625rem] leading-relaxed text-white/80 lg:block"
            >
              {art.text}
            </p>
          </div>
          <div
            style={stagger(320)}
            className="motion-safe:animate-enter hidden w-full max-w-[420px] lg:block"
          >
            <PulseLine className="w-full" />
          </div>
          <div style={stagger(420)} className="motion-safe:animate-enter w-full">
            <FloatingCards />
          </div>
        </section>
        <div
          style={stagger(180)}
          className={cx(
            'motion-safe:animate-sheet-up lg:motion-safe:animate-panel bg-surface text-text relative mx-auto flex w-full max-w-[480px] min-w-0 flex-col justify-center rounded-[28px] px-6 py-11 shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_44px_80px_-36px_rgb(2_40_42/0.7),0_14px_28px_-14px_rgb(2_40_42/0.35)] ring-1 ring-white/50 [--focus:var(--role-strong)] sm:px-10 sm:py-12',
            'lg:mx-0 lg:min-h-dvh lg:w-[46%] lg:max-w-none lg:shrink-0 lg:rounded-none lg:py-16 lg:shadow-[-40px_0_90px_-40px_rgb(1_30_31/0.7)] lg:ring-0',
            wide ? 'lg:px-10 xl:px-12' : 'lg:px-14 xl:px-20',
          )}
        >
          <div
            className={cx(
              'auth-stagger mx-auto flex w-full min-w-0 flex-col gap-9 lg:max-w-[400px]',
              wide ? 'xl:max-w-[560px] xl:gap-7' : '',
            )}
          >
            <header className="flex flex-col gap-1.5 text-start">
              <PageTitle className="text-[2.375rem] leading-[1.1] font-extrabold tracking-[-0.035em] sm:text-[2.75rem]">
                {title}
              </PageTitle>
              <p className="text-text-secondary text-[0.9375rem]">{subtitle}</p>
            </header>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
