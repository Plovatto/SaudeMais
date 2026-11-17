export const VISIT_TYPES = ['first_visit', 'routine', 'follow_up', 'exam_review'] as const;

export const visitTypeLabels: Record<(typeof VISIT_TYPES)[number], string> = {
  first_visit: 'Primeira consulta',
  routine: 'Rotina',
  follow_up: 'Retorno',
  exam_review: 'Avaliação de exames',
};

export const visitTypeHints: Record<(typeof VISIT_TYPES)[number], string> = {
  first_visit: 'Primeira vez com este médico',
  routine: 'Acompanhamento periódico',
  follow_up: 'Volta depois de uma consulta recente',
  exam_review: 'Mostrar resultados ao médico',
};
