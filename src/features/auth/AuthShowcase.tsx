import type { ReactNode } from 'react';
import { LuBell, LuCalendarCheck, LuCircleCheck } from 'react-icons/lu';
import { cx } from '@lib/cx';

const glass =
  'flex items-center gap-3 rounded-[18px] border border-white/25 bg-white/12 py-3 pe-5 ps-3 shadow-[0_20px_40px_-20px_rgb(2_40_42/0.6)] backdrop-blur-xl motion-safe:animate-float';

const slot = 'absolute motion-safe:animate-card-in';

function Tile({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-white text-xl text-[#0a6e70] shadow-[0_6px_14px_-6px_rgb(2_40_42/0.5)]">
      {children}
    </span>
  );
}

export function FloatingCards() {
  return (
    <div aria-hidden className="relative hidden h-[150px] w-full max-w-[440px] lg:block">
      <div className={cx(slot, 'start-0 top-0')} style={{ animationDelay: '900ms' }}>
        <div className={glass}>
          <Tile>
            <LuCalendarCheck />
          </Tile>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Consulta confirmada</p>
            <p className="text-xs text-white/75">Amanhã, 09:30</p>
          </div>
          <LuCircleCheck className="ms-2 text-lg text-emerald-200" />
        </div>
      </div>
      <div className={cx(slot, 'end-0 bottom-0')} style={{ animationDelay: '1150ms' }}>
        <div className={glass} style={{ animationDelay: '-3.5s' }}>
          <Tile>
            <LuBell />
          </Tile>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Resultado disponível</p>
            <p className="text-xs text-white/75">Veja no seu perfil</p>
          </div>
        </div>
      </div>
    </div>
  );
}
