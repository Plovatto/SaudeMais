import { useEffect, useRef } from 'react';
import { Button, TextLink } from '@components/ui';
import { useConsent } from '@hooks/useConsent';
import { analyticsEnabled } from '@lib/analytics';
import { decideConsent, type ConsentChoice } from '@lib/consent';

export function ConsentBanner() {
  const { asking, requests } = useConsent();
  const ref = useRef<HTMLElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const banner = ref.current;
    if (!banner || requests === 0) return;
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused !== document.body && !banner.contains(focused)) {
      returnTo.current = focused;
    }
    banner.focus();
  }, [requests]);

  if (!analyticsEnabled || !asking) return null;

  const decide = (choice: ConsentChoice) => {
    const target = returnTo.current?.isConnected ? returnTo.current : null;
    returnTo.current = null;
    decideConsent(choice);
    target?.focus({ preventScroll: true });
  };

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby="consent-title"
      className="bg-surface text-text border-border rounded-card shadow-overlay motion-safe:animate-rise fixed inset-x-4 bottom-4 z-[90] mx-auto flex max-w-[460px] flex-col gap-4 border p-5 focus-visible:outline-none lg:start-6 lg:end-auto lg:bottom-6 lg:mx-0"
    >
      <div className="flex flex-col gap-1.5">
        <p id="consent-title" className="text-[0.9375rem] font-semibold">
          Posso medir como o site é usado?
        </p>
        <p className="text-text-secondary text-sm leading-relaxed">
          Usamos o Google Analytics e o Microsoft Clarity para entender o uso e melhorar o Saúde+. Eles só
          funcionam se você aceitar, e você pode mudar de ideia quando quiser.{' '}
          <TextLink to="/privacidade">Política de privacidade</TextLink>
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2.5">
        <Button variant="secondary" onClick={() => decide('denied')}>
          Recusar
        </Button>
        <Button onClick={() => decide('granted')}>Aceitar</Button>
      </div>
    </section>
  );
}
