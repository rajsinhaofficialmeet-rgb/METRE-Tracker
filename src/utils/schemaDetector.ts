import { ColumnMeta, SchemaConfig, SheetRow } from '../types';
import { parseSheetDate } from './dateUtils';

// Common keywords for semantic classification
const CATEGORY_KEYWORDS = [
  'category', 'type', 'product', 'genre', 'department', 'segment', 
  'channel', 'group', 'campaign', 'media', 'item type', 'service', 
  'class', 'source', 'platform', 'name', 'brand', 'designation'
];

const LOCATION_KEYWORDS = [
  'location', 'city', 'state', 'region', 'branch', 'zone', 
  'address', 'country', 'store location', 'area', 'hub', 
  'site', 'territory', 'market', 'district', 'center', 'place'
];

const DATE_KEYWORDS = [
  'date', 'created', 'created_at', 'timestamp', 'time', 'day', 
  'period', 'installation date', 'event date', 'order date', 
  'start date', 'end date', 'updated', 'month', 'year'
];

const STATUS_KEYWORDS = [
  'status', 'installation done', 'installed', 'done', 'completed', 
  'is_active', 'active', 'state', 'shipped', 'delivered', 'passed', 
  'approved', 'verified', 'resolution', 'stage', 'closed', 'flag', 'success'
];

const PRIMARY_METRIC_KEYWORDS = [
  'no. of items', 'no of items', 'items', 'quantity', 'qty', 
  'units', 'amount', 'total', 'count', 'value', 'sales', 
  'revenue', 'volume', 'score', 'price', 'number', 'size', 'records'
];

const SECONDARY_METRIC_KEYWORDS = [
  'store counts', 'store count', 'stores', 'reach', 'impressions', 
  'cost', 'budget', 'target', 'views', 'clicks', 'footprint', 
  'capacity', 'hours', 'leads', 'conversions', 'profit', 'spend', 'weight'
];

const ID_KEYWORDS = [
  'sl no', 'sl. no.', 'sl.no', 'sl no.', 'id', 'sn', 's.no', 
  's no', 'index', 'code', 'ticket', 'key', 'uuid', 'order id', '#'
];

/**
 * Helper to test if a key is a valid human column name
 */
export function isValidColumnHeader(header: string): boolean {
  if (!header || typeof header !== 'string') return false;
  const trimmed = header.trim();
  if (!trimmed || trimmed.startsWith('_')) return false;
  if (trimmed.startsWith('<') || trimmed.includes('<!DOCTYPE') || trimmed.includes('<html') || trimmed.includes('<script')) return false;
  if (trimmed.includes('function(') || trimmed.includes('prototype') || trimmed.includes('deleteIsEnforced') || trimmed.includes('disableAllReporting')) return false;
  if (trimmed.includes('{') || trimmed.includes('}') || trimmed.includes(';') || trimmed.includes('\\x') || trimmed.includes('=>')) return false;
  if (trimmed.length > 80) return false;
  return true;
}

/**
 * Checks if a value looks like a boolean or status string
 */
export function isBooleanLike(val: any): boolean {
  if (typeof val === 'boolean') return true;
  if (typeof val !== 'string') return false;
  const lower = val.trim().toLowerCase();
  return [
    'yes', 'no', 'true', 'false', 'done', 'pending', 
    'completed', 'incomplete', 'active', 'inactive', 
    'y', 'n', 'pass', 'fail', 'approved', 'rejected', '1', '0'
  ].includes(lower);
}

/**
 * Converts any boolean-like string into a boolean
 */
export function parseBooleanStatus(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const str = String(val).trim().toLowerCase();
  return ['yes', 'true', 'done', 'completed', 'active', 'y', 'pass', 'approved', '1', 'success', 'installed', 'verified'].includes(str);
}

/**
 * Checks if a string can be safely parsed as a valid numeric value
 */
