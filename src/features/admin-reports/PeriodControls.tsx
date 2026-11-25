import { useEffect, useRef, useState } from 'react';
import {
  MAX_REPORT_DAYS,
  PERIOD_PRESETS,
  REPORT_YEARS_BACK,
  reportLimits,
} from '@components/reports/report-periods';
import type { Period } from '@components/reports/reports-api';
import { Button, Card, Input, RadioChips } from '@components/ui';
import type { FieldErrors } from '@lib/api/api-error';
import { daysBetween, isDateWithin, type DateLimits } from '@lib/date';
import { usePeriod } from './usePeriod';

const REVERSED_MESSAGE = 'A data final deve ser igual ou posterior à inicial.';
const OUT_OF_RANGE_MESSAGE = `Escolha uma data dos últimos ${REPORT_YEARS_BACK} anos até 1 ano à frente.`;
const TOO_LONG_MESSAGE = `Escolha um período de no máximo ${MAX_REPORT_DAYS} dias.`;

type Draft = { from: string; to: string };
type DraftErrors = Partial<Record<keyof Draft, string>>;

function validate({ from, to }: Draft, limits: DateLimits): DraftErrors {
  const issues: DraftErrors = {};
  if (from !== '' && !isDateWithin(from, limits)) issues.from = OUT_OF_RANGE_MESSAGE;
  if (to !== '' && !isDateWithin(to, limits)) issues.to = OUT_OF_RANGE_MESSAGE;
  if (issues.from || issues.to || from === '' || to === '') return issues;
  if (from > to) return { to: REVERSED_MESSAGE };
  if (daysBetween(from, to) >= MAX_REPORT_DAYS) return { to: TOO_LONG_MESSAGE };
  return issues;
}

interface CustomPeriodProps {
  period: Period;
  errors: FieldErrors;
  onApply: (period: Period) => void;
}

function CustomPeriodForm({ period, errors, onApply }: CustomPeriodProps) {
  const [draft, setDraft] = useState(period);
  const [issues, setIssues] = useState<DraftErrors>({});
  const limits = reportLimits();
  const fromError = issues.from ?? errors['from'];
  const toError = issues.to ?? errors['to'];
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (fromError) fromRef.current?.focus();
    else if (toError) toRef.current?.focus();
  }, [fromError, toError]);

  return (
    <form
      noValidate
      aria-label="Período personalizado"
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        const found = validate(draft, limits);
        setIssues(found);
        if (!found.from && !found.to) onApply(draft);
      }}
    >
      <Input
        ref={fromRef}
        type="date"
        label="De"
        value={draft.from}
        {...limits}
        error={fromError}
        onChange={(event) => {
          setIssues({});
          setDraft({ ...draft, from: event.target.value });
        }}
        className="sm:flex-1"
      />
      <Input
        ref={toRef}
        type="date"
        label="Até"
        value={draft.to}
        {...limits}
        error={toError}
        onChange={(event) => {
          setIssues({});
          setDraft({ ...draft, to: event.target.value });
        }}
        className="sm:flex-1"
      />
      <Button
        type="submit"
        variant="secondary"
        className="sm:mt-[1.59375rem] sm:min-h-[50px] lg:min-h-[42px]"
      >
        Aplicar
      </Button>
    </form>
  );
}

export function PeriodControls({ errors }: { errors: FieldErrors }) {
  const { period, preset, setPreset, setPeriod } = usePeriod();
  return (
    <Card className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
      <RadioChips legend="Período" options={PERIOD_PRESETS} value={preset} onValueChange={setPreset} />
      <CustomPeriodForm
        key={`${period.from}|${period.to}`}
        period={period}
        errors={errors}
        onApply={(next) => setPeriod(next)}
      />
    </Card>
  );
}
