
import type { Seller, AreaOption, StatusOption, CompanyOption } from './constants';
import type { ALL_SELLERS_OPTION } from './constants'; // Import específico


export interface Sale {
  id: string;
  seller: Seller;
  date: string; // ISO string
  company: CompanyOption;
  project: string;
  os: string;
  area: AreaOption;
  clientService: string;
  salesValue: number;
  status: StatusOption;
  payment: number;
  createdAt: number; // timestamp
  updatedAt?: number; // timestamp
}

export interface User {
  username: string;
}

export type AuthenticatedState = {
  isAuthenticated: true;
  user: User;
}
export type UnauthenticatedState = {
  isAuthenticated: false;
  user: null;
}
export type AuthState = AuthenticatedState | UnauthenticatedState;

export type AuthContextType = AuthState & {
  login: (username: string, token?: string) => void;
  logout: () => void;
  loading: boolean;
};

export type SalesFilters = {
  searchTerm?: string;
  selectedYear?: number | 'all';
};

export type SalesContextType = {
  sales: Sale[];
  filteredSales: Sale[];
  selectedSeller: Seller | typeof ALL_SELLERS_OPTION;
  setSelectedSeller: (seller: Seller | typeof ALL_SELLERS_OPTION) => void;
  addSale: (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => Sale;
  updateSale: (id: string, saleData: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>) => Sale | undefined;
  deleteSale: (id: string) => void;
  getSaleById: (id: string) => Sale | undefined;
  setFilters: (filters: Partial<SalesFilters>) => void;
  filters: SalesFilters;
  loading: boolean;
};

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: (pathname: string) => boolean;
};

// Tipos para Configurações
export interface AppSettings {
  enableEmailNotifications: boolean;
  notificationEmails: string[];
}

export type SettingsContextType = {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  loadingSettings: boolean;
};
