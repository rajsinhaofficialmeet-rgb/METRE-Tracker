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
import { NormalizedSheetRow, SchemaConfig } from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatNumberCompact } from '../utils/dataParser';
import { BarChart3, PieChart as PieIcon, TrendingUp, MapPin } from 'lucide-react';

interface AnalyticsChartsProps {
  rows: NormalizedSheetRow[];
  schema?: SchemaConfig;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ rows, schema }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const gridColor = isDark ? '#27272a' : '#f4f4f5';
  const tooltipBg = isDark ? '#09090b' : '#ffffff';
  const tooltipBorder = isDark ? '#27272a' : '#e4e4e7';

  const dimensionName = schema?.categoryColumn || 'Category';
  const locationName = schema?.locationColumn || 'Location';
  const primaryMetricName = schema?.primaryMetricColumn || 'Items';
  const secondaryMetricName = schema?.secondaryMetricColumn || 'Store Counts';
  const statusName = schema?.statusColumn || 'Status';

  // 1. Aggregate by Primary Dimension
  const categoryDataMap: Record<
    string,
    { category: string; totalItems: number; installed: number; pending: number; storeCounts: number }
  > = {};

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
  const categoryChartData = Object.values(categoryDataMap).sort((a, b) => b.totalItems - a.totalItems).slice(0, 10);

  // 2. Aggregate by Secondary Location / Group
  const locationDataMap: Record<string, { location: string; items: number; storeCounts: number }> = {};
  rows.forEach((r) => {
    const loc = r.location || 'Other';
    if (!locationDataMap[loc]) {
      locationDataMap[loc] = { location: loc, items: 0, storeCounts: 0 };
    }
    locationDataMap[loc].items += r.noOfItems;
    locationDataMap[loc].storeCounts += r.storeCounts;
  });
  const locationChartData = Object.values(locationDataMap).sort((a, b) => b.items - a.items).slice(0, 10);

  // Colors for Palette
  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#3b82f6', '#14b8a6'];

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
                  ? entry.value >= 1000
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
      {/* 1. Primary Dimension & Status Bar Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                {primaryMetricName} by {dimensionName}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                Positive vs Pending volume across top {dimensionName.toLowerCase()} segments
              </p>
            </div>
          </div>
        </div>

        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="category" stroke={textColor} fontSize={10} tickLine={false} />
              <YAxis stroke={textColor} fontSize={10} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                formatter={(value) => (
                  <span className="text-zinc-600 dark:text-zinc-400 capitalize font-medium">
                    {value}
                  </span>
                )}
              />
              <Bar dataKey="installed" name={`Positive / Done (${statusName})`} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending / Open" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Secondary Location / Group Distribution Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                Volume by {locationName}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                Top {locationName.toLowerCase()} ranking by {primaryMetricName.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={locationChartData}
              layout="vertical"
              margin={{ top: 10, right: 15, left: 5, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" stroke={textColor} fontSize={10} tickLine={false} />
              <YAxis
                type="category"
                dataKey="location"
                stroke={textColor}
                fontSize={10}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="items" name={`Total ${primaryMetricName}`} fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Primary Dimension Volume Share (Donut) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <PieIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                {dimensionName} Percentage Share
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                Proportionate breakdown of {primaryMetricName.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="h-56 sm:h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={categoryChartData}
                dataKey="totalItems"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
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
                wrapperStyle={{ fontSize: '10px' }}
                formatter={(value, entry: any) => (
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                    {value} ({entry?.payload?.totalItems?.toLocaleString() || 0})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Secondary Metric Reach Trend / Comparison */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                {secondaryMetricName} Distribution
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                Aggregated {secondaryMetricName.toLowerCase()} across {locationName.toLowerCase()} zones
              </p>
            </div>
          </div>
        </div>

        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={locationChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="storeCountGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="location" stroke={textColor} fontSize={10} tickLine={false} />
              <YAxis
                stroke={textColor}
                fontSize={10}
                tickLine={false}
                width={35}
                tickFormatter={(val) => formatNumberCompact(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="storeCounts"
                name={secondaryMetricName}
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
