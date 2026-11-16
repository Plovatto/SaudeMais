import { areas } from './areas';

export const RESULTS_WINDOW_DAYS = 30;

export interface ResultsLinkState {
  patientName: string;
}

export const resultsLink = ({ id, fullName }: { id: string; fullName: string }) => ({
  to: `${areas.doctor.base}/pacientes/${id}/exames`,
  state: { patientName: fullName } satisfies ResultsLinkState,
});
