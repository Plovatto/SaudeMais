import { FLAG_ORDER, flagCount, flags } from '@components/exam-results/result-flags';
import type { ResultItem } from '@components/exam-results/ResultVersion';
import { cx } from '@lib/cx';
import { flagDot } from './flag-colors';

export function ResultSummary({ items }: { items: ResultItem[] }) {
  const off = items.filter((item) => item.flag !== 'normal');
  const legend = FLAG_ORDER.map((flag) => ({
    flag,
    count: items.filter((item) => item.flag === flag).length,
  }))
    .filter(({ count }) => count > 0)
    .map(({ flag, count }) => ({ flag, text: flagCount(flag, count) }));

  return (
    <section
      aria-label="Resumo do resultado"
      className="rounded-card border-border bg-surface shadow-card motion-safe:animate-rise flex flex-col items-stretch gap-3.5 border px-5 py-[18px] sm:flex-row sm:items-center sm:gap-6 sm:px-[22px]"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-text text-[0.96875rem] font-[650]">
          {off.length > 0
            ? `${off.length} de ${items.length} ${items.length === 1 ? 'item' : 'itens'} fora da referência`
            : 'Todos os itens dentro da referência'}
        </p>
        <p className="text-text-secondary mt-0.5 text-[0.8125rem]">
          {off.length > 0
            ? off.map((item) => `${item.name} ${flags[item.flag].label.toLowerCase()}`).join(' · ')
            : `${items.length} ${items.length === 1 ? 'item analisado' : 'itens analisados'}`}
        </p>
      </div>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:max-w-[45%] sm:items-end">
        <div
          role="img"
          aria-label={legend.map(({ text }) => text).join(', ')}
          className="flex w-full gap-[3px] sm:justify-end"
        >
          {items.map((item, index) => (
            <i
              key={`${index}-${item.name}`}
              className={cx(
                'motion-safe:animate-fade h-1.5 min-w-1 flex-1 rounded-full sm:max-w-[34px]',
                flagDot[item.flag],
              )}
            />
          ))}
        </div>
        <div aria-hidden className="text-text-secondary flex gap-3.5 text-xs tabular-nums">
          {legend.map(({ flag, text }) => (
            <span key={flag} className="inline-flex items-center gap-[5px]">
              <i className={cx('size-2 rounded-full', flagDot[flag])} />
              {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
