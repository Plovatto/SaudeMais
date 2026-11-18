import { describe, expect, it } from 'vitest';
import type { UserNotification } from '@lib/api/models';
import { notificationTarget, notificationText } from './notifications.pt-BR';

const STARTS_AT = '2030-07-19T18:30:00.000Z';

const notification = (
  type: UserNotification['type'],
  params: UserNotification['params'] = { startsAt: STARTS_AT },
): UserNotification => ({
  id: 'n1',
  type,
  params,
  bookingId: 'b1',
  readAt: null,
  createdAt: STARTS_AT,
});

describe('notification texts', () => {
  it.each<[string, UserNotification['params'], string]>([
    ['admin', { startsAt: STARTS_AT, cancelledByRole: 'admin' }, ' pela administração.'],
    ['patient', { startsAt: STARTS_AT, cancelledByRole: 'patient' }, ' pelo paciente.'],
    ['no role', { startsAt: STARTS_AT }, '15:30 foi cancelada.'],
    ['an unknown role', { startsAt: STARTS_AT, cancelledByRole: 'toString' }, '15:30 foi cancelada.'],
  ])('names who cancelled with %s', (_case, params, ending) => {
    expect(notificationText(notification('appointment_cancelled', params)).body.endsWith(ending)).toBe(true);
  });

  it('leaves out a missing or invalid date', () => {
    expect(notificationText(notification('appointment_confirmed', { startsAt: 'x' })).body).toBe(
      'Sua consulta foi confirmada pelo médico.',
    );
    expect(notificationText(notification('appointment_requested', {})).body).toBe(
      'Há um pedido de consulta aguardando sua confirmação.',
    );
  });

  it('uses the account name for a new user', () => {
    expect(notificationText(notification('user_registered', { fullName: 'Ana Maria Silva' })).body).toBe(
      'Ana Maria Silva criou uma conta no Saúde+.',
    );
  });

  it('falls back to a generic text for an unknown type', () => {
    expect(notificationText(notification('brand_new' as UserNotification['type']))).toEqual({
      title: 'Novo aviso',
      body: 'Você recebeu um novo aviso.',
    });
  });
});

describe('notification targets', () => {
  it.each<[UserNotification['type'], 'patient' | 'doctor' | 'admin', string]>([
    ['appointment_confirmed', 'patient', '/paciente/agendamentos'],
    ['appointment_cancelled', 'patient', '/paciente/agendamentos?aba=realizados'],
    ['appointment_expired', 'patient', '/paciente/agendamentos?aba=realizados'],
    ['exam_result_available', 'patient', '/paciente/exames/b1/resultado'],
    ['appointment_requested', 'doctor', '/medico/agenda?aba=consultas&situacao=a-confirmar'],
    ['appointment_rescheduled', 'doctor', '/medico/agenda?aba=consultas&situacao=a-confirmar'],
    ['appointment_cancelled_by_patient', 'doctor', '/medico/agenda?aba=consultas&situacao=historico'],
    ['appointment_cancelled', 'doctor', '/medico/agenda?aba=consultas&situacao=historico'],
    ['user_registered', 'admin', '/admin/usuarios'],
    ['brand_new' as UserNotification['type'], 'doctor', '/medico'],
  ])('opens %s for the %s at %s', (type, role, target) => {
    expect(notificationTarget(notification(type), role)).toBe(target);
  });

  it('falls back to the past bookings for a result without a booking', () => {
    expect(notificationTarget({ ...notification('exam_result_available'), bookingId: null }, 'patient')).toBe(
      '/paciente/agendamentos?aba=realizados',
    );
  });
});
