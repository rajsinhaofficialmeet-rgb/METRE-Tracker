import { SheetRow, NormalizedSheetRow, KPISummary } from '../types';
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
      totalRecords: 0
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
    totalRecords: rows.length
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
