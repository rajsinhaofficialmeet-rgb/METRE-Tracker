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
import { SchemaConfigModal } from './components/SchemaConfigModal';
import { SheetRow, NormalizedSheetRow, FilterState, SchemaConfig, ColumnMeta } from './types';
import { normalizeSheetRows, computeKPISummary } from './utils/dataParser';
import { detectSheetSchema, inspectColumns } from './utils/schemaDetector';
import { isDateInRange } from './utils/dateUtils';
import {
  fetchLiveSpreadsheetData,
  writeRowToGoogleSheet,
  loadSavedSheetConfig,
  saveSheetConfig,
  loadLocalCustomRows,
  saveLocalCustomRows,
  isValidSheetRows,
  isValidColumnHeader,
  INITIAL_SEED_ROWS,
  DEFAULT_SHEET_ID,
} from './services/sheetService';
import { Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, Cloud, Sliders } from 'lucide-react';

const SCHEMA_STORAGE_PREFIX = 'adaptive_schema_';

// Immediate cleanup of any corrupted localStorage keys
function cleanCorruptedLocalStorage() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        if (
          val.includes('<!DOCTYPE') ||
          val.includes('<html') ||
          val.includes('<script') ||
          val.includes('deleteIsEnforced') ||
          val.includes('disableAllReporting') ||
          val.includes('Array.prototype') ||
          val.includes('function(')
        ) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Error checking localStorage:', e);
  }
}

cleanCorruptedLocalStorage();

