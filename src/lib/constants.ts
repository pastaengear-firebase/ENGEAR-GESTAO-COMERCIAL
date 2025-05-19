
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

export const AREA_OPTIONS = ['Norte', 'Sul', 'Leste', 'Oeste'] as const;
export type AreaOption = (typeof AREA_OPTIONS)[number];

export const STATUS_OPTIONS = ['Aberta', 'Ganha', 'Perdida'] as const;
export type StatusOption = (typeof STATUS_OPTIONS)[number];

export const PAYMENT_OPTIONS = ['À Vista', 'Parcelado', 'Financiado'] as const;
export type PaymentOption = (typeof PAYMENT_OPTIONS)[number];

export const LOCAL_STORAGE_AUTH_KEY = 'salesAppAuthState';
export const LOCAL_STORAGE_SALES_KEY = 'salesAppData';
