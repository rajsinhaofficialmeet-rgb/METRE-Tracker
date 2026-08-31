import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { NormalizedSheetRow } from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatNumberCompact } from '../utils/dataParser';
import { BarChart3, PieChart as PieIcon, TrendingUp, MapPin } from 'lucide-react';

interface AnalyticsChartsProps {
  rows: NormalizedSheetRow[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ rows }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const gridColor = isDark ? '#27272a' : '#f4f4f5';
  const tooltipBg = isDark ? '#09090b' : '#ffffff';
  const tooltipBorder = isDark ? '#27272a' : '#e4e4e7';

  // 1. Aggregate by Category
  const categoryDataMap: Record<string, { category: string; totalItems: number; installed: number; pending: number; storeCounts: number }> = {};
  rows.forEach((r) => {
    const cat = r.category || 'General';
    if (!categoryDataMap[cat]) {
      categoryDataMap[cat] = { category: cat, totalItems: 0, installed: 0, pending: 0, storeCounts: 0 };
    }
    categoryDataMap[cat].totalItems += r.noOfItems;
    if (r.installationDone) {
      categoryDataMap[cat].installed += r.noOfItems;
    } else {
      categoryDataMap[cat].pending += r.noOfItems;
    }
    categoryDataMap[cat].storeCounts += r.storeCounts;
  });
  const categoryChartData = Object.values(categoryDataMap);

  // 2. Aggregate by Location
  const locationDataMap: Record<string, { location: string; items: number; storeCounts: number }> = {};
  rows.forEach((r) => {
    const loc = r.location || 'Other';
    if (!locationDataMap[loc]) {
      locationDataMap[loc] = { location: loc, items: 0, storeCounts: 0 };
    }
    locationDataMap[loc].items += r.noOfItems;
    locationDataMap[loc].storeCounts += r.storeCounts;
  });
  const locationChartData = Object.values(locationDataMap).sort((a, b) => b.items - a.items);

  // 3. Aggregate by Date
  const dateDataMap: Record<string, { date: string; items: number; storeCounts: number; installed: number }> = {};
  rows.forEach((r) => {
    const d = r.date || 'Undated';
    if (!dateDataMap[d]) {
      dateDataMap[d] = { date: d, items: 0, storeCounts: 0, installed: 0 };
    }
    dateDataMap[d].items += r.noOfItems;
    dateDataMap[d].storeCounts += r.storeCounts;
    if (r.installationDone) {
      dateDataMap[d].installed += r.noOfItems;
    }
  });
  const timelineChartData = Object.values(dateDataMap);

  // Colors for Category Palette
  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder,
          }}
          className="p-3 rounded-xl border shadow-xl text-xs font-sans"
        >
          <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 my-1">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                {typeof entry.value === 'number'
                  ? entry.value > 1000
                    ? entry.value.toLocaleString()
                    : entry.value
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* 1. Category Volume & Status Bar Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Items by Marketing Category
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Installed vs Pending items across active media channels
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="category" stroke={textColor} fontSize={11} tickLine={false} />
              <YAxis stroke={textColor} fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => (
                  <span className="text-zinc-600 dark:text-zinc-400 capitalize font-medium">
                    {value}
                  </span>
                )}
              />
              <Bar dataKey="installed" name="Installed" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Location Distribution Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Deployment by Geographic Location
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Total item count volume per regional deployment zone
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={locationChartData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" stroke={textColor} fontSize={11} tickLine={false} />
              <YAxis
                type="category"
                dataKey="location"
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                width={85}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="items" name="Total Items" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Category Volume Share (Donut) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Campaign Media Share
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Proportion of Hoardings, Banners, and Vinyls
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={categoryChartData}
                dataKey="totalItems"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
              >
                {categoryChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value, entry: any) => (
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                    {value} ({entry?.payload?.totalItems || 0} items)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Store Footprint Impact Trend */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Store Footprint Reach by Location
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Aggregated store counts & outreach density
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={locationChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="storeCountGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="location" stroke={textColor} fontSize={11} tickLine={false} />
              <YAxis
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => formatNumberCompact(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="storeCounts"
                name="Store Counts"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#storeCountGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
