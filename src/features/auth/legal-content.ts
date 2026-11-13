export const TERMS_VERSION = '2026-11-13';

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
        'O Saúde+ é um projeto de portfólio que demonstra o agendamento de consultas e exames para pacientes, médicos e administradores.',
        'Este é um ambiente de demonstração: não há atendimento médico real, e consultas, exames e resultados exibidos são fictícios.',
      ],
    },
    {
      heading: 'Uso da conta',
      paragraphs: [
        'Você é responsável pelos dados que informa e pela guarda da sua senha. Não cadastre dados reais de saúde nem de terceiros.',
        'As contas de demonstração são compartilhadas entre visitantes, não podem ser alteradas e têm os dados restaurados periodicamente.',
      ],
    },
    {
      heading: 'Disponibilidade',
      paragraphs: [
        'O serviço pode ficar fora do ar, ser alterado ou ter os dados apagados a qualquer momento, sem aviso.',
      ],
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
        'Os dados servem apenas para o funcionamento da demonstração: entrar na conta, agendar e receber avisos dentro do app.',
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
