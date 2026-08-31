import React from 'react';
import { 
  Package, 
  CheckCircle, 
  Building2, 
  MapPin, 
  Layers, 
  TrendingUp,
  Percent,
  Sparkles
} from 'lucide-react';
import { KPISummary } from '../types';
import { formatNumberCompact } from '../utils/dataParser';

interface KPIGridProps {
  kpis: KPISummary;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Deployment Items */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Deployment Items
            </p>
            <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-1.5 tracking-tight font-mono">
              {kpis.totalItems.toLocaleString()}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/60">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5">
          <span className="font-mono">{kpis.totalRecords} Records</span>
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            {kpis.uniqueCategories} Categories
          </span>
        </div>
      </div>

      {/* 2. Installation Completion Rate */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Installation Velocity
            </p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight font-mono">
                {kpis.completionRate}%
              </h3>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
                {kpis.installedItems} done
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Percent className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${kpis.completionRate}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
            <span>Done: {kpis.installedItems}</span>
            <span>Pending: {kpis.pendingItems}</span>
          </div>
        </div>
      </div>

      {/* 3. Total Store Footprint / Counts */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Store Counts / Footprint
            </p>
            <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-1.5 tracking-tight font-mono">
              {formatNumberCompact(kpis.totalStoreCounts)}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5">
          <span className="font-mono truncate max-w-[140px]">{kpis.totalStoreCounts.toLocaleString()}</span>
          <span className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> High Reach
          </span>
        </div>
      </div>

      {/* 4. Top Deployment Location */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Top Location Hotspot
            </p>
            <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-1.5 tracking-tight capitalize truncate max-w-[180px]">
              {kpis.topLocation.name || 'None'}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <MapPin className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5">
          <span className="font-mono">{kpis.topLocation.items} Items Deployed</span>
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            {kpis.uniqueLocations} Locations
          </span>
        </div>
      </div>
    </div>
  );
};
