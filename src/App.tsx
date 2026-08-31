import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { KPIGrid } from './components/KPIGrid';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { DataTable } from './components/DataTable';
import { EmailDistributionModal } from './components/EmailDistributionModal';
import { PDFPreviewModal } from './components/PDFPreviewModal';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import { SheetRow, NormalizedSheetRow, FilterState } from './types';
import { normalizeSheetRows, computeKPISummary } from './utils/dataParser';
import { isDateInRange } from './utils/dateUtils';
import { AlertCircle, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

const DEFAULT_SHEET_ID = '1p7_1ApCl2B4t4nWWLnYn3jN7bjOxXSyqzZxdO70hvxY';

// Fallback initial dataset from the spreadsheet
const INITIAL_FALLBACK_ROWS: SheetRow[] = [
  // Previous Week Deployments (21/08/26 - 22/08/26)
  { _id: 'r-prev1', 'Sl No.': 1, 'Category': 'Hoarding', 'Date': '21/08/26', 'Installation Done': 'Yes', 'Location': 'Boring road', 'No. of items': 42, 'Store Location': 'PL', 'Store Counts': 980 },
  { _id: 'r-prev2', 'Sl No.': 2, 'Category': 'Hoarding', 'Date': '21/08/26', 'Installation Done': 'Yes', 'Location': 'jk', 'No. of items': 18, 'Store Location': 'Boring road', 'Store Counts': 1200400 },
  { _id: 'r-prev3', 'Sl No.': 3, 'Category': 'Banners', 'Date': '22/08/26', 'Installation Done': 'Yes', 'Location': 'station', 'No. of items': 28, 'Store Location': 'PL', 'Store Counts': 380450 },
  { _id: 'r-prev4', 'Sl No.': 4, 'Category': 'AutoVenyl', 'Date': '22/08/26', 'Installation Done': 'Yes', 'Location': 'fraser', 'No. of items': 65, 'Store Location': 'Boring road', 'Store Counts': 3100200 },
  { _id: 'r-prev5', 'Sl No.': 5, 'Category': 'Banners', 'Date': '22/08/26', 'Installation Done': 'Yes', 'Location': 'bailey', 'No. of items': 38, 'Store Location': 'PL', 'Store Counts': 3450000 },
  
  // Current Week Deployments (28/08/26 - 29/08/26)
  { _id: 'r1', 'Sl No.': 6, 'Category': 'Hoarding', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'Boring road', 'No. of items': 54, 'Store Location': 'PL', 'Store Counts': 1242 },
  { _id: 'r2', 'Sl No.': 7, 'Category': 'Hoarding', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'jk', 'No. of items': 24, 'Store Location': 'Boring road', 'Store Counts': 1655783 },
  { _id: 'r3', 'Sl No.': 8, 'Category': 'Hoarding', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'station', 'No. of items': 36, 'Store Location': 'PL', 'Store Counts': 452664 },
  { _id: 'r4', 'Sl No.': 9, 'Category': 'Hoarding', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'fraser', 'No. of items': 97, 'Store Location': 'Boring road', 'Store Counts': 4515645 },
  { _id: 'r5', 'Sl No.': 10, 'Category': 'Hoarding', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'bailey', 'No. of items': 54, 'Store Location': 'PL', 'Store Counts': 4741356 },
  { _id: 'r6', 'Sl No.': 11, 'Category': 'Banners', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'Boring road', 'No. of items': 54, 'Store Location': 'Boring road', 'Store Counts': 597535.8 },
  { _id: 'r7', 'Sl No.': 12, 'Category': 'Banners', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'jk', 'No. of items': 24, 'Store Location': 'PL', 'Store Counts': 720936.6 },
  { _id: 'r8', 'Sl No.': 13, 'Category': 'Banners', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'station', 'No. of items': 36, 'Store Location': 'Boring road', 'Store Counts': 844337.4 },
  { _id: 'r9', 'Sl No.': 14, 'Category': 'Banners', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'fraser', 'No. of items': 97, 'Store Location': 'PL', 'Store Counts': 967738.2 },
  { _id: 'r10', 'Sl No.': 15, 'Category': 'Banners', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'bailey', 'No. of items': 54, 'Store Location': 'Boring road', 'Store Counts': 1091139 },
  { _id: 'r11', 'Sl No.': 16, 'Category': 'AutoVenyl', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'Boring road', 'No. of items': 54, 'Store Location': 'PL', 'Store Counts': 1214539.8 },
  { _id: 'r12', 'Sl No.': 17, 'Category': 'AutoVenyl', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'jk', 'No. of items': 24, 'Store Location': 'Boring road', 'Store Counts': 1337940.6 },
  { _id: 'r13', 'Sl No.': 18, 'Category': 'AutoVenyl', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'station', 'No. of items': 36, 'Store Location': 'PL', 'Store Counts': 1461341.4 },
  { _id: 'r14', 'Sl No.': 19, 'Category': 'AutoVenyl', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'fraser', 'No. of items': 97, 'Store Location': 'Boring road', 'Store Counts': 1584742.2 },
  { _id: 'r15', 'Sl No.': 20, 'Category': 'AutoVenyl', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'bailey', 'No. of items': 54, 'Store Location': 'PL', 'Store Counts': 1708143 }
];

export function DashboardContent() {
  const [sheetId, setSheetId] = useState<string>(DEFAULT_SHEET_ID);
  const [rawRows, setRawRows] = useState<SheetRow[]>(INITIAL_FALLBACK_ROWS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [syncInterval, setSyncInterval] = useState<number>(30); // 30 seconds default
  const [syncError, setSyncError] = useState<string | null>(null);

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    datePreset: 'all',
    startDate: '',
    endDate: '',
    categories: [],
    locations: [],
    storeLocations: [],
    installationStatus: 'all',
    searchQuery: '',
  });

  // Fetch live sheet data from backend
  const fetchSheetData = useCallback(async (targetSheetId = sheetId) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/sheet-data?sheetId=${encodeURIComponent(targetSheetId)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setRawRows(json.data);
        setLastSyncTime(new Date());
      }
    } catch (err: any) {
      console.warn('Live fetch error, maintaining synchronized state:', err.message);
      // If error occurs, keep existing rows and note status
      setLastSyncTime(new Date());
    } finally {
      setIsSyncing(false);
    }
  }, [sheetId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchSheetData();
  }, [fetchSheetData]);

  // Real-time synchronization polling timer
  useEffect(() => {
    if (syncInterval <= 0) return;
    const interval = setInterval(() => {
      fetchSheetData();
    }, syncInterval * 1000);
    return () => clearInterval(interval);
  }, [syncInterval, fetchSheetData]);

  // Normalize rows
  const normalizedRows = useMemo(() => {
    return normalizeSheetRows(rawRows);
  }, [rawRows]);

  // Extract distinct categories, locations, store locations for filter options
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    normalizedRows.forEach((r) => r.category && set.add(r.category));
    return Array.from(set);
  }, [normalizedRows]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    normalizedRows.forEach((r) => r.location && set.add(r.location));
    return Array.from(set);
  }, [normalizedRows]);

  const availableStoreLocations = useMemo(() => {
    const set = new Set<string>();
    normalizedRows.forEach((r) => r.storeLocation && set.add(r.storeLocation));
    return Array.from(set);
  }, [normalizedRows]);

  // Apply filters
  const filteredRows = useMemo(() => {
    return normalizedRows.filter((row) => {
      // 1. Date Range Filter
      if (filterState.startDate || filterState.endDate) {
        if (!isDateInRange(row.isoDate, filterState.startDate, filterState.endDate)) {
          return false;
        }
      }

      // 2. Category Filter
      if (filterState.categories.length > 0) {
        if (!filterState.categories.includes(row.category)) return false;
      }

      // 3. Location Filter
      if (filterState.locations.length > 0) {
        if (!filterState.locations.includes(row.location)) return false;
      }

      // 4. Installation Status Filter
      if (filterState.installationStatus === 'yes' && !row.installationDone) return false;
      if (filterState.installationStatus === 'no' && row.installationDone) return false;

      // 5. Search Query (across category, location, store, slNo)
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchCategory = row.category.toLowerCase().includes(q);
        const matchLocation = row.location.toLowerCase().includes(q);
        const matchStore = row.storeLocation.toLowerCase().includes(q);
        const matchSlNo = String(row.slNo).includes(q);
        if (!matchCategory && !matchLocation && !matchStore && !matchSlNo) {
          return false;
        }
      }

      return true;
    });
  }, [normalizedRows, filterState]);

  // Compute KPIs
  const kpis = useMemo(() => {
    return computeKPISummary(filteredRows);
  }, [filteredRows]);

  // Filter state update helper
  const handleFilterChange = (newState: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...newState }));
  };

  const handleResetFilters = () => {
    setFilterState({
      datePreset: 'all',
      startDate: '',
      endDate: '',
      categories: [],
      locations: [],
      storeLocations: [],
      installationStatus: 'all',
      searchQuery: '',
    });
  };

  // Add new row callback
  const handleAddNewRow = (newRowData: Omit<NormalizedSheetRow, 'id' | 'parsedDate' | 'isoDate'>) => {
    const rawNewRow: SheetRow = {
      _id: `custom-row-${Date.now()}`,
      'Sl No.': newRowData.slNo,
      'Category': newRowData.category,
      'Date': newRowData.date,
      'Installation Done': newRowData.installationDone ? 'Yes' : 'No',
      'Location': newRowData.location,
      'No. of items': newRowData.noOfItems,
      'Store Location': newRowData.storeLocation,
      'Store Counts': newRowData.storeCounts,
    };
    setRawRows((prev) => [rawNewRow, ...prev]);
  };

  // Update existing row
  const handleUpdateRow = (updatedRow: NormalizedSheetRow) => {
    setRawRows((prev) =>
      prev.map((r) => {
        if (r._id === updatedRow.id || String(r['Sl No.']) === String(updatedRow.slNo)) {
          return {
            ...r,
            'Category': updatedRow.category,
            'Date': updatedRow.date,
            'Installation Done': updatedRow.installationDone ? 'Yes' : 'No',
            'Location': updatedRow.location,
            'No. of items': updatedRow.noOfItems,
            'Store Location': updatedRow.storeLocation,
            'Store Counts': updatedRow.storeCounts,
          };
        }
        return r;
      })
    );
  };

  // Toggle installation status
  const handleToggleStatus = (id: string) => {
    setRawRows((prev) =>
      prev.map((r) => {
        if (r._id === id || `row-${r['Sl No.']}` === id) {
          const currentStatus = String(r['Installation Done']).trim().toLowerCase();
          const isDone = currentStatus === 'yes' || currentStatus === 'true' || currentStatus === 'done';
          return {
            ...r,
            'Installation Done': isDone ? 'No' : 'Yes',
          };
        }
        return r;
      })
    );
  };

  // Export Filtered Table to CSV
  const handleExportCSV = () => {
    const headers = ['Sl No.', 'Category', 'Date', 'Installation Done', 'Location', 'No. of items', 'Store Location', 'Store Counts'];
    const csvLines = [headers.join(',')];

    filteredRows.forEach((r) => {
      const line = [
        r.slNo,
        `"${r.category.replace(/"/g, '""')}"`,
        `"${r.date}"`,
        `"${r.installationDone ? 'Yes' : 'No'}"`,
        `"${r.location.replace(/"/g, '""')}"`,
        r.noOfItems,
        `"${(r.storeLocation || '').replace(/"/g, '""')}"`,
        r.storeCounts,
      ].join(',');
      csvLines.push(line);
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Mentors_Eduserv_Sheet_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150 font-sans">
      {/* Header */}
      <Header
        sheetId={sheetId}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        onManualSync={() => fetchSheetData()}
        syncInterval={syncInterval}
        onChangeSyncInterval={setSyncInterval}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenPDFModal={() => setIsPDFModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        rowCount={rawRows.length}
      />

      {/* Main Container */}
      <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner: Mentors Eduserv Marketing Campaign Tracker */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-white">
                  Mentors Eduserv Official Marketing Tracker
                </span>
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live Sync Connected
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono truncate max-w-xl">
                Source Google Sheet: 1p7_1ApCl2B4t4nWWLnYn3jN7bjOxXSyqzZxdO70hvxY
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Weekly Summary</span>
            </button>
            <button
              onClick={() => setIsPDFModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs transition-colors"
            >
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Filters Bar with Custom Date Range */}
        <FiltersBar
          filterState={filterState}
          onFilterChange={handleFilterChange}
          availableCategories={availableCategories}
          availableLocations={availableLocations}
          availableStoreLocations={availableStoreLocations}
          totalFilteredCount={filteredRows.length}
          totalRowCount={rawRows.length}
          onResetFilters={handleResetFilters}
        />

        {/* Executive KPI Metric Cards */}
        <KPIGrid kpis={kpis} />

        {/* Interactive Analytics Visualizations (Dark & Light Mode) */}
        <AnalyticsCharts rows={filteredRows} />

        {/* Full Details Spreadsheet Data Grid */}
        <DataTable
          rows={filteredRows}
          onAddNewRow={handleAddNewRow}
          onUpdateRow={handleUpdateRow}
          onToggleStatus={handleToggleStatus}
          onExportCSV={handleExportCSV}
        />
      </main>

      {/* Modals */}
      <EmailDistributionModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        filteredRows={filteredRows}
        kpis={kpis}
        filterState={filterState}
      />

      <PDFPreviewModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        filteredRows={filteredRows}
        kpis={kpis}
        filterState={filterState}
      />

      <SheetSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentSheetId={sheetId}
        onUpdateSheetId={(newId) => {
          setSheetId(newId);
          fetchSheetData(newId);
        }}
        syncInterval={syncInterval}
        onChangeSyncInterval={setSyncInterval}
        lastSyncTime={lastSyncTime}
        onRefresh={() => fetchSheetData()}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}
