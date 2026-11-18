import { useEffect } from 'react';

export function useReportSubmitting(submitting: boolean, onSubmittingChange: (submitting: boolean) => void) {
  useEffect(() => {
    onSubmittingChange(submitting);
    return () => onSubmittingChange(false);
  }, [submitting, onSubmittingChange]);
}
