import type { Seller, AreaOption, StatusOption, PaymentOption } from './constants';

export interface Sale {
  id: string;
  seller: Seller;
  date: string; // ISO string
  company: string;
  project: string;
  os: string;
  area: AreaOption;
  clientService: string;
  salesValue: number;
  status: StatusOption;
  payment: PaymentOption;
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
  login: (username: string, token?: string) => void; // token is unused for now but good for future
  logout: () => void;
};

export type SalesFilters = {
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
};

export type SalesContextType = {
  sales: Sale[];
  filteredSales: Sale[];
  selectedSeller: Seller | typeof ALL_SELLERS_OPTION;
  setSelectedSeller: (seller: Seller | typeof ALL_SELLERS_OPTION) => void;
  addSale: (saleData: Omit<Sale, 'id' | 'createdAt' | 'seller'>) => Sale;
  updateSale: (id: string, saleData: Partial<Omit<Sale, 'id' | 'createdAt' | 'seller'>>) => Sale | undefined;
  deleteSale: (id: string) => void;
  getSaleById: (id: string) => Sale | undefined;
  setFilters: (filters: SalesFilters) => void;
  filters: SalesFilters;
  loading: boolean;
};

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: (pathname: string) => boolean;
};
