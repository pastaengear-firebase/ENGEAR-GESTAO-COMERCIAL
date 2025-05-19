
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

// PAYMENT_OPTIONS e PaymentOption foram removidos, pois o campo será um valor numérico.

export const LOCAL_STORAGE_AUTH_KEY = 'salesAppAuthState';
export const LOCAL_STORAGE_SALES_KEY = 'salesAppData';
