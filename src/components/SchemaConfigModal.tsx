import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Database,
  Hash,
  Calendar,
  ToggleLeft,
  Type,
  RotateCcw,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ColumnMeta, SchemaConfig } from '../types';

interface SchemaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnMeta[];
  currentSchema: SchemaConfig;
  onSaveSchema: (newSchema: SchemaConfig) => void;
  onResetToAuto: () => void;
  sheetTitle: string;
}

export const SchemaConfigModal: React.FC<SchemaConfigModalProps> = ({
  isOpen,
  onClose,
  columns,
  currentSchema,
  onSaveSchema,
  onResetToAuto,
  sheetTitle,
}) => {
  const [schema, setSchema] = useState<SchemaConfig>({ ...currentSchema });
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof SchemaConfig, value: string) => {
    setSchema((prev) => ({
      ...prev,
      [field]: value,
      autoDetected: false,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchema(schema);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  const handleReset = () => {
    onResetToAuto();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const getColumnTypeIcon = (type: ColumnMeta['type']) => {
    switch (type) {
      case 'number':
        return <Hash className="w-3.5 h-3.5 text-indigo-500" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-blue-500" />;
      case 'boolean':
        return <ToggleLeft className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Type className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Adaptive Sheet Schema & Field Mapping
                </h2>
                {schema.autoDetected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Auto-Detected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Custom Mapped
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Map any Google Sheet's columns to KPIs, Slicers, Timeline & Visualizations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 rounded-lg text-sm min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="py-4 space-y-5 text-xs">
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>Active Dataset: {sheetTitle || 'Google Spreadsheet'}</span>
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                {columns.length} columns detected
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              The AI engine automatically infers dates, numbers, boolean statuses, and category groups. You can customize how each column is mapped below to adjust the dashboard KPIs and charts.
            </p>
          </div>

          {/* Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Category Dimension */}
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Primary Category Dimension</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">Charts & Filter Slicer</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Main categorical group (e.g., Category, Product Type, Department, Media Type).
              </p>
              <select
                aria-label="Primary Category Dimension"
                value={schema.categoryColumn}
                onChange={(e) => handleFieldChange('categoryColumn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              >
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.key} ({c.type}, {c.uniqueCount} unique)
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Location / Subgroup Dimension */}
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Secondary Location / Subgroup</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">Geography & Location KPI</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Regional or secondary group (e.g., Location, City, Branch, Zone, Store).
              </p>
              <select
                aria-label="Secondary Location / Subgroup"
                value={schema.locationColumn}
                onChange={(e) => handleFieldChange('locationColumn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              >
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.key} ({c.type}, {c.uniqueCount} unique)
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Metric (Quantity / Items / Value) */}
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Primary Metric Column</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">Main Volume KPI</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Numeric volume or count (e.g., No. of items, Quantity, Sales, Revenue, Amount).
              </p>
              <select
                aria-label="Primary Metric Column"
                value={schema.primaryMetricColumn}
                onChange={(e) => handleFieldChange('primaryMetricColumn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              >
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.key} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Metric (Store Counts / Reach / Cost) */}
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-purple-500" />
                  <span>Secondary Metric Column</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">Secondary KPI</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Additional metric (e.g., Store Counts, Reach, Budget, Impressions, Target).
              </p>
              <select
                aria-label="Secondary Metric Column"
                value={schema.secondaryMetricColumn}
                onChange={(e) => handleFieldChange('secondaryMetricColumn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              >
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.key} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Column */}
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Date & Timeline Column</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">Date Slicer & Velocity</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Date or timestamp field used for period ranges and weekly growth velocity.
              </p>
              <select
                aria-label="Date & Timeline Column"
                value={schema.dateColumn}
                onChange={(e) => handleFieldChange('dateColumn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              >
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.key} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Status / Boolean Column */}
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <ToggleLeft className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Status / Completion Column</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">Progress KPI & Status Slicer</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Status indicator (e.g., Installation Done, Status, Active, Completed, Shipped).
              </p>
              <select
                aria-label="Status / Completion Column"
                value={schema.statusColumn}
                onChange={(e) => handleFieldChange('statusColumn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              >
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.key} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Detected Columns Inspector Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-zinc-500" />
              <span>Detected Columns & Data Sampling</span>
            </h4>

            <div className="max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 font-mono sticky top-0">
                  <tr>
                    <th className="p-2.5">Column Header</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Unique Count</th>
                    <th className="p-2.5">Sample Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono">
                  {columns.map((c) => (
                    <tr
                      key={c.key}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-200">
                        {c.key}
                      </td>
                      <td className="p-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 capitalize">
                          {getColumnTypeIcon(c.type)}
                          <span>{c.type}</span>
                        </span>
                      </td>
                      <td className="p-2.5 text-zinc-500">{c.uniqueCount}</td>
                      <td className="p-2.5 text-zinc-500 truncate max-w-xs">
                        {c.sampleValues.join(', ') || '(empty)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Schema mapping updated successfully!</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Auto-Detect All</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs"
              >
                Apply Schema
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
