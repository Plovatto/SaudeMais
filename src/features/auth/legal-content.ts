const TERMS_VERSION = '2026-11-13';

export interface LegalDocument {
  title: string;
  version: string;
  sections: { heading: string; paragraphs: string[] }[];
}

export const termsOfUse: LegalDocument = {
  title: 'Termos de uso',
  version: TERMS_VERSION,
  sections: [
    {
      heading: 'Sobre o Saúde+',
      paragraphs: [
        'O Saúde+ permite agendar consultas e exames e acompanhar resultados, com áreas para pacientes, médicos e administradores.',
        'O Saúde+ organiza agendamentos e avisos. Ele não substitui o atendimento médico nem serve para emergências.',
      ],
    },
    {
      heading: 'Uso da conta',
      paragraphs: [
        'Você é responsável pelos dados que informa e pela guarda da sua senha.',
        'Você pode encerrar suas sessões e alterar seus dados no perfil a qualquer momento.',
      ],
    },
    {
      heading: 'Disponibilidade',
      paragraphs: ['O serviço pode ficar temporariamente indisponível por manutenção ou atualização.'],
    },
  ],
};

export const privacyPolicy: LegalDocument = {
  title: 'Política de privacidade',
  version: TERMS_VERSION,
  sections: [
    {
      heading: 'Dados coletados',
      paragraphs: [
        'Guardamos nome, e-mail, telefone (opcional), a senha protegida por hash e os agendamentos que você fizer.',
        'Para manter sua sessão, registramos quando ela foi criada e usada, o navegador e o endereço IP.',
      ],
    },
    {
      heading: 'Uso dos dados',
      paragraphs: [
        'Os dados servem apenas para o funcionamento do serviço: entrar na conta, agendar e receber avisos dentro do app.',
        'Observações de agendamentos, motivos de cancelamento e resultados de exame nunca aparecem em registros técnicos.',
      ],
    },
    {
      heading: 'Seus direitos',
      paragraphs: [
        'Você pode ver e alterar seus dados no perfil e encerrar suas sessões a qualquer momento, conforme a Lei Geral de Proteção de Dados (LGPD).',
      ],
    },
  ],
};

export const analyticsSection: LegalDocument['sections'][number] = {
  heading: 'Medição de uso',
  paragraphs: [
    'Se você aceitar, usamos o Google Analytics e o Microsoft Clarity para entender como o Saúde+ é usado e melhorar o serviço. Eles usam cookies e coletam dados de navegação, como páginas visitadas, tipo de dispositivo e interações na tela.',
    'Sem a sua autorização, nenhuma dessas ferramentas é carregada. Você pode recusar ou mudar a escolha a qualquer momento, e ao recusar os cookies de medição são apagados.',
  ],
};
