export interface SheetRow {
  _id: string;
  'Sl No.': string | number;
  'Category': string;
  'Date': string;
  'Installation Done': string;
  'Location': string;
  'No. of items': string | number;
  'Store Location': string;
  'Store Counts': string | number;
  [key: string]: any;
}

export interface NormalizedSheetRow {
  id: string;
  slNo: number;
  category: string;
  date: string; // original string e.g. "28/08/26"
  parsedDate: Date | null;
  isoDate: string; // "2026-08-28"
  installationDone: boolean;
  installationStatusText: string;
  location: string;
  noOfItems: number;
  storeLocation: string;
  storeCounts: number;
}

export interface FilterState {
  datePreset: 'all' | 'today' | 'last7' | 'last30' | 'aug2026' | 'custom';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  categories: string[];
  locations: string[];
  storeLocations: string[];
  installationStatus: 'all' | 'yes' | 'no';
  searchQuery: string;
}

export interface KPISummary {
  totalItems: number;
  installedItems: number;
  pendingItems: number;
  completionRate: number; // 0 - 100
  totalStoreCounts: number;
  uniqueLocations: number;
  uniqueCategories: number;
  topLocation: { name: string; items: number };
  topCategory: { name: string; items: number };
  totalRecords: number;
}

export interface Stakeholder {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  subject: string;
  recipients: string[];
  reportType: string;
  status: 'Delivered' | 'Scheduled' | 'Failed';
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek: number; // 1 = Monday
  time: string; // "09:00"
  reportType: 'weekly_summary' | 'daily_digest' | 'executive_report';
  recipients: string[];
}
