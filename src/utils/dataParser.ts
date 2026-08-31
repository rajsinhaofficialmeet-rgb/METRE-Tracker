import { SheetRow, NormalizedSheetRow, KPISummary, InstallationGrowthKPI, SchemaConfig } from '../types';
import { parseSheetDate } from './dateUtils';
import { parseBooleanStatus, parseNumberSafe, detectSheetSchema } from './schemaDetector';

/**
 * Normalizes raw sheet rows using dynamic schema mapping
 */
export function normalizeSheetRows(
  rawRows: SheetRow[],
  schemaConfig?: SchemaConfig
): NormalizedSheetRow[] {
  if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

  // If no schema provided, run auto-detection
  const schema = schemaConfig || detectSheetSchema(rawRows);

  return rawRows.map((row, index) => {
    // Extract raw fields safely
    const rawRecord: Record<string, any> = { ...row };

    // 1. ID / Sl No.
    const idVal = row[schema.idColumn] ?? row['Sl No.'] ?? row['id'] ?? index + 1;
    const slNo = typeof idVal === 'number' ? idVal : (parseInt(String(idVal), 10) || index + 1);

    // 2. Primary Category Dimension
    const categoryRaw = row[schema.categoryColumn] ?? row['Category'] ?? row['Type'] ?? row['Product'] ?? 'General';
    const category = String(categoryRaw || 'General').trim();

    // 3. Date
    const dateRaw = String(row[schema.dateColumn] ?? row['Date'] ?? row['Created'] ?? '').trim();
    const { date, iso } = parseSheetDate(dateRaw);

    // 4. Status / Boolean
    const statusRaw = row[schema.statusColumn] ?? row['Installation Done'] ?? row['Status'] ?? row['Done'] ?? '';
    const installationDone = parseBooleanStatus(statusRaw);
    const installationStatusText = String(statusRaw || (installationDone ? 'Yes' : 'Pending')).trim();

    // 5. Secondary Location / Group Dimension
    const locationRaw = row[schema.locationColumn] ?? row['Location'] ?? row['City'] ?? row['Region'] ?? 'General';
    const location = String(locationRaw || 'General').trim();

    // 6. Primary Metric
    const primaryMetricRaw = row[schema.primaryMetricColumn] ?? row['No. of items'] ?? row['Quantity'] ?? row['Amount'] ?? 0;
    const noOfItems = parseNumberSafe(primaryMetricRaw);

    // 7. Store Location (or 3rd dimension if exists)
    const storeLocation = String(row['Store Location'] ?? row['Address'] ?? row['Site'] ?? '').trim();

    // 8. Secondary Metric
    const secondaryMetricRaw = row[schema.secondaryMetricColumn] ?? row['Store Counts'] ?? row['Stores'] ?? row['Reach'] ?? 0;
    const storeCounts = parseNumberSafe(secondaryMetricRaw);

    return {
      id: row._id || `row-${index + 1}-${slNo}`,
      slNo,
      category,
      date: dateRaw,
      parsedDate: date,
      isoDate: iso,
      installationDone,
      installationStatusText,
      location,
      noOfItems,
      storeLocation,
      storeCounts,
      _raw: rawRecord,
      ...rawRecord, // Allow direct property access to any sheet column
    };
  });
}

export function computeInstallationGrowth(
  rows: NormalizedSheetRow[]
): InstallationGrowthKPI {
  const installedRows = rows.filter((r) => r.installationDone);

  if (installedRows.length === 0) {
    return {
      growthPercentage: 0,
      formattedPercentage: '0.0%',
      trend: 'neutral',
      currentWeekRecords: 0,
      previousWeekRecords: 0,
      currentWeekItems: 0,
      previousWeekItems: 0,
      hasPreviousWeekData: false,
    };
  }

  // Get rows with parsed dates
  const datedRows = installedRows
    .map((r) => ({
      row: r,
      time: r.parsedDate
        ? r.parsedDate.getTime()
        : r.isoDate
        ? new Date(r.isoDate).getTime()
        : 0,
    }))
    .filter((item) => !isNaN(item.time) && item.time > 0)
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
      hasPreviousWeekData: false,
    };
  }

  // Anchor to the latest date in the filtered dataset
  const latestItem = datedRows[datedRows.length - 1];
  const latestDate = new Date(latestItem.time);

  // 7-day rolling windows
  const currentEnd = new Date(
    latestDate.getFullYear(),
    latestDate.getMonth(),
    latestDate.getDate(),
    23,
    59,
    59,
    999
  ).getTime();
  const currentStart = new Date(
    latestDate.getFullYear(),
    latestDate.getMonth(),
    latestDate.getDate() - 6,
    0,
    0,
    0,
    0
  ).getTime();
  const prevEnd = new Date(
    latestDate.getFullYear(),
    latestDate.getMonth(),
    latestDate.getDate() - 7,
    23,
    59,
    59,
    999
  ).getTime();
  const prevStart = new Date(
    latestDate.getFullYear(),
    latestDate.getMonth(),
    latestDate.getDate() - 13,
    0,
    0,
    0,
    0
  ).getTime();

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
    hasPreviousWeekData,
  };
}

export function computeKPISummary(
  rows: NormalizedSheetRow[],
  schema?: SchemaConfig
): KPISummary {
  const primaryMetricLabel = schema?.primaryMetricColumn || 'Total Items';
  const secondaryMetricLabel = schema?.secondaryMetricColumn || 'Store Counts';
  const primaryDimensionLabel = schema?.categoryColumn || 'Category';
  const secondaryDimensionLabel = schema?.locationColumn || 'Location';
  const statusLabel = schema?.statusColumn || 'Installation Done';

  if (rows.length === 0) {
    return {
      primaryMetricLabel,
      secondaryMetricLabel,
      primaryDimensionLabel,
      secondaryDimensionLabel,
      statusLabel,
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
        hasPreviousWeekData: false,
      },
      dimensionBreakdown: [],
    };
  }

  let totalItems = 0;
  let installedItems = 0;
  let totalStoreCounts = 0;
  const locationMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};

  rows.forEach((r) => {
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
  const completionRate =
    totalItems > 0 ? Math.round((installedItems / totalItems) * 100) : 100;

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

  const dimensionBreakdown = Object.entries(categoryMap)
    .map(([name, items]) => ({
      name,
      items,
      percentage: totalItems > 0 ? Math.round((items / totalItems) * 100) : 0,
    }))
    .sort((a, b) => b.items - a.items);

  const installationGrowth = computeInstallationGrowth(rows);

  return {
    primaryMetricLabel,
    secondaryMetricLabel,
    primaryDimensionLabel,
    secondaryDimensionLabel,
    statusLabel,
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
    installationGrowth,
    dimensionBreakdown,
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
