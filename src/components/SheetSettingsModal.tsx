import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Table,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Link,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface SheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheetId: string;
  onUpdateSheetId: (newId: string) => void;
  syncInterval: number;
  onChangeSyncInterval: (sec: number) => void;
  lastSyncTime: Date | null;
  onRefresh: () => void;
}

export const SheetSettingsModal: React.FC<SheetSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSheetId,
  onUpdateSheetId,
  syncInterval,
  onChangeSyncInterval,
  lastSyncTime,
  onRefresh,
}) => {
  const [inputUrlOrId, setInputUrlOrId] = useState(currentSheetId);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let extractedId = inputUrlOrId.trim();

    // Extract ID if full URL pasted
    const match = extractedId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }

    onUpdateSheetId(extractedId);
    setSaveMessage('Spreadsheet source updated successfully!');
    setTimeout(() => {
      setSaveMessage(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
              <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Spreadsheet & Synchronization Settings
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Manage live Google Sheets integration and background synchronization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="py-4 space-y-4 text-xs">
          {/* Active Sheet URL / ID */}
          <div>
            <label className="text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
              Google Spreadsheet ID or Sharing URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputUrlOrId}
                onChange={(e) => setInputUrlOrId(e.target.value)}
                className="w-full px-3 py-2 pl-9 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                placeholder="Paste Google Sheet URL or ID"
                required
              />
              <Link className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
              Default connected sheet: <span className="text-indigo-400">1p7_1ApCl2B4t4nWWLnYn3jN7bjOxXSyqzZxdO70hvxY</span>
            </p>
          </div>

          {/* Sync Frequency */}
          <div>
            <label className="text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
              Auto-Sync Frequency
            </label>
            <select
              aria-label="Auto-Sync Frequency"
              value={syncInterval}
              onChange={(e) => onChangeSyncInterval(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              <option value={10}>Real-time Polling (Every 10 seconds)</option>
              <option value={30}>Standard Refresh (Every 30 seconds)</option>
              <option value={60}>Moderate Refresh (Every 1 minute)</option>
              <option value={300}>Low Bandwidth (Every 5 minutes)</option>
              <option value={0}>Manual Refresh Only</option>
            </select>
          </div>

          {/* Integration Status Card */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Google Workspace Connectivity
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Live bi-directional synchronization enabled for Google Sheets & Gmail distribution.
            </p>
          </div>

          {saveMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{saveMessage}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                onRefresh();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Force Sync Now</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
