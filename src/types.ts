export interface ColumnMeta {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  uniqueCount: number;
  sampleValues: string[];
  isMetric: boolean;
  isDimension: boolean;
  isDate: boolean;
  isStatus: boolean;
}

export interface SchemaConfig {
  idColumn: string;
  categoryColumn: string;
  locationColumn: string;
  dateColumn: string;
  statusColumn: string;
  primaryMetricColumn: string;
  secondaryMetricColumn: string;
  sheetTitle: string;
  autoDetected: boolean;
}

export interface SheetRow {
  _id?: string;
  [key: string]: any;
}

export interface NormalizedSheetRow {
  id: string;
  slNo: number | string;
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
  _raw: Record<string, any>;
  [key: string]: any;
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
  customFilters?: Record<string, string[]>;
}

export interface InstallationGrowthKPI {
  growthPercentage: number; // e.g. 25.5 or -10.0
  formattedPercentage: string; // e.g. "+25.5%" or "-10.0%"
  trend: 'growth' | 'decline' | 'neutral';
  currentWeekRecords: number;
  previousWeekRecords: number;
  currentWeekItems: number;
  previousWeekItems: number;
  hasPreviousWeekData: boolean;
}

export interface KPISummary {
  primaryMetricLabel: string;
  secondaryMetricLabel: string;
  primaryDimensionLabel: string;
  secondaryDimensionLabel: string;
  statusLabel: string;
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
  installationGrowth: InstallationGrowthKPI;
  dimensionBreakdown?: Array<{ name: string; items: number; percentage: number }>;
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

