
export const DEFAULT_LOGIN_CREDENTIALS = {
  username: 'ENGEAR',
  password: '1313',
};

export const EMAIL_RECOVERY_ADDRESS = 'pastaengear@gmail.com';

export const SELLERS = ['SERGIO', 'RODRIGO'] as const;
export type Seller = (typeof SELLERS)[number];
export const ALL_SELLERS_OPTION = 'EQUIPE COMERCIAL';

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

export const STATUS_OPTIONS = ["Á INICAR", "EM ANDAMENTO", "FINALIZADO", "CANCELADO"] as const;
export type StatusOption = (typeof STATUS_OPTIONS)[number];

// Novas Constantes para Propostas
export const PROPOSAL_STATUS_OPTIONS = ["Pendente", "Enviada", "Em Negociação", "Aceita", "Recusada", "Cancelada"] as const;
export type ProposalStatusOption = (typeof PROPOSAL_STATUS_OPTIONS)[number];

export const CONTACT_SOURCE_OPTIONS = ["E-mail", "Telefone", "Presencial", "Indicação", "Website", "Outro"] as const;
export type ContactSourceOption = (typeof CONTACT_SOURCE_OPTIONS)[number];

export const FOLLOW_UP_DAYS_OPTIONS = [
  { label: 'Não agendar', value: 0 },
  { label: '5 dias', value: 5 },
  { label: '10 dias', value: 10 },
  { label: '15 dias', value: 15 },
] as const;
export type FollowUpDaysOptionValue = (typeof FOLLOW_UP_DAYS_OPTIONS)[number]['value'];

export const PROPOSAL_NOTIFICATION_EMAILS = [
  'carlosroberto@engearpb.com.br',
  'gitana@engearpb.com.br',
  'sergio@engearpb.com.br',
  'rodrigobarros@engearpb.com.br',
  'vendas@engearpb.com.br',
  'pastaengear@gmail.com',
] as const;


export const LOCAL_STORAGE_AUTH_KEY = 'salesAppAuthState';
export const LOCAL_STORAGE_SALES_KEY = 'salesAppData';
export const LOCAL_STORAGE_SETTINGS_KEY = 'salesAppSettings';
export const LOCAL_STORAGE_QUOTES_KEY = 'salesAppQuotesData';
export const LOCAL_STORAGE_SELECTED_SELLER_KEY = 'salesAppSelectedSeller';

// Constantes para cookies de autenticação
export const COOKIE_AUTH_FLAG = 'salesAppAuthFlag'; // Cookie para o middleware
export const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 dias em segundos
export const EXPIRE_COOKIE_STRING = 'Thu, 01 Jan 1970 00:00:00 GMT'; // Data no passado para expirar cookies
export const SESSION_STORAGE_LOGIN_FLAG = 'salesAppJustLoggedIn';
