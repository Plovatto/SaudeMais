import { DEFAULT_ROLE } from '@constants/areas';
import { Logo } from './Logo';
import { APP_NAME } from './route-handle';

const TRACE_PATH = 'M0 100H612l12-8 12 8h20l10-62 14 120 12-58h16l12-10 16 10H1690.18';

const backdrop =
  'bg-[radial-gradient(120%_85%_at_50%_40%,#1aa6a5_0%,#0d7a7c_36%,#075154_72%,#043a3c_100%)] dark:bg-[radial-gradient(110%_80%_at_50%_40%,#17393a_0%,#12201f_55%,#0f191a_100%)]';

const ecgPaper =
  'pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.07)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.07)_1px,transparent_1px)] bg-size-[28px_28px] [mask-image:radial-gradient(ellipse_55%_50%_at_50%_42%,black,transparent)]';

const traceMask = '[mask-image:linear-gradient(90deg,transparent,black_18%,black_82%,transparent)]';

function HeartbeatTrace() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1600 200"
      preserveAspectRatio="xMidYMid slice"
      className={`${traceMask} pointer-events-none absolute top-1/2 left-1/2 h-50 w-screen -translate-x-1/2 -translate-y-1/2`}
    >
      <path
        d={TRACE_PATH}
        stroke="#fff"
        strokeOpacity="0.28"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
      <path
        d={TRACE_PATH}
        pathLength="1"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="0.05 1"
        vectorEffect="non-scaling-stroke"
        fill="none"
        className="motion-safe:animate-sweep drop-shadow-[0_0_6px_rgb(190_255_245)] motion-reduce:hidden"
      />
    </svg>
  );
}

function ProgressRing() {
  return (
    <svg aria-hidden viewBox="0 0 160 160" className="absolute inset-0 -rotate-90">
      <circle cx="80" cy="80" r="77" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.5" />
      <circle
        cx="80"
        cy="80"
        r="77"
        pathLength="1"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.85"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="1"
        className="motion-safe:animate-progress"
      />
    </svg>
  );
}

export function SplashScreen() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      data-role={DEFAULT_ROLE}
      className={`${backdrop} relative isolate grid min-h-dvh place-items-center overflow-hidden text-white`}
    >
      <div aria-hidden className={`${ecgPaper} motion-safe:animate-reveal`} />
      <div className="flex flex-col items-center gap-10">
        <div className="relative grid size-40 place-items-center">
          <HeartbeatTrace />
          <ProgressRing />
          <span className="motion-safe:animate-logo-in relative grid size-32 place-items-center">
            <span
              aria-hidden
              className="motion-safe:animate-pulse-ring absolute inset-0 rounded-full border-2 border-white/70 opacity-0"
            />
            <span className="motion-safe:animate-heartbeat grid size-full place-items-center rounded-full bg-white text-[#0b7174] shadow-[0_0_0_6px_rgb(255_255_255/0.12),0_0_70px_6px_rgb(143_240_224/0.35),0_30px_50px_-24px_rgb(2_30_32/0.8)] dark:bg-[#e6f4f2] dark:text-[#0d6b6d]">
              <Logo className="w-16" />
            </span>
          </span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <p aria-hidden className="flex text-5xl leading-none font-semibold tracking-[-0.035em] sm:text-6xl">
            {[...APP_NAME].map((letter, index) => (
              <span
                key={index}
                style={{ animationDelay: `${450 + index * 55}ms` }}
                className="motion-safe:animate-reveal inline-block"
              >
                {letter}
              </span>
            ))}
          </p>
          <p
            style={{ animationDelay: '950ms' }}
            className="motion-safe:animate-reveal text-base text-white/75"
          >
            Sua saúde, seus horários.
          </p>
        </div>
      </div>
    </div>
  );
}
