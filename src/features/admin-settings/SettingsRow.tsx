import type { ReactNode } from 'react';
import { Card, StatusChip, type StatusChipProps } from '@components/ui';

export interface SettingsRowProps {
  name: string;
  details: ReactNode;
  status: string;
  tone: StatusChipProps['tone'];
  children: ReactNode;
}

export function SettingsRow({ name, details, status, tone, children }: SettingsRowProps) {
  return (
    <Card variant="outlined" className="flex flex-wrap items-center gap-3">
      <div className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
        <p className="text-text font-semibold break-words">{name}</p>
        <div className="text-text-secondary text-sm break-words">{details}</div>
      </div>
      <StatusChip tone={tone}>{status}</StatusChip>
      {children}
    </Card>
  );
}
