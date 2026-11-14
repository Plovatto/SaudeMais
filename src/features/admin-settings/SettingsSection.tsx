import { useId, type ReactNode, type RefObject } from 'react';

export interface SettingsSectionProps {
  title: string;
  description: string;
  action?: ReactNode;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  children: ReactNode;
}

export function SettingsSection({ title, description, action, headingRef, children }: SettingsSectionProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} ref={headingRef} tabIndex={-1} className="text-text text-lg font-semibold">
            {title}
          </h2>
          <p className="text-text-secondary text-sm">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
