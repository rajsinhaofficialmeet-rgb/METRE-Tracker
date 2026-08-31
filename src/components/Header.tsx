import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  FileText, 
  Mail, 
  ExternalLink, 
  Sun, 
  Moon, 
  SlidersHorizontal,
  GraduationCap,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  sheetId: string;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  onManualSync: () => void;
  syncInterval: number; // in seconds, 0 = manual
  onChangeSyncInterval: (sec: number) => void;
  onOpenEmailModal: () => void;
  onOpenPDFModal: () => void;
  onOpenSettingsModal: () => void;
  rowCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  sheetId,
  lastSyncTime,
  isSyncing,
  onManualSync,
  syncInterval,
  onChangeSyncInterval,
  onOpenEmailModal,
  onOpenPDFModal,
  onOpenSettingsModal,
  rowCount,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Connecting...';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin}m ago`;
  };

  return (
    <header className="sticky top-0 z-30 transition-colors bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand: Official Mentors Eduserv */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-xs border border-indigo-500/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight leading-none text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  Mentors Eduserv
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Marketing Tracker
                </span>
                <span className="hidden md:inline-flex text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-semibold uppercase">
                  Official
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider font-mono truncate max-w-[280px] sm:max-w-md">
                Outdoor & Field Campaign Management • Sheet: {sheetId.substring(0, 14)}...
              </p>
            </div>
          </div>

          {/* Center: Live Sync Pulse Status Badge */}
          <div className="hidden lg:flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 rounded-full text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSyncing ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSyncing ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {isSyncing ? 'Syncing Sheet...' : 'Real-time Connected'}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                {formatLastSync()} ({rowCount} items)
              </span>
            </div>

            <div className="h-3.5 w-px bg-zinc-300 dark:bg-zinc-800" />

            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 dark:text-zinc-500 text-[11px] font-mono">Sync:</span>
              <select
                aria-label="Auto-sync interval"
                value={syncInterval}
                onChange={(e) => onChangeSyncInterval(Number(e.target.value))}
                className="bg-transparent font-medium font-mono text-zinc-700 dark:text-zinc-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value={10} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">10s</option>
                <option value={30} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">30s</option>
                <option value={60} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">1m</option>
                <option value={300} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">5m</option>
                <option value={0} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Manual</option>
              </select>
            </div>

            <button
              onClick={onManualSync}
              disabled={isSyncing}
              title="Force Sync Now from Google Spreadsheet"
              className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          </div>

          {/* Right: Bento Quick Action Bar */}
          <div className="flex items-center gap-2">
            {/* Sheet Link */}
            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
              title="Open source Google Sheet"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>Google Sheet</span>
            </a>

            {/* Email Distribution Button */}
            <button
              onClick={onOpenEmailModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Distribute</span>
            </button>

            {/* PDF Report Export Button */}
            <button
              onClick={onOpenPDFModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Full Screen Mode' : 'Enter Full Screen Mode'}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Sheet Settings */}
            <button
              onClick={onOpenSettingsModal}
              title="Spreadsheet & Sync Configuration"
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-zinc-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
