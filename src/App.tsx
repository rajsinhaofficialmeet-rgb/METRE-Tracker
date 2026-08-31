import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { KPIGrid } from './components/KPIGrid';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { DataTable } from './components/DataTable';
import { ReportDispatchModal } from './components/ReportDispatchModal';
import { PDFPreviewModal } from './components/PDFPreviewModal';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import { SheetRow, NormalizedSheetRow, FilterState } from './types';
import { normalizeSheetRows, computeKPISummary } from './utils/dataParser';
import { isDateInRange } from './utils/dateUtils';
import {
  fetchLiveSpreadsheetData,
  writeRowToGoogleSheet,
  loadSavedSheetConfig,
  saveSheetConfig,
  loadLocalCustomRows,
  saveLocalCustomRows,
  INITIAL_SEED_ROWS,
  DEFAULT_SHEET_ID,
} from './services/sheetService';
import { Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, Cloud, Smartphone, Share2 } from 'lucide-react';

export function DashboardContent() {
  const initialConfig = useMemo(() => loadSavedSheetConfig(), []);
  const [sheetId, setSheetId] = useState<string>(initialConfig.sheetId || DEFAULT_SHEET_ID);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(initialConfig.appsScriptUrl || '');
  const [syncInterval, setSyncInterval] = useState<number>(initialConfig.syncInterval ?? 30);
  const [rawRows, setRawRows] = useState<SheetRow[]>(() => {
    const cached = loadLocalCustomRows();
    return cached.length > 0 ? cached : INITIAL_SEED_ROWS;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [syncSource, setSyncSource] = useState<string>('direct-csv');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch live sheet data from universal dual-mode service
  const fetchSheetData = useCallback(
    async (targetSheetId = sheetId, targetWebhook = appsScriptUrl) => {
      setIsSyncing(true);
      try {
        const result = await fetchLiveSpreadsheetData(targetSheetId, '0', targetWebhook);
        if (result.rows && result.rows.length > 0) {
          setRawRows(result.rows);
          setLastSyncTime(result.lastSync);
          setSyncSource(result.source);
          saveLocalCustomRows(result.rows);
        }
      } catch (err: any) {
        console.warn('Sync error, fallback active:', err.message);
        setLastSyncTime(new Date());
      } finally {
        setIsSyncing(false);
      }
    },
    [sheetId, appsScriptUrl]
  );

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

  // Save config changes to localStorage
  const handleUpdateSheetId = (newId: string) => {
    setSheetId(newId);
    saveSheetConfig({
      sheetId: newId,
      gid: '0',
      appsScriptUrl,
      syncInterval,
      lastSyncTime: new Date().toISOString(),
      syncMode: 'auto',
    });
    fetchSheetData(newId, appsScriptUrl);
    showToast('Spreadsheet updated & live sync initiated', 'success');
  };

  const handleUpdateAppsScriptUrl = (url: string) => {
    setAppsScriptUrl(url);
    saveSheetConfig({
      sheetId,
      gid: '0',
      appsScriptUrl: url,
      syncInterval,
      lastSyncTime: new Date().toISOString(),
      syncMode: 'auto',
    });
    if (url) {
      showToast('2-Way Google Apps Script Webhook configured!', 'success');
      fetchSheetData(sheetId, url);
    }
  };

  const handleChangeSyncInterval = (interval: number) => {
    setSyncInterval(interval);
    saveSheetConfig({
      sheetId,
      gid: '0',
      appsScriptUrl,
      syncInterval: interval,
      lastSyncTime: new Date().toISOString(),
      syncMode: 'auto',
    });
  };

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

  // Add new row callback with 2-way sync
  const handleAddNewRow = async (newRowData: Omit<NormalizedSheetRow, 'id' | 'parsedDate' | 'isoDate'>) => {
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
    const updated = [rawNewRow, ...rawRows];
    setRawRows(updated);
    saveLocalCustomRows(updated);

    const syncResult = await writeRowToGoogleSheet('append', rawNewRow, appsScriptUrl);
    if (syncResult.remoteSynced) {
      showToast('Row added and synced to Google Spreadsheet!', 'success');
    } else {
      showToast('Row added locally. Connect Apps Script Webhook for 2-way sheet write.', 'info');
    }
  };

  // Update existing row with 2-way sync
  const handleUpdateRow = async (updatedRow: NormalizedSheetRow) => {
    let targetRowData: any = null;
    const updated = rawRows.map((r) => {
      if (r._id === updatedRow.id || String(r['Sl No.']) === String(updatedRow.slNo)) {
        const mutated = {
          ...r,
          'Category': updatedRow.category,
          'Date': updatedRow.date,
          'Installation Done': updatedRow.installationDone ? 'Yes' : 'No',
          'Location': updatedRow.location,
          'No. of items': updatedRow.noOfItems,
          'Store Location': updatedRow.storeLocation,
          'Store Counts': updatedRow.storeCounts,
        };
        targetRowData = mutated;
        return mutated;
      }
      return r;
    });

    setRawRows(updated);
    saveLocalCustomRows(updated);

    if (targetRowData) {
      const syncResult = await writeRowToGoogleSheet('update', targetRowData, appsScriptUrl);
      if (syncResult.remoteSynced) {
        showToast(`Row #${updatedRow.slNo} updated in live Google Sheet!`, 'success');
      } else {
        showToast(`Row #${updatedRow.slNo} updated locally.`, 'info');
      }
    }
  };

  // Toggle installation status with 2-way sync
  const handleToggleStatus = async (id: string) => {
    let targetRowData: any = null;
    const updated = rawRows.map((r) => {
      if (r._id === id || `row-${r['Sl No.']}` === id) {
        const currentStatus = String(r['Installation Done']).trim().toLowerCase();
        const isDone = currentStatus === 'yes' || currentStatus === 'true' || currentStatus === 'done';
        const mutated = {
          ...r,
          'Installation Done': isDone ? 'No' : 'Yes',
        };
        targetRowData = mutated;
        return mutated;
      }
      return r;
    });

    setRawRows(updated);
    saveLocalCustomRows(updated);

    if (targetRowData) {
      const syncResult = await writeRowToGoogleSheet('toggleStatus', targetRowData, appsScriptUrl);
      if (syncResult.remoteSynced) {
        showToast(`Status toggled to "${targetRowData['Installation Done']}" in Google Sheet!`, 'success');
      } else {
        showToast(`Status toggled to "${targetRowData['Installation Done']}".`, 'info');
      }
    }
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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold font-mono ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900'
                : toastMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-white dark:bg-zinc-900'
                : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Cloud className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        sheetId={sheetId}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        onManualSync={() => {
          fetchSheetData();
          showToast('Syncing with Google Spreadsheet...', 'info');
        }}
        syncInterval={syncInterval}
        onChangeSyncInterval={handleChangeSyncInterval}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenPDFModal={() => setIsPDFModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        rowCount={rawRows.length}
      />

      {/* Main Container */}
      <main className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Banner: Mentors Eduserv Marketing Campaign Tracker */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                  Mentors Eduserv Marketing Tracker
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {appsScriptUrl ? '2-Way Webhook Sync' : 'Live Cloud Sync'}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Vercel Ready
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono truncate max-w-xs sm:max-w-xl">
                Source Sheet: {sheetId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors min-h-[38px] sm:min-h-0"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span>WhatsApp / Email Report</span>
            </button>
            <button
              onClick={() => setIsPDFModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs transition-colors min-h-[38px] sm:min-h-0"
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
      <ReportDispatchModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
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
        onUpdateSheetId={handleUpdateSheetId}
        syncInterval={syncInterval}
        onChangeSyncInterval={handleChangeSyncInterval}
        lastSyncTime={lastSyncTime}
        onRefresh={() => {
          fetchSheetData();
          showToast('Refreshing live sheet data...', 'info');
        }}
        appsScriptUrl={appsScriptUrl}
        onUpdateAppsScriptUrl={handleUpdateAppsScriptUrl}
        activeSyncSource={syncSource}
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
