
import type { Seller, AreaOption, StatusOption, CompanyOption, ProposalStatusOption, ContactSourceOption, FollowUpOptionValue } from './constants';
import type { ALL_SELLERS_OPTION } from './constants';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Sale {
  id: string;
  seller: Seller;
  sellerUid: string;
  date: string; // ISO string
  company: CompanyOption;
  project: string;
  os?: string;
  area: AreaOption;
  clientService: string;
  salesValue: number;
  status: StatusOption;
  payment: number;
  summary?: string;
  createdAt: any; // Can be a server timestamp
  updatedAt?: any; // Can be a server timestamp
}

export type SalesFilters = {
  searchTerm?: string;
  selectedYear?: number | 'all';
};

export type SalesContextType = {
  sales: Sale[];
  filteredSales: Sale[];
  selectedSeller: Seller | typeof ALL_SELLERS_OPTION;
  isReadOnly: boolean;
  addSale: (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'>) => Promise<Sale>;
  addBulkSales: (newSales: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'sellerUid'>[]) => Promise<void>;
  updateSale: (id: string, saleData: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
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

export interface AppSettings {
  enableSalesEmailNotifications: boolean;
  salesNotificationEmails: string[];
}

export type SettingsContextType = {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  loadingSettings: boolean;
};

export type QuoteDashboardFilters = Pick<SalesFilters, 'selectedYear'>;


export interface Quote {
  id: string;
  seller: Seller;
  sellerUid: string;
  clientName: string;
  proposalDate: string; // ISO string
  validityDate?: string; // ISO string, opcional
  company: CompanyOption;
  area: AreaOption;
  contactSource: ContactSourceOption;
  description: string;
  proposedValue: number;
  status: ProposalStatusOption;
  notes?: string; // Opcional
  followUpDate?: string | null;
  followUpDone?: boolean;
  followUpSequence?: string;
  createdAt: any; // Can be a server timestamp
  updatedAt?: any; // Can be a server timestamp
}

export type QuotesContextType = {
  quotes: Quote[];
  selectedSeller: Seller | typeof ALL_SELLERS_OPTION;
  
  managementFilteredQuotes: Quote[]; 
  setManagementSearchTerm: (term: string) => void;
  managementSearchTerm: string;

  dashboardFilteredQuotes: Quote[]; 
  setDashboardFilters: (filters: Partial<QuoteDashboardFilters>) => void;
  dashboardFilters: QuoteDashboardFilters;
  
  addQuote: (quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid' | 'followUpDate' | 'followUpDone' | 'followUpSequence'> & { followUpOption: FollowUpOptionValue }) => Promise<Quote>;
  addBulkQuotes: (newQuotes: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'sellerUid'>[]) => Promise<void>;
  updateQuote: (id: string, quoteData: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'followUpDate' | 'followUpSequence'>> & { followUpOption: FollowUpOptionValue, followUpDone?: boolean }) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  getQuoteById: (id: string) => Quote | undefined;
  toggleFollowUpDone: (quoteId: string) => Promise<void>; 
  loadingQuotes: boolean;
};
