
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

export const LOCAL_STORAGE_AUTH_KEY = 'salesAppAuthState';
export const LOCAL_STORAGE_SALES_KEY = 'salesAppData';
export const LOCAL_STORAGE_SETTINGS_KEY = 'salesAppSettings'; // Nova constante

// Constantes para cookies de autenticação
export const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 dias em segundos
export const EXPIRE_COOKIE_STRING = 'Thu, 01 Jan 1970 00:00:00 GMT'; // Data no passado para expirar cookies
