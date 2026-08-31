import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  X, 
  RotateCcw, 
  Tag, 
  MapPin, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { FilterState } from '../types';

interface FiltersBarProps {
  filterState: FilterState;
  onFilterChange: (newState: Partial<FilterState>) => void;
  availableCategories: string[];
  availableLocations: string[];
  availableStoreLocations: string[];
  totalFilteredCount: number;
  totalRowCount: number;
  onResetFilters: () => void;
  categoryLabel?: string;
  locationLabel?: string;
  statusLabel?: string;
  onOpenSchemaModal?: () => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filterState,
  onFilterChange,
  availableCategories,
  availableLocations,
  totalFilteredCount,
  totalRowCount,
  onResetFilters,
  categoryLabel = 'Category',
  locationLabel = 'Location',
  statusLabel = 'Status',
  onOpenSchemaModal,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const isFiltered = 
    filterState.datePreset !== 'all' ||
    filterState.startDate !== '' ||
    filterState.endDate !== '' ||
    filterState.categories.length > 0 ||
    filterState.locations.length > 0 ||
    filterState.installationStatus !== 'all' ||
    filterState.searchQuery !== '';

  const activeAdvancedCount = 
    (filterState.categories.length > 0 ? 1 : 0) +
    (filterState.locations.length > 0 ? 1 : 0) +
    (filterState.installationStatus !== 'all' ? 1 : 0) +
    (filterState.startDate || filterState.endDate ? 1 : 0);

  const handleDatePresetChange = (preset: FilterState['datePreset']) => {
    if (preset === 'all') {
      onFilterChange({ datePreset: 'all', startDate: '', endDate: '' });
    } else if (preset === 'today') {
      const todayIso = new Date().toISOString().split('T')[0];
      onFilterChange({ datePreset: 'today', startDate: todayIso, endDate: todayIso });
    } else if (preset === 'last7') {
      const d = new Date();
      const endIso = d.toISOString().split('T')[0];
      d.setDate(d.getDate() - 7);
      const startIso = d.toISOString().split('T')[0];
      onFilterChange({ datePreset: 'last7', startDate: startIso, endDate: endIso });
    } else if (preset === 'last30') {
      const d = new Date();
      const endIso = d.toISOString().split('T')[0];
      d.setDate(d.getDate() - 30);
      const startIso = d.toISOString().split('T')[0];
      onFilterChange({ datePreset: 'last30', startDate: startIso, endDate: endIso });
    } else if (preset === 'aug2026') {
      onFilterChange({ datePreset: 'aug2026', startDate: '2026-08-01', endDate: '2026-08-31' });
    } else {
      onFilterChange({ datePreset: 'custom' });
    }
  };

  const toggleCategory = (cat: string) => {
    const exists = filterState.categories.includes(cat);
    if (exists) {
      onFilterChange({ categories: filterState.categories.filter((c) => c !== cat) });
    } else {
      onFilterChange({ categories: [...filterState.categories, cat] });
    }
  };

  const toggleLocation = (loc: string) => {
    const exists = filterState.locations.includes(loc);
    if (exists) {
      onFilterChange({ locations: filterState.locations.filter((l) => l !== loc) });
    } else {
      onFilterChange({ locations: [...filterState.locations, loc] });
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors mb-6">
      {/* Top Row: Search + Quick Presets + Filter Count */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-zinc-100 dark:border-zinc-800">
        {/* Search Query Input */}
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder={`Search ${categoryLabel}, ${locationLabel}, records...`}
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full pl-9 pr-8 py-2.5 sm:py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {filterState.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Presets - Horizontally Scrollable on Mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs -mx-1 px-1">
          <span className="text-zinc-500 dark:text-zinc-400 font-bold text-[10px] uppercase tracking-wider mr-1 hidden xl:inline shrink-0 font-mono">
            PRESETS:
          </span>
          {[
            { id: 'all', label: 'All Dates' },
            { id: 'today', label: 'Today' },
            { id: 'last7', label: 'Last 7D' },
            { id: 'last30', label: 'Last 30D' },
            { id: 'custom', label: 'Custom' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleDatePresetChange(preset.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                filterState.datePreset === preset.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Status Count and Action Buttons */}
        <div className="flex items-center justify-between lg:justify-end gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {totalFilteredCount}/{totalRowCount} Rows
            </span>
          </div>

          {/* Map Columns / Schema Trigger Button */}
          {onOpenSchemaModal && (
            <button
              onClick={onOpenSchemaModal}
              title="Inspect or customize column mapping for this spreadsheet"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Map Fields</span>
            </button>
          )}

          {/* Toggle Advanced Filters Button */}
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isAdvancedOpen || activeAdvancedCount > 0
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                : 'bg-zinc-100 dark:bg-zinc-800/80 border-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeAdvancedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-mono">
                {activeAdvancedCount}
              </span>
            )}
            {isAdvancedOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className={`${isAdvancedOpen ? 'block' : 'hidden lg:block'} pt-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Custom Start / End Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-400" /> Date Boundary
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                aria-label="Start Date"
                value={filterState.startDate}
                onChange={(e) =>
                  onFilterChange({
                    startDate: e.target.value,
                    datePreset: 'custom',
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <input
                type="date"
                aria-label="End Date"
                value={filterState.endDate}
                onChange={(e) =>
                  onFilterChange({
                    endDate: e.target.value,
                    datePreset: 'custom',
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1 truncate">
                <Tag className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="truncate">{categoryLabel} Slicer</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {filterState.categories.length > 0 ? `${filterState.categories.length} selected` : 'All'}
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-20 sm:max-h-16 overflow-y-auto pr-1">
              {availableCategories.map((cat) => {
                const active = filterState.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                      active
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
              {availableCategories.length === 0 && (
                <span className="text-xs text-zinc-400">No {categoryLabel.toLowerCase()} items</span>
              )}
            </div>
          </div>

          {/* Location Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="truncate">{locationLabel} Slicer</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {filterState.locations.length > 0 ? `${filterState.locations.length} selected` : 'All'}
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-20 sm:max-h-16 overflow-y-auto pr-1">
              {availableLocations.map((loc) => {
                const active = filterState.locations.includes(loc);
                return (
                  <button
                    key={loc}
                    onClick={() => toggleLocation(loc)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors capitalize ${
                      active
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
              {availableLocations.length === 0 && (
                <span className="text-xs text-zinc-400">No {locationLabel.toLowerCase()} items</span>
              )}
            </div>
          </div>

          {/* Status Slicer */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1 truncate">
              <CheckCircle2 className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate">{statusLabel} Filter</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'yes', label: 'Positive / Done' },
                { id: 'no', label: 'Pending / Open' },
              ].map((status) => (
                <button
                  key={status.id}
                  onClick={() =>
                    onFilterChange({
                      installationStatus: status.id as FilterState['installationStatus'],
                    })
                  }
                  className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg border text-center transition-colors truncate ${
                    filterState.installationStatus === status.id
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-transparent shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
