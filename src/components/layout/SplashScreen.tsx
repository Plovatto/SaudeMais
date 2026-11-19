import { DEFAULT_ROLE } from '@constants/areas';
import { Logo } from './Logo';
import { PulseLine } from './PulseLine';
import { APP_NAME } from './route-handle';

const splashGradient =
  'bg-[linear-gradient(170deg,#0a5f61_0%,#0d7f82_38%,#17a5a8_72%,#5fd0d1_100%)] dark:bg-[linear-gradient(170deg,#031516_0%,#07302f_42%,#0a4f51_78%,#1b7f81_100%)]';

const blob = 'pointer-events-none absolute -z-10 rounded-full';

const ring = 'absolute inset-0 rounded-full border border-white/45 motion-safe:animate-ripple';

export function SplashScreen() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      data-role={DEFAULT_ROLE}
      className={`${splashGradient} relative isolate grid min-h-dvh place-items-center overflow-hidden text-white`}
    >
      <div
        aria-hidden
        className={`${blob} motion-safe:animate-drift-a -start-[15vmax] -top-[20vmax] size-[60vmax] bg-[radial-gradient(circle,rgb(127_240_227/0.4),transparent_65%)]`}
      />
      <div
        aria-hidden
        className={`${blob} motion-safe:animate-drift-b -end-[20vmax] -bottom-[25vmax] size-[70vmax] bg-[radial-gradient(circle,rgb(255_255_255/0.32),transparent_62%)]`}
      />
      <div className="flex flex-col items-center gap-9">
        <div className="relative grid size-40 place-items-center sm:size-44">
          <span aria-hidden className={ring} />
          <span aria-hidden style={{ animationDelay: '1.1s' }} className={ring} />
          <span aria-hidden style={{ animationDelay: '2.2s' }} className={ring} />
          <span
            aria-hidden
            className="motion-safe:animate-halo absolute inset-3 rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.35),transparent_70%)]"
          />
          <span className="motion-safe:animate-logo-in relative grid size-28 place-items-center rounded-full border border-white/35 bg-white/14 shadow-[0_24px_48px_-20px_rgb(2_40_42/0.7)] backdrop-blur-md sm:size-32">
            <Logo className="motion-safe:animate-beat w-14 drop-shadow-[0_6px_16px_rgb(0_0_0/0.25)] sm:w-16" />
          </span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <p
            aria-hidden
            className="flex text-[2.25rem] leading-none font-semibold tracking-[-0.03em] sm:text-5xl"
          >
            {[...APP_NAME].map((letter, index) => (
              <span
                key={index}
                style={{ animationDelay: `${700 + index * 70}ms` }}
                className="motion-safe:animate-enter inline-block"
              >
                {letter}
              </span>
            ))}
          </p>
          <p
            style={{ animationDelay: '1400ms' }}
            className="motion-safe:animate-enter text-[0.9375rem] text-white/80"
          >
            Sua saúde, seus horários.
          </p>
        </div>
        <PulseLine className="w-[min(78vw,360px)]" />
      </div>
      <div className="absolute inset-x-0 bottom-[max(2.5rem,env(safe-area-inset-bottom))] grid place-items-center">
        <span className="h-1 w-32 overflow-hidden rounded-full bg-white/20">
          <span className="motion-safe:animate-fill block h-full origin-left rounded-full bg-white/90" />
        </span>
      </div>
    </div>
  );
}