export function DashboardContent() {
  const initialConfig = useMemo(() => loadSavedSheetConfig(), []);
  const [sheetId, setSheetId] = useState<string>(initialConfig.sheetId || DEFAULT_SHEET_ID);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(initialConfig.appsScriptUrl || '');
  const [syncInterval, setSyncInterval] = useState<number>(initialConfig.syncInterval ?? 30);
  const [rawRows, setRawRows] = useState<SheetRow[]>(() => {
    cleanCorruptedLocalStorage();
    const cached = loadLocalCustomRows();
    return isValidSheetRows(cached) ? cached : INITIAL_SEED_ROWS;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [syncSource, setSyncSource] = useState<string>('direct-csv');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Schema state with validation against HTML/JS injection
  const [customSchema, setCustomSchema] = useState<SchemaConfig | null>(() => {
    try {
      const storageKey = `${SCHEMA_STORAGE_PREFIX}${initialConfig.sheetId || DEFAULT_SHEET_ID}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          isValidColumnHeader(parsed.categoryColumn) &&
          isValidColumnHeader(parsed.locationColumn) &&
          isValidColumnHeader(parsed.primaryMetricColumn)
        ) {
          return parsed;
        } else {
          localStorage.removeItem(storageKey);
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // Guard against any corrupted rawRows in memory
  useEffect(() => {
    if (!isValidSheetRows(rawRows)) {
      console.warn('Found corrupted rows in state, resetting to initial seed dataset.');
      setRawRows(INITIAL_SEED_ROWS);
    }
  }, [rawRows]);

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

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

  // Inspect columns from raw rows
  const detectedColumns: ColumnMeta[] = useMemo(() => {
    return inspectColumns(rawRows);
  }, [rawRows]);

  // Active Schema: customSchema or auto-detected
  const activeSchema: SchemaConfig = useMemo(() => {
    if (customSchema) return customSchema;
    return detectSheetSchema(rawRows);
  }, [rawRows, customSchema]);

  // Normalize rows with active dynamic schema
  const normalizedRows = useMemo(() => {
    return normalizeSheetRows(rawRows, activeSchema);
  }, [rawRows, activeSchema]);

  // Fetch live sheet data from universal dual-mode service
  const fetchSheetData = useCallback(
    async (targetSheetId = sheetId, targetWebhook = appsScriptUrl) => {
      setIsSyncing(true);
      try {
        const result = await fetchLiveSpreadsheetData(targetSheetId, '0', targetWebhook);
        if (result.rows && result.rows.length > 0 && isValidSheetRows(result.rows)) {
          setRawRows(result.rows);
          setLastSyncTime(result.lastSync);
          setSyncSource(result.source);
          saveLocalCustomRows(result.rows);
        } else {
          // If the fetched sheet is private or invalid, ensure state remains clean
          setRawRows((prev) => (isValidSheetRows(prev) ? prev : INITIAL_SEED_ROWS));
          setLastSyncTime(new Date());
        }
      } catch (err: any) {
        console.warn('Sync error, fallback active:', err.message);
        setRawRows((prev) => (isValidSheetRows(prev) ? prev : INITIAL_SEED_ROWS));
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

  // Save config changes when sheetId changes
  const handleUpdateSheetId = (newId: string) => {
    setSheetId(newId);
    // Try to load any saved custom schema for this sheet
    try {
      const saved = localStorage.getItem(`${SCHEMA_STORAGE_PREFIX}${newId}`);
      setCustomSchema(saved ? JSON.parse(saved) : null);
    } catch {
      setCustomSchema(null);
    }

    saveSheetConfig({
      sheetId: newId,
      gid: '0',
      appsScriptUrl,
      syncInterval,
      lastSyncTime: new Date().toISOString(),
      syncMode: 'auto',
    });
    fetchSheetData(newId, appsScriptUrl);
    showToast('Spreadsheet updated & schema dynamically adapted', 'success');
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

  // Schema Modal Handlers
  const handleSaveCustomSchema = (newSchema: SchemaConfig) => {
    setCustomSchema(newSchema);
    try {
      localStorage.setItem(`${SCHEMA_STORAGE_PREFIX}${sheetId}`, JSON.stringify(newSchema));
    } catch (e) {
      console.warn('Could not persist custom schema to localStorage', e);
    }
    showToast('Sheet schema and field mappings updated!', 'success');
  };

  const handleResetToAutoSchema = () => {
    setCustomSchema(null);
    try {
      localStorage.removeItem(`${SCHEMA_STORAGE_PREFIX}${sheetId}`);
    } catch (e) {
      console.warn(e);
    }
    showToast('Reset to automatic AI schema detection', 'info');
  };

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

      // 2. Category / Primary Dimension Filter
      if (filterState.categories.length > 0) {
        if (!filterState.categories.includes(row.category)) return false;
      }

      // 3. Location / Secondary Dimension Filter
      if (filterState.locations.length > 0) {
        if (!filterState.locations.includes(row.location)) return false;
      }

      // 4. Status Filter
      if (filterState.installationStatus === 'yes' && !row.installationDone) return false;
      if (filterState.installationStatus === 'no' && row.installationDone) return false;

      // 5. Search Query (across category, location, store, slNo, raw)
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchCategory = row.category.toLowerCase().includes(q);
        const matchLocation = row.location.toLowerCase().includes(q);
        const matchStore = (row.storeLocation || '').toLowerCase().includes(q);
        const matchSlNo = String(row.slNo).includes(q);
        if (!matchCategory && !matchLocation && !matchStore && !matchSlNo) {
          return false;
        }
      }

      return true;
    });
  }, [normalizedRows, filterState]);

  // Compute KPIs with active schema
  const kpis = useMemo(() => {
    return computeKPISummary(filteredRows, activeSchema);
  }, [filteredRows, activeSchema]);

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
      [activeSchema.idColumn || 'Sl No.']: newRowData.slNo,
      [activeSchema.categoryColumn || 'Category']: newRowData.category,
      [activeSchema.dateColumn || 'Date']: newRowData.date,
      [activeSchema.statusColumn || 'Installation Done']: newRowData.installationDone ? 'Yes' : 'No',
      [activeSchema.locationColumn || 'Location']: newRowData.location,
      [activeSchema.primaryMetricColumn || 'No. of items']: newRowData.noOfItems,
      [activeSchema.secondaryMetricColumn || 'Store Counts']: newRowData.storeCounts,
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
      const rowId = r._id || `row-${r[activeSchema.idColumn] || r['Sl No.']}`;
      if (rowId === updatedRow.id || String(r[activeSchema.idColumn]) === String(updatedRow.slNo)) {
        const mutated = {
          ...r,
          [activeSchema.categoryColumn]: updatedRow.category,
          [activeSchema.dateColumn]: updatedRow.date,
          [activeSchema.statusColumn]: updatedRow.installationDone ? 'Yes' : 'No',
          [activeSchema.locationColumn]: updatedRow.location,
          [activeSchema.primaryMetricColumn]: updatedRow.noOfItems,
          [activeSchema.secondaryMetricColumn]: updatedRow.storeCounts,
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
      const rowId = r._id || `row-${r[activeSchema.idColumn] || r['Sl No.']}`;
      if (rowId === id || `row-${r[activeSchema.idColumn] || r['Sl No.']}` === id) {
        const currentStatus = String(r[activeSchema.statusColumn] ?? r['Installation Done'] ?? '').trim().toLowerCase();
        const isDone = currentStatus === 'yes' || currentStatus === 'true' || currentStatus === 'done' || currentStatus === 'completed' || currentStatus === '1';
        const mutated = {
          ...r,
          [activeSchema.statusColumn || 'Installation Done']: isDone ? 'No' : 'Yes',
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
        showToast(`Status updated in Google Sheet!`, 'success');
      } else {
        showToast(`Status updated locally.`, 'info');
      }
    }
  };

  // Export Filtered Table to CSV with active schema headers
  const handleExportCSV = () => {
    const headers = [
      activeSchema.idColumn || 'Sl No.',
      activeSchema.categoryColumn || 'Category',
      activeSchema.dateColumn || 'Date',
      activeSchema.statusColumn || 'Installation Done',
      activeSchema.locationColumn || 'Location',
      activeSchema.primaryMetricColumn || 'No. of items',
      activeSchema.secondaryMetricColumn || 'Store Counts',
    ];
    const csvLines = [headers.join(',')];

    filteredRows.forEach((r) => {
      const line = [
        r.slNo,
        `"${(r.category || '').replace(/"/g, '""')}"`,
        `"${r.date || ''}"`,
        `"${r.installationDone ? 'Yes' : 'No'}"`,
        `"${(r.location || '').replace(/"/g, '""')}"`,
        r.noOfItems,
        r.storeCounts,
      ].join(',');
      csvLines.push(line);
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sheet_Dashboard_Export_${new Date().toISOString().split('T')[0]}.csv`);
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
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenPDFModal={() => setIsPDFModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        rowCount={rawRows.length}
      />

      {/* Main Container */}
      <main className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Banner: Adaptive Spreadsheet Tracker Status Bar */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                  Adaptive Sheet Tracker
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {activeSchema.autoDetected ? 'Auto-Schema Detected' : 'Custom Mapped'}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {detectedColumns.length} Columns
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono truncate max-w-xs sm:max-w-xl">
                Source Sheet: {sheetId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors min-h-[38px] sm:min-h-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Map Fields</span>
            </button>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors min-h-[38px] sm:min-h-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Summary</span>
            </button>

            <button
              onClick={() => setIsPDFModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs transition-colors min-h-[38px] sm:min-h-0"
            >
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Adaptive Filters Bar with Dynamic Slicers */}
        <FiltersBar
          filterState={filterState}
          onFilterChange={handleFilterChange}
          availableCategories={availableCategories}
          availableLocations={availableLocations}
          availableStoreLocations={availableStoreLocations}
          totalFilteredCount={filteredRows.length}
          totalRowCount={rawRows.length}
          onResetFilters={handleResetFilters}
          categoryLabel={activeSchema.categoryColumn || 'Category'}
          locationLabel={activeSchema.locationColumn || 'Location'}
          statusLabel={activeSchema.statusColumn || 'Status'}
          onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        />

        {/* Adaptive Executive KPI Metric Cards */}
        <KPIGrid kpis={kpis} />

        {/* Adaptive Interactive Analytics Visualizations */}
        <AnalyticsCharts rows={filteredRows} schema={activeSchema} />

        {/* Adaptive Full Details Spreadsheet Data Grid */}
        <DataTable
          rows={filteredRows}
          schema={activeSchema}
          onAddNewRow={handleAddNewRow}
          onUpdateRow={handleUpdateRow}
          onToggleStatus={handleToggleStatus}
          onExportCSV={handleExportCSV}
        />
      </main>

      {/* Modals */}
      <SchemaConfigModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        columns={detectedColumns}
        currentSchema={activeSchema}
        onSaveSchema={handleSaveCustomSchema}
        onResetToAuto={handleResetToAutoSchema}
        sheetTitle={sheetId}
      />

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