export function parseNumberSafe(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  if (typeof val === 'string') {
    // Clean currency symbols, commas, spaces, percentages
    const clean = val.replace(/[\$,₹,€,£,%]/g, '').trim().replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Inspects all columns in rawRows and calculates their metadata
 */
export function inspectColumns(rawRows: Record<string, any>[]): ColumnMeta[] {
  if (!rawRows || rawRows.length === 0) return [];

  // 1. Gather all unique valid column keys from all rows
  const keySet = new Set<string>();
  rawRows.forEach((row) => {
    Object.keys(row).forEach((k) => {
      const cleanKey = k.trim();
      if (cleanKey && isValidColumnHeader(cleanKey)) {
        keySet.add(cleanKey);
      }
    });
  });

  const allKeys = Array.from(keySet);
  if (allKeys.length === 0) return [];

  // 2. Analyze each column
  return allKeys.map((key) => {
    let numericCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    let nonEmptyCount = 0;
    const uniqueValues = new Set<string>();
    const sampleValues: string[] = [];

    rawRows.forEach((row) => {
      const val = row[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const strVal = String(val).trim();
        nonEmptyCount++;
        uniqueValues.add(strVal);
        if (sampleValues.length < 5 && !sampleValues.includes(strVal)) {
          sampleValues.push(strVal);
        }

        if (isBooleanLike(val)) {
          booleanCount++;
        }

        const parsedDate = parseSheetDate(strVal);
        if (parsedDate.date !== null) {
          dateCount++;
        }

        const cleanForNum = strVal.replace(/[\$,₹,€,£,%,]/g, '').trim();
        if (!isNaN(Number(cleanForNum)) && cleanForNum !== '') {
          numericCount++;
        }
      }
    });

    const totalValid = Math.max(nonEmptyCount, 1);
    const numRatio = numericCount / totalValid;
    const dateRatio = dateCount / totalValid;
    const boolRatio = booleanCount / totalValid;

    let type: ColumnMeta['type'] = 'string';
    if (boolRatio > 0.6) {
      type = 'boolean';
    } else if (dateRatio > 0.6) {
      type = 'date';
    } else if (numRatio > 0.6) {
      type = 'number';
    }

    const lowerKey = key.toLowerCase();
    const isId = ID_KEYWORDS.some((kw) => lowerKey === kw || lowerKey.includes(kw));
    const isDate = type === 'date' || DATE_KEYWORDS.some((kw) => lowerKey.includes(kw));
    const isStatus = type === 'boolean' || STATUS_KEYWORDS.some((kw) => lowerKey.includes(kw));
    const isMetric = type === 'number' && !isId;
    const isDimension = (type === 'string' || type === 'boolean') && !isId && !isDate && uniqueValues.size > 0;

    return {
      key,
      label: key,
      type,
      uniqueCount: uniqueValues.size,
      sampleValues,
      isMetric,
      isDimension,
      isDate,
      isStatus,
    };
  });
}

/**
 * Automatically inspects dataset headers and sample rows to detect data types and semantic roles
 */
export function detectSheetSchema(rawRows: Record<string, any>[]): SchemaConfig {
  if (!rawRows || rawRows.length === 0) {
    return {
      idColumn: 'Sl No.',
      categoryColumn: 'Category',
      locationColumn: 'Location',
      dateColumn: 'Date',
      statusColumn: 'Installation Done',
      primaryMetricColumn: 'No. of items',
      secondaryMetricColumn: 'Store Counts',
      sheetTitle: 'Spreadsheet Dataset',
      autoDetected: true,
    };
  }

  const columns = inspectColumns(rawRows);
  const allKeys = columns.map(c => c.key);

  // Find optimal column role assignments
  const findBestMatch = (
    candidates: ColumnMeta[],
    keywords: string[],
    preferType?: ColumnMeta['type'],
    excludeKeys: string[] = []
  ): ColumnMeta | undefined => {
    const available = candidates.filter((c) => !excludeKeys.includes(c.key));

    // Priority 1: Exact keyword match with preferred type
    for (const kw of keywords) {
      const match = available.find(
        (c) => c.key.toLowerCase() === kw && (!preferType || c.type === preferType)
      );
      if (match) return match;
    }

    // Priority 2: Keyword contains match with preferred type
    for (const kw of keywords) {
      const match = available.find(
        (c) => c.key.toLowerCase().includes(kw) && (!preferType || c.type === preferType)
      );
      if (match) return match;
    }

    // Priority 3: Exact or contains keyword match regardless of detected type
    for (const kw of keywords) {
      const match = available.find((c) => c.key.toLowerCase().includes(kw));
      if (match) return match;
    }

    // Priority 4: Type match fallback
    if (preferType) {
      const match = available.find((c) => c.type === preferType);
      if (match) return match;
    }

    return undefined;
  };

  const usedKeys: string[] = [];

  // ID Column
  const idCol = findBestMatch(columns, ID_KEYWORDS, undefined, usedKeys);
  if (idCol) usedKeys.push(idCol.key);

  // Date Column
  const dateCol = findBestMatch(columns, DATE_KEYWORDS, 'date', usedKeys);
  if (dateCol) usedKeys.push(dateCol.key);

  // Status Column
  const statusCol = findBestMatch(columns, STATUS_KEYWORDS, 'boolean', usedKeys);
  if (statusCol) usedKeys.push(statusCol.key);

  // Primary Metric Column (Quantity / Items / Amount / Sales)
  const primaryMetricCol = findBestMatch(columns, PRIMARY_METRIC_KEYWORDS, 'number', usedKeys);
  if (primaryMetricCol) usedKeys.push(primaryMetricCol.key);

  // Secondary Metric Column (Store counts / Reach / Budget)
  const secondaryMetricCol = findBestMatch(columns, SECONDARY_METRIC_KEYWORDS, 'number', usedKeys);
  if (secondaryMetricCol) usedKeys.push(secondaryMetricCol.key);

  // Category Dimension (Primary Group)
  const categoryCol = findBestMatch(columns, CATEGORY_KEYWORDS, 'string', usedKeys);
  if (categoryCol) usedKeys.push(categoryCol.key);

  // Location Dimension (Secondary Group)
  const locationCol = findBestMatch(columns, LOCATION_KEYWORDS, 'string', usedKeys);
  if (locationCol) usedKeys.push(locationCol.key);

  // Fallbacks if any core roles were not matched
  const remainingDims = columns.filter((c) => !usedKeys.includes(c.key) && c.type === 'string');
  const remainingNumbers = columns.filter((c) => !usedKeys.includes(c.key) && c.type === 'number');

  const finalCategory = categoryCol?.key || remainingDims[0]?.key || columns[0]?.key || 'Category';
  const finalLocation = locationCol?.key || remainingDims[1]?.key || remainingDims[0]?.key || 'Location';
  const finalDate = dateCol?.key || columns.find((c) => c.type === 'date')?.key || 'Date';
  const finalStatus = statusCol?.key || columns.find((c) => c.type === 'boolean')?.key || 'Installation Done';
  const finalPrimaryMetric = primaryMetricCol?.key || remainingNumbers[0]?.key || columns.find((c) => c.type === 'number')?.key || 'No. of items';
  const finalSecondaryMetric = secondaryMetricCol?.key || remainingNumbers[1]?.key || remainingNumbers[0]?.key || 'Store Counts';
  const finalId = idCol?.key || columns[0]?.key || 'Sl No.';

  return {
    idColumn: finalId,
    categoryColumn: finalCategory,
    locationColumn: finalLocation,
    dateColumn: finalDate,
    statusColumn: finalStatus,
    primaryMetricColumn: finalPrimaryMetric,
    secondaryMetricColumn: finalSecondaryMetric,
    sheetTitle: deriveSheetTitle(allKeys, rawRows),
    autoDetected: true,
  };
}

/**
 * Derives a human-friendly title based on headers and data contents
 */
function deriveSheetTitle(keys: string[], rows: Record<string, any>[]): string {
  const keysLower = keys.map((k) => k.toLowerCase()).join(' ');
  if (keysLower.includes('mentors') || keysLower.includes('installation') || keysLower.includes('store count')) {
    return 'Mentors Eduserv • Campaign Tracker';
  }
  if (keysLower.includes('sales') || keysLower.includes('revenue') || keysLower.includes('order')) {
    return 'Sales & Revenue Analytics';
  }
  if (keysLower.includes('project') || keysLower.includes('task') || keysLower.includes('sprint')) {
    return 'Project Sprint & Operations Tracker';
  }
  if (keysLower.includes('inventory') || keysLower.includes('stock') || keysLower.includes('warehouse')) {
    return 'Inventory & Warehouse Monitor';
  }
  if (keysLower.includes('student') || keysLower.includes('course') || keysLower.includes('attendance')) {
    return 'Academic Performance & Enrollment';
  }
  return 'Interactive Operations & Analytics Dashboard';
}

/**
 * Storage key helper for saving schema configs per sheet ID
 */
export function getSavedSchema(sheetId: string): SchemaConfig | null {
  try {
    const raw = localStorage.getItem(`schema_config_${sheetId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveSchemaConfig(sheetId: string, config: SchemaConfig): void {
  try {
    localStorage.setItem(`schema_config_${sheetId}`, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save schema config:', e);
  }
}
