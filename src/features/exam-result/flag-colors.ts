import type { ResultItem } from '@components/exam-results/ResultVersion';

export const flagDot: Record<ResultItem['flag'], string> = {
  normal: 'bg-success-text',
  low: 'bg-warning-text',
  high: 'bg-danger',
  critical: 'bg-[color-mix(in_oklab,var(--danger)_65%,var(--text))]',
};
