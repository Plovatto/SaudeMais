import { useEffect, useRef, useState } from 'react';
import { Button, Input, RadioChips } from '@components/ui';
import type { FieldErrors } from '@lib/api/api-error';
import type { Period } from './reports-api';
import { PRESETS, presetPeriod, usePeriod } from './usePeriod';

interface CustomPeriodProps {
  period: Period;
  errors: FieldErrors;
  onApply: (period: Period) => void;
}

function CustomPeriodForm({ period, errors, onApply }: CustomPeriodProps) {
  const [draft, setDraft] = useState(period);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (errors['from']) fromRef.current?.focus();
    else if (errors['to']) toRef.current?.focus();
  }, [errors]);

  return (
    <form
      noValidate
      aria-label="Período personalizado"
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft);
      }}
    >
      <Input
        ref={fromRef}
        type="date"
        label="De"
        value={draft.from}
        error={errors['from']}
        onChange={(event) => setDraft({ ...draft, from: event.target.value })}
        className="sm:flex-1"
      />
      <Input
        ref={toRef}
        type="date"
        label="Até"
        value={draft.to}
        error={errors['to']}
        onChange={(event) => setDraft({ ...draft, to: event.target.value })}
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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
      <RadioChips
        legend="Período"
        options={PRESETS}
        value={preset}
        onValueChange={(value) => setPeriod(presetPeriod(value))}
      />
      <CustomPeriodForm
        key={`${period.from}|${period.to}`}
        period={period}
        errors={errors}
        onApply={setPeriod}
      />
    </div>
  );
}
