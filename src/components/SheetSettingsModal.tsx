import React, { useState } from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Link,
  ShieldCheck,
  Zap,
  Code2,
  Copy,
  Check,
  AlertTriangle,
  Server,
  Cloud,
  FileSpreadsheet,
} from 'lucide-react';
import { generateGoogleAppsScriptCode } from '../services/sheetService';

interface SheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheetId: string;
  onUpdateSheetId: (newId: string) => void;
  syncInterval: number;
  onChangeSyncInterval: (sec: number) => void;
  lastSyncTime: Date | null;
  onRefresh: () => void;
  appsScriptUrl?: string;
  onUpdateAppsScriptUrl?: (url: string) => void;
  activeSyncSource?: string;
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
  appsScriptUrl = '',
  onUpdateAppsScriptUrl,
  activeSyncSource = 'direct-csv',
}) => {
  const [inputUrlOrId, setInputUrlOrId] = useState(currentSheetId);
  const [inputWebhook, setInputWebhook] = useState(appsScriptUrl);
  const [activeTab, setActiveTab] = useState<'config' | 'appscript' | 'vercel'>('config');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const scriptCode = generateGoogleAppsScriptCode();

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTestWebhook = async () => {
    if (!inputWebhook || !inputWebhook.startsWith('http')) {
      alert('Please enter a valid Google Apps Script Web App URL starting with https://');
      return;
    }
    setTestingWebhook(true);
    setWebhookStatus('idle');
    try {
      const res = await fetch(`${inputWebhook}?action=read&t=${Date.now()}`);
      if (res.ok) {
        setWebhookStatus('success');
      } else {
        setWebhookStatus('error');
      }
    } catch (e) {
      setWebhookStatus('error');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let extractedId = inputUrlOrId.trim();

    // Extract ID if full URL pasted
    const match = extractedId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }

    onUpdateSheetId(extractedId);
    if (onUpdateAppsScriptUrl) {
      onUpdateAppsScriptUrl(inputWebhook.trim());
    }

    setSaveMessage('Settings saved! Spreadsheet synced successfully.');
    setTimeout(() => {
      setSaveMessage(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shrink-0">
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Google Sheets & Vercel Sync Settings
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Configure real-time reading, 2-way write sync & Vercel deployment
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'config'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Connection & Polling</span>
          </button>

          <button
            onClick={() => setActiveTab('appscript')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'appscript'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>2-Way Write Sync (Apps Script)</span>
          </button>

          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'vercel'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-indigo-400" />
            <span>Vercel Fix & Setup</span>
          </button>
        </div>

        {/* Tab 1: Config */}
        {activeTab === 'config' && (
          <form onSubmit={handleSave} className="py-4 space-y-4 text-xs">
            {/* Active Sync Status Notice */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Live Sync Status
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {activeSyncSource === 'apps-script'
                    ? '2-Way Webhook Live'
                    : activeSyncSource === 'api'
                    ? 'Serverless API Active'
                    : 'Direct Cloud Fetch (Vercel Ready)'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Data is fetched in real-time with zero-cache bypass, ensuring instant updates when deployed on Vercel or any static host.
              </p>
            </div>

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
              <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400 font-mono">
                <span>Default: 1p7_1ApCl2B4t4nWWLnYn3jN7bjOxXSyqzZxdO70hvxY</span>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${currentSheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Sync Frequency */}
            <div>
              <label className="text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
                Live Auto-Refresh Polling Interval
              </label>
              <select
                aria-label="Live Auto-Refresh Polling Interval"
                value={syncInterval}
                onChange={(e) => onChangeSyncInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value={10}>Real-time Polling (Every 10 seconds - Recommended)</option>
                <option value={30}>Standard Refresh (Every 30 seconds)</option>
                <option value={60}>Moderate Refresh (Every 1 minute)</option>
                <option value={300}>Low Bandwidth (Every 5 minutes)</option>
                <option value={0}>Manual Refresh Only</option>
              </select>
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
        )}

        {/* Tab 2: 2-Way Apps Script Webhook */}
        {activeTab === 'appscript' && (
          <div className="py-4 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-amber-900 dark:text-amber-200">
              <div className="font-semibold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Why is Google Apps Script needed for 2-Way Editing?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                Google Sheets CSV exports are <strong>read-only</strong>. To allow the dashboard to <strong>write new rows, edit values, or toggle installation status directly into your live spreadsheet</strong> without server costs or Google Cloud OAuth keys, deploy this free Google Apps Script web app in 1 minute!
              </p>
            </div>

            {/* Webhook URL Input */}
            <div>
              <label className="text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
                Google Apps Script Web App URL (for Write & Edit Sync)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputWebhook}
                  onChange={(e) => setInputWebhook(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || !inputWebhook}
                  className="px-3 py-2 rounded-xl font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors disabled:opacity-50"
                >
                  {testingWebhook ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              {webhookStatus === 'success' && (
                <p className="text-emerald-500 mt-1 text-[11px] flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Webhook verified! 2-way read & write sync is fully active.
                </p>
              )}
              {webhookStatus === 'error' && (
                <p className="text-rose-500 mt-1 text-[11px] flex items-center gap-1 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Could not connect to Webhook. Check that 'Who has access' is set to 'Anyone'.
                </p>
              )}
            </div>

            {/* Steps & Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Step-by-Step 1-Minute Setup Guide
                </span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 font-mono font-semibold"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Apps Script Code'}</span>
                </button>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 leading-relaxed font-sans">
                <li>Open your Google Sheet and click <strong>Extensions</strong> → <strong>Apps Script</strong>.</li>
                <li>Delete any code in the editor, click <strong>"Copy Apps Script Code"</strong> above, and paste it.</li>
                <li>Click <strong>Deploy</strong> (top right) → <strong>New deployment</strong>.</li>
                <li>Click the Gear icon ⚙️ → Select <strong>Web app</strong>.</li>
                <li>Set <em>"Execute as"</em> to <strong>Me</strong>, and <em>"Who has access"</em> to <strong>Anyone</strong>.</li>
                <li>Click <strong>Deploy</strong>, copy the generated Web app URL, and paste it into the field above!</li>
              </ol>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateAppsScriptUrl) {
                    onUpdateAppsScriptUrl(inputWebhook.trim());
                  }
                  setSaveMessage('Webhook URL saved!');
                  setTimeout(() => {
                    setSaveMessage(null);
                    onClose();
                  }, 1200);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs"
              >
                Save Webhook
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Vercel Deployment Guide */}
        {activeTab === 'vercel' && (
          <div className="py-4 space-y-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2 text-indigo-900 dark:text-indigo-200">
              <div className="font-semibold flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-indigo-500" />
                <span>Why didn't the Sheet update on Vercel previously?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-indigo-800 dark:text-indigo-300/90">
                1. <strong>Static Build on Vercel:</strong> Vercel runs <code className="bg-indigo-900/20 px-1 py-0.5 rounded font-mono">vite build</code> and produces static HTML/JS files without running Express <code className="bg-indigo-900/20 px-1 py-0.5 rounded font-mono">server.ts</code>. Previously, API calls to <code className="bg-indigo-900/20 px-1 py-0.5 rounded font-mono">/api/sheet-data</code> failed with 404.<br />
                2. <strong>Browser Cache:</strong> Google Sheets CSV URLs are cached by CDN unless a cache-busting timestamp is attached.<br />
                3. <strong>Write Permissions:</strong> Google Sheets cannot be edited without authorization.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">
                Fixes Now Applied to the Repository:
              </h4>
              <ul className="space-y-2 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                <li className="flex items-start gap-2 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Direct Browser Fetch Fallback:</strong> Even if deployed as pure static on Vercel, the app fetches directly from Google Sheets with live cache-busting.</span>
                </li>
                <li className="flex items-start gap-2 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Vercel Serverless Functions:</strong> Added <code className="text-indigo-400">api/sheet-data.ts</code> and <code className="text-indigo-400">vercel.json</code> for seamless backend execution on Vercel.</span>
                </li>
                <li className="flex items-start gap-2 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Environment Variables on Vercel:</strong> In your Vercel Project Settings → Environment Variables, add <code className="text-indigo-400">GEMINI_API_KEY</code> for AI features.</span>
                </li>
                <li className="flex items-start gap-2 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Google Sheet Permissions:</strong> Ensure your Google Sheet sharing is set to <em>"Anyone with the link can view"</em>.</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs"
              >
                Got It, Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
