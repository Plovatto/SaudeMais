import { useEffect, useRef, useState } from 'react';
import { PERIOD_PRESETS, presetPeriod } from '@components/reports/report-periods';
import type { Period } from '@components/reports/reports-api';
import { Button, Card, Input, RadioChips } from '@components/ui';
import type { FieldErrors } from '@lib/api/api-error';
import { usePeriod } from './usePeriod';

const REVERSED_MESSAGE = 'A data final deve ser igual ou posterior à inicial.';

interface CustomPeriodProps {
  period: Period;
  errors: FieldErrors;
  onApply: (period: Period) => void;
}

function CustomPeriodForm({ period, errors, onApply }: CustomPeriodProps) {
  const [draft, setDraft] = useState(period);
  const [reversed, setReversed] = useState(false);
  const toError = reversed ? REVERSED_MESSAGE : errors['to'];
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (errors['from']) fromRef.current?.focus();
    else if (toError) toRef.current?.focus();
  }, [errors, toError]);

  return (
    <form
      noValidate
      aria-label="Período personalizado"
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        const invalid = draft.from !== '' && draft.to !== '' && draft.from > draft.to;
        setReversed(invalid);
        if (!invalid) onApply(draft);
      }}
    >
      <Input
        ref={fromRef}
        type="date"
        label="De"
        value={draft.from}
        error={errors['from']}
        onChange={(event) => {
          setReversed(false);
          setDraft({ ...draft, from: event.target.value });
        }}
        className="sm:flex-1"
      />
      <Input
        ref={toRef}
        type="date"
        label="Até"
        value={draft.to}
        error={toError}
        onChange={(event) => {
          setReversed(false);
          setDraft({ ...draft, to: event.target.value });
        }}
        className="sm:flex-1"
      />
      <Button type="submit" variant="secondary" className="sm:mt-[1.875rem]">
        Aplicar
      </Button>
    </form>
  );
}

export function PeriodControls({ errors }: { errors: FieldErrors }) {
  const { period, preset, setPeriod } = usePeriod();
  return (
    <Card className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
      <RadioChips
        legend="Período"
        options={PERIOD_PRESETS}
        value={preset}
        onValueChange={(value) => setPeriod(presetPeriod(value), { replace: true })}
      />
      <CustomPeriodForm
        key={`${period.from}|${period.to}`}
        period={period}
        errors={errors}
        onApply={(next) => setPeriod(next)}
      />
    </Card>
  );
}
