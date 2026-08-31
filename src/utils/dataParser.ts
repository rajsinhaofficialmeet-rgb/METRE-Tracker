import { SheetRow, NormalizedSheetRow, KPISummary, InstallationGrowthKPI } from '../types';
import { parseSheetDate } from './dateUtils';

export function normalizeSheetRows(rawRows: SheetRow[]): NormalizedSheetRow[] {
  if (!Array.isArray(rawRows)) return [];

  return rawRows.map((row, index) => {
    const slNo = parseInt(String(row['Sl No.'] || index + 1), 10) || index + 1;
    const category = String(row['Category'] || 'General').trim();
    const dateRaw = String(row['Date'] || '').trim();
    const { date, iso } = parseSheetDate(dateRaw);
    const installDoneRaw = String(row['Installation Done'] || '').trim().toLowerCase();
    const installationDone = installDoneRaw === 'yes' || installDoneRaw === 'true' || installDoneRaw === 'done' || installDoneRaw === '1';
    const location = String(row['Location'] || 'Unspecified').trim();
    const noOfItems = parseFloat(String(row['No. of items'] || 0).replace(/[^0-9.-]/g, '')) || 0;
    const storeLocation = String(row['Store Location'] || '').trim();
    const storeCounts = parseFloat(String(row['Store Counts'] || 0).replace(/[^0-9.-]/g, '')) || 0;

    return {
      id: row._id || `row-${index + 1}-${slNo}`,
      slNo,
      category,
      date: dateRaw,
      parsedDate: date,
      isoDate: iso,
      installationDone,
      installationStatusText: installationDone ? 'Yes' : 'Pending',
      location,
      noOfItems,
      storeLocation,
      storeCounts,
    };
  });
}

export function computeInstallationGrowth(rows: NormalizedSheetRow[]): InstallationGrowthKPI {
  const installedRows = rows.filter(r => r.installationDone);
  
  if (installedRows.length === 0) {
    return {
      growthPercentage: 0,
      formattedPercentage: '0.0%',
      trend: 'neutral',
      currentWeekRecords: 0,
      previousWeekRecords: 0,
      currentWeekItems: 0,
      previousWeekItems: 0,
      hasPreviousWeekData: false
    };
  }

  // Get rows with parsed dates
  const datedRows = installedRows
    .map(r => ({
      row: r,
      time: r.parsedDate ? r.parsedDate.getTime() : (r.isoDate ? new Date(r.isoDate).getTime() : 0)
    }))
    .filter(item => !isNaN(item.time) && item.time > 0)
    .sort((a, b) => a.time - b.time);

  if (datedRows.length === 0) {
    return {
      growthPercentage: 0,
      formattedPercentage: '0.0%',
      trend: 'neutral',
      currentWeekRecords: installedRows.length,
      previousWeekRecords: 0,
      currentWeekItems: installedRows.reduce((sum, r) => sum + r.noOfItems, 0),
      previousWeekItems: 0,
      hasPreviousWeekData: false
    };
  }

  // Anchor to the latest date in the filtered dataset
  const latestItem = datedRows[datedRows.length - 1];
  const latestDate = new Date(latestItem.time);
  
  // 7-day rolling windows
  const currentEnd = new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 23, 59, 59, 999).getTime();
  const currentStart = new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate() - 6, 0, 0, 0, 0).getTime();
  const prevEnd = new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate() - 7, 23, 59, 59, 999).getTime();
  const prevStart = new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate() - 13, 0, 0, 0, 0).getTime();

  let currentWeekRecords = 0;
  let previousWeekRecords = 0;
  let currentWeekItems = 0;
  let previousWeekItems = 0;

  datedRows.forEach(({ row, time }) => {
    if (time >= currentStart && time <= currentEnd) {
      currentWeekRecords++;
      currentWeekItems += row.noOfItems;
    } else if (time >= prevStart && time <= prevEnd) {
      previousWeekRecords++;
      previousWeekItems += row.noOfItems;
    }
  });

  if (currentWeekRecords === 0) {
    currentWeekRecords = datedRows.length;
    currentWeekItems = datedRows.reduce((acc, d) => acc + d.row.noOfItems, 0);
  }

  let growthPercentage = 0;
  let trend: 'growth' | 'decline' | 'neutral' = 'neutral';
  let formattedPercentage = '0.0%';
  const hasPreviousWeekData = previousWeekRecords > 0;

  if (previousWeekRecords === 0) {
    if (currentWeekRecords > 0) {
      growthPercentage = 100;
      trend = 'growth';
      formattedPercentage = '+100%';
    } else {
      growthPercentage = 0;
      trend = 'neutral';
      formattedPercentage = '0.0%';
    }
  } else {
    const diff = currentWeekRecords - previousWeekRecords;
    growthPercentage = Math.round((diff / previousWeekRecords) * 1000) / 10;
    if (growthPercentage > 0) {
      trend = 'growth';
      formattedPercentage = `+${growthPercentage.toFixed(1)}%`;
    } else if (growthPercentage < 0) {
      trend = 'decline';
      formattedPercentage = `${growthPercentage.toFixed(1)}%`;
    } else {
      trend = 'neutral';
      formattedPercentage = '0.0%';
    }
  }

  return {
    growthPercentage,
    formattedPercentage,
    trend,
    currentWeekRecords,
    previousWeekRecords,
    currentWeekItems,
    previousWeekItems,
    hasPreviousWeekData
  };
}

