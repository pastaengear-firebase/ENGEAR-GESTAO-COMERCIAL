
export const SELLERS = ['SERGIO', 'RODRIGO'] as const;
export type Seller = (typeof SELLERS)[number];
export const ALL_SELLERS_OPTION = 'EQUIPE COMERCIAL';

export const SELLER_EMAIL_MAP = {
  'sergio@engearpb.com.br': 'SERGIO',
  'rodrigobarros@engearpb.com.br': 'RODRIGO',
  'pastaengear@gmail.com': 'SERGIO',
} as const;

export const COMPANY_OPTIONS = ['ENGEAR', 'CLIMAZONE'] as const;
export type CompanyOption = (typeof COMPANY_OPTIONS)[number];

export const AREA_OPTIONS = [
  'INST. AC',
  'MANUT. AC',
  'PRÉ',
  'CI',
  'GÁS',
  'SAS',
  'AQG',
  'EXAUST',
  'LOCAÇÃO',
] as const;
export type AreaOption = (typeof AREA_OPTIONS)[number];

export const STATUS_OPTIONS = ["Á INICAR", "EM ANDAMENTO", "AGUARDANDO PAGAMENTO", "FINALIZADO", "CANCELADO"] as const;
export type StatusOption = (typeof STATUS_OPTIONS)[number];

export const PROPOSAL_STATUS_OPTIONS = ["Pendente", "Enviada", "Em Negociação", "Aceita", "Recusada", "Cancelada"] as const;
export type ProposalStatusOption = (typeof PROPOSAL_STATUS_OPTIONS)[number];

export const CONTACT_SOURCE_OPTIONS = ["E-mail", "Telefone", "Presencial", "Indicação", "Website", "Outro"] as const;
export type ContactSourceOption = (typeof CONTACT_SOURCE_OPTIONS)[number];

export const FOLLOW_UP_OPTIONS = [
  { label: 'Não agendar', value: '0' },
  { label: 'Em 5 dias', value: '5' },
  { label: 'Em 10 dias', value: '10' },
  { label: 'Em 15 dias', value: '15' },
  { label: 'Sequência (5, 15, 30 dias)', value: '5,15,30' },
  { label: 'Sequência (7, 30, 60 dias)', value: '7,30,60' },
] as const;
export type FollowUpOptionValue = (typeof FOLLOW_UP_OPTIONS)[number]['value'];

export const LOCAL_STORAGE_SELECTED_SELLER_KEY = 'salesAppSelectedSeller';
