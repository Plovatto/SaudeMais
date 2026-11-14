import { useState } from 'react';
import { LuCalendar, LuCheck } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import { ButtonLink, Card, Dialog } from '@components/ui';
import { areas } from '@constants/areas';
import { formatDateTime } from '@lib/date';
import { AppointmentForm } from './AppointmentForm';
import type { Appointment } from './booking-api';

const PATIENT = areas.patient.base;

const describe = ({ specialty, doctor, startsAt }: Appointment) =>
  `Consulta de ${specialty.name} com ${doctor.fullName} em ${formatDateTime(startsAt)}. Avisaremos quando o médico confirmar.`;

export function BookAppointmentPage() {
  const [booked, setBooked] = useState<Appointment | null>(null);
  return (
    <div className="mx-auto w-full max-w-[520px]">
      <PageHeader
        title="Agendar consulta"
        subtitle="Preencha os dados para a sua consulta"
        icon={<LuCalendar />}
        back
        backFallback={PATIENT}
      />
      <Card className="px-5 py-8 sm:px-8">
        <AppointmentForm onBooked={setBooked} />
      </Card>
      <Dialog
        open={booked !== null}
        onClose={() => setBooked(null)}
        title="Pedido enviado, aguardando confirmação"
        description={booked && describe(booked)}
        icon={<LuCheck />}
        centered
      >
        <ButtonLink to={`${PATIENT}/agendamentos`} className="min-w-48">
          Ver detalhes
        </ButtonLink>
      </Dialog>
    </div>
  );
}