export function computeKPISummary(rows: NormalizedSheetRow[]): KPISummary {
  if (rows.length === 0) {
    return {
      totalItems: 0,
      installedItems: 0,
      pendingItems: 0,
      completionRate: 0,
      totalStoreCounts: 0,
      uniqueLocations: 0,
      uniqueCategories: 0,
      topLocation: { name: 'N/A', items: 0 },
      topCategory: { name: 'N/A', items: 0 },
      totalRecords: 0,
      installationGrowth: {
        growthPercentage: 0,
        formattedPercentage: '0.0%',
        trend: 'neutral',
        currentWeekRecords: 0,
        previousWeekRecords: 0,
        currentWeekItems: 0,
        previousWeekItems: 0,
        hasPreviousWeekData: false
      }
    };
  }

  let totalItems = 0;
  let installedItems = 0;
  let totalStoreCounts = 0;
  const locationMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};

  rows.forEach(r => {
    totalItems += r.noOfItems;
    if (r.installationDone) {
      installedItems += r.noOfItems;
    }
    totalStoreCounts += r.storeCounts;

    if (r.location) {
      locationMap[r.location] = (locationMap[r.location] || 0) + r.noOfItems;
    }
    if (r.category) {
      categoryMap[r.category] = (categoryMap[r.category] || 0) + r.noOfItems;
    }
  });

  const pendingItems = Math.max(0, totalItems - installedItems);
  const completionRate = totalItems > 0 ? Math.round((installedItems / totalItems) * 100) : 100;

  // Find top location
  let topLocation = { name: 'None', items: 0 };
  Object.entries(locationMap).forEach(([loc, items]) => {
    if (items > topLocation.items) {
      topLocation = { name: loc, items };
    }
  });

  // Find top category
  let topCategory = { name: 'None', items: 0 };
  Object.entries(categoryMap).forEach(([cat, items]) => {
    if (items > topCategory.items) {
      topCategory = { name: cat, items };
    }
  });

  const installationGrowth = computeInstallationGrowth(rows);

  return {
    totalItems,
    installedItems,
    pendingItems,
    completionRate,
    totalStoreCounts,
    uniqueLocations: Object.keys(locationMap).length,
    uniqueCategories: Object.keys(categoryMap).length,
    topLocation,
    topCategory,
    totalRecords: rows.length,
    installationGrowth
  };
}

export function formatNumberCompact(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}
