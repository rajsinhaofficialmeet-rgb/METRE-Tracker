import { SheetRow, NormalizedSheetRow } from '../types';
import { parseSheetDate } from '../utils/dateUtils';

export const DEFAULT_SHEET_ID = '1p7_1ApCl2B4t4nWWLnYn3jN7bjOxXSyqzZxdO70hvxY';
export const LOCAL_STORAGE_CUSTOM_ROWS_KEY = 'mentors_custom_sheet_rows_v2';
export const LOCAL_STORAGE_SHEET_CONFIG_KEY = 'mentors_sheet_config_v2';

export interface SheetSyncConfig {
  sheetId: string;
  gid: string;
  appsScriptUrl: string; // Google Apps Script Webhook for 2-Way Read & Write
  syncInterval: number; // in seconds
  lastSyncTime: string | null;
  syncMode: 'auto' | 'api' | 'direct' | 'webhook';
}

export const DEFAULT_SHEET_CONFIG: SheetSyncConfig = {
  sheetId: DEFAULT_SHEET_ID,
  gid: '0',
  appsScriptUrl: '',
  syncInterval: 30,
  lastSyncTime: null,
  syncMode: 'auto',
};

// Fallback seed rows
export const INITIAL_SEED_ROWS: SheetRow[] = [
  { _id: 'r-prev1', 'Sl No.': 1, 'Category': 'Hoarding', 'Date': '21/08/26', 'Installation Done': 'Yes', 'Location': 'Boring road', 'No. of items': 42, 'Store Location': 'PL', 'Store Counts': 980 },
  { _id: 'r-prev2', 'Sl No.': 2, 'Category': 'Hoarding', 'Date': '21/08/26', 'Installation Done': 'Yes', 'Location': 'jk', 'No. of items': 18, 'Store Location': 'Boring road', 'Store Counts': 1200400 },
  { _id: 'r-prev3', 'Sl No.': 3, 'Category': 'Banners', 'Date': '22/08/26', 'Installation Done': 'Yes', 'Location': 'station', 'No. of items': 28, 'Store Location': 'PL', 'Store Counts': 380450 },
  { _id: 'r-prev4', 'Sl No.': 4, 'Category': 'AutoVenyl', 'Date': '22/08/26', 'Installation Done': 'Yes', 'Location': 'fraser', 'No. of items': 65, 'Store Location': 'Boring road', 'Store Counts': 3100200 },
  { _id: 'r-prev5', 'Sl No.': 5, 'Category': 'Banners', 'Date': '22/08/26', 'Installation Done': 'Yes', 'Location': 'bailey', 'No. of items': 38, 'Store Location': 'PL', 'Store Counts': 3450000 },
  { _id: 'r1', 'Sl No.': 6, 'Category': 'Hoarding', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'Boring road', 'No. of items': 54, 'Store Location': 'PL', 'Store Counts': 1242 },
  { _id: 'r2', 'Sl No.': 7, 'Category': 'Hoarding', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'jk', 'No. of items': 24, 'Store Location': 'Boring road', 'Store Counts': 1655783 },
  { _id: 'r3', 'Sl No.': 8, 'Category': 'Hoarding', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'station', 'No. of items': 36, 'Store Location': 'PL', 'Store Counts': 452664 },
  { _id: 'r4', 'Sl No.': 9, 'Category': 'Hoarding', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'fraser', 'No. of items': 97, 'Store Location': 'Boring road', 'Store Counts': 4515645 },
  { _id: 'r5', 'Sl No.': 10, 'Category': 'Hoarding', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'bailey', 'No. of items': 54, 'Store Location': 'PL', 'Store Counts': 4741356 },
  { _id: 'r6', 'Sl No.': 11, 'Category': 'Banners', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'Boring road', 'No. of items': 54, 'Store Location': 'Boring road', 'Store Counts': 597535.8 },
  { _id: 'r7', 'Sl No.': 12, 'Category': 'Banners', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'jk', 'No. of items': 24, 'Store Location': 'PL', 'Store Counts': 720936.6 },
  { _id: 'r8', 'Sl No.': 13, 'Category': 'Banners', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'station', 'No. of items': 36, 'Store Location': 'Boring road', 'Store Counts': 844337.4 },
  { _id: 'r9', 'Sl No.': 14, 'Category': 'Banners', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'fraser', 'No. of items': 97, 'Store Location': 'PL', 'Store Counts': 967738.2 },
  { _id: 'r10', 'Sl No.': 15, 'Category': 'Banners', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'bailey', 'No. of items': 54, 'Store Location': 'Boring road', 'Store Counts': 1091139 },
  { _id: 'r11', 'Sl No.': 16, 'Category': 'AutoVenyl', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'Boring road', 'No. of items': 54, 'Store Location': 'PL', 'Store Counts': 1214539.8 },
  { _id: 'r12', 'Sl No.': 17, 'Category': 'AutoVenyl', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'jk', 'No. of items': 24, 'Store Location': 'Boring road', 'Store Counts': 1337940.6 },
  { _id: 'r13', 'Sl No.': 18, 'Category': 'AutoVenyl', 'Date': '28/08/26', 'Installation Done': 'Yes', 'Location': 'station', 'No. of items': 36, 'Store Location': 'PL', 'Store Counts': 1461341.4 },
  { _id: 'r14', 'Sl No.': 19, 'Category': 'AutoVenyl', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'fraser', 'No. of items': 97, 'Store Location': 'Boring road', 'Store Counts': 1584742.2 },
  { _id: 'r15', 'Sl No.': 20, 'Category': 'AutoVenyl', 'Date': '29/08/26', 'Installation Done': 'Yes', 'Location': 'bailey', 'No. of items': 54, 'Store Location': 'PL', 'Store Counts': 1708143 }
];

// Helper to validate whether a string is valid CSV and NOT an HTML/JS error/login page
export function isValidCSVText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  
  // Check for HTML or XML tags or Google Login redirects
  if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<?xml')) {
    return false;
  }
  
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('<!doctype') ||
    lower.includes('<html') ||
    lower.includes('<script') ||
    lower.includes('<head') ||
    lower.includes('<body') ||
    lower.includes('accounts.google.com') ||
    lower.includes('servicelogin') ||
    lower.includes("window['ppconfig']") ||
    lower.includes('deleteisenforced') ||
    lower.includes('disableallreporting') ||
    lower.includes('array.prototype') ||
    lower.includes('function(')
  ) {
    return false;
  }

  return true;
}

// Helper to validate whether a column header name is valid and not a JavaScript/HTML snippet
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

// Helper to validate whether rows dataset is clean and free of HTML/JS corruption
export function isValidSheetRows(rows: any[]): boolean {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  
  // Check first few rows for valid keys and content
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i];
    if (!row || typeof row !== 'object') return false;
    const keys = Object.keys(row).filter((k) => !k.startsWith('_'));
    if (keys.length === 0) return false;
    
    // If any key is an HTML/JS snippet, the whole dataset is corrupted
    for (const k of keys) {
      if (!isValidColumnHeader(k)) {
        return false;
      }
    }
  }
  return true;
}

export function parseCSV(csvText: string): { headers: string[]; rows: SheetRow[] } {
  if (!isValidCSVText(csvText)) {
    console.warn('parseCSV: Received HTML or invalid CSV payload, rejecting.');
    return { headers: [], rows: [] };
  }

  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const rawHeaders = parseLine(lines[0]);
  // Filter out any headers that look like code or html
  const validHeaders = rawHeaders.map((h, i) => (isValidColumnHeader(h) ? h : `Column_${i + 1}`));
  
  // If no headers are valid human column names, reject
  if (!rawHeaders.some(isValidColumnHeader)) {
    return { headers: [], rows: [] };
  }

  const rows: SheetRow[] = lines.slice(1).map((line, idx) => {
    const values = parseLine(line);
    const rowObj: Record<string, any> = { _id: `sheet-row-${idx + 1}` };
    validHeaders.forEach((h, i) => {
      rowObj[h] = values[i] !== undefined ? values[i] : '';
    });
    return rowObj as SheetRow;
  });

  return { headers: validHeaders, rows };
}

// Load Sheet Configuration from localStorage with sanitization
export function loadSavedSheetConfig(): SheetSyncConfig {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SHEET_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.sheetId === 'string') {
        return { ...DEFAULT_SHEET_CONFIG, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Failed to load saved sheet config:', e);
  }
  return DEFAULT_SHEET_CONFIG;
}

// Save Sheet Configuration
export function saveSheetConfig(config: SheetSyncConfig) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SHEET_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save sheet config:', e);
  }
}

// Load locally stored user modified rows with corruption check
export function loadLocalCustomRows(): SheetRow[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_ROWS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (isValidSheetRows(parsed)) {
        return parsed;
      } else {
        console.warn('Detected corrupted local sheet rows cache (HTML/JS code), purging localStorage.');
        localStorage.removeItem(LOCAL_STORAGE_CUSTOM_ROWS_KEY);
      }
    }
  } catch (e) {
    console.warn('Failed to load local custom rows:', e);
    try {
      localStorage.removeItem(LOCAL_STORAGE_CUSTOM_ROWS_KEY);
    } catch {}
  }
  return [];
}

// Save custom rows to localStorage only if clean
export function saveLocalCustomRows(rows: SheetRow[]) {
  try {
    if (isValidSheetRows(rows)) {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_ROWS_KEY, JSON.stringify(rows));
    } else {
      console.warn('Refused to save corrupted rows to localStorage.');
    }
  } catch (e) {
    console.warn('Failed to save local custom rows:', e);
  }
}

export interface FetchSheetResult {
  rows: SheetRow[];
  headers: string[];
  source: 'api' | 'direct-csv' | 'direct-gviz' | 'apps-script' | 'cache-fallback';
  lastSync: Date;
  error?: string;
}

/**
 * Universal Dual-Mode Sheet Fetcher
 * Works in:
 * 1. AI Studio dev container / Custom Express server (/api/sheet-data)
 * 2. Vercel Serverless deployment
 * 3. Vercel Static deployment / GitHub Pages (direct browser fetching with cache-busting)
 * 4. Google Apps Script Web App Webhook
 */
export async function fetchLiveSpreadsheetData(
  sheetId: string = DEFAULT_SHEET_ID,
  gid: string = '0',
  appsScriptUrl?: string
): Promise<FetchSheetResult> {
  const timestamp = Date.now();

  // 1. If Apps Script Webhook URL is provided, try that first for 2-way live sync data
  if (appsScriptUrl && appsScriptUrl.trim().startsWith('http')) {
    try {
      const scriptRes = await fetch(`${appsScriptUrl}?action=read&t=${timestamp}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (scriptRes.ok) {
        const data = await scriptRes.json();
        if (data && Array.isArray(data.rows) && data.rows.length > 0) {
          return {
            rows: data.rows,
            headers: data.headers || Object.keys(data.rows[0]),
            source: 'apps-script',
            lastSync: new Date(),
          };
        }
      }
    } catch (e: any) {
      console.warn('Apps Script Webhook fetch error, falling back to direct:', e.message);
    }
  }

  // 2. Try backend /api/sheet-data route
  try {
    const apiRes = await fetch(`/api/sheet-data?sheetId=${encodeURIComponent(sheetId)}&gid=${gid}&_t=${timestamp}`);
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0 && isValidSheetRows(json.data)) {
        return {
          rows: json.data,
          headers: (json.headers || []).filter(isValidColumnHeader),
          source: 'api',
          lastSync: new Date(),
        };
      }
    }
  } catch (apiErr: any) {
    console.info('Backend /api/sheet-data unreachable (e.g. Vercel static mode), using direct browser fetch.');
  }

  // 3. Direct Browser Fetch: Google Sheets CSV Export with Cache-Buster
  try {
    const directCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&_t=${timestamp}`;
    const directRes = await fetch(directCsvUrl);
    const contentType = directRes.headers.get('content-type') || '';
    if (directRes.ok && !contentType.includes('text/html')) {
      const csvText = await directRes.text();
      if (isValidCSVText(csvText)) {
        const parsed = parseCSV(csvText);
        if (parsed.rows.length > 0 && isValidSheetRows(parsed.rows)) {
          return {
            rows: parsed.rows,
            headers: parsed.headers,
            source: 'direct-csv',
            lastSync: new Date(),
          };
        }
      }
    }
  } catch (csvErr: any) {
    console.warn('Direct CSV export fetch failed:', csvErr.message);
  }

  // 4. Direct Browser Fetch: Google Visualization Query Endpoint
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}&_t=${timestamp}`;
    const gvizRes = await fetch(gvizUrl);
    const contentType = gvizRes.headers.get('content-type') || '';
    if (gvizRes.ok && !contentType.includes('text/html')) {
      const csvText = await gvizRes.text();
      if (isValidCSVText(csvText)) {
        const parsed = parseCSV(csvText);
        if (parsed.rows.length > 0 && isValidSheetRows(parsed.rows)) {
          return {
            rows: parsed.rows,
            headers: parsed.headers,
            source: 'direct-gviz',
            lastSync: new Date(),
          };
        }
      }
    }
  } catch (gvizErr: any) {
    console.warn('Google Gviz endpoint fetch failed:', gvizErr.message);
  }

  // 5. Fallback: Return cached local rows or initial seed data
  const localRows = loadLocalCustomRows();
  if (localRows.length > 0 && isValidSheetRows(localRows)) {
    return {
      rows: localRows,
      headers: ['Sl No.', 'Category', 'Date', 'Installation Done', 'Location', 'No. of items', 'Store Location', 'Store Counts'],
      source: 'cache-fallback',
      lastSync: new Date(),
    };
  }

  return {
    rows: INITIAL_SEED_ROWS,
    headers: ['Sl No.', 'Category', 'Date', 'Installation Done', 'Location', 'No. of items', 'Store Location', 'Store Counts'],
    source: 'cache-fallback',
    lastSync: new Date(),
  };
}

/**
 * 2-Way Sync Mutation Writer:
 * Updates the live Google Spreadsheet via Google Apps Script Webhook,
 * while always guaranteeing local persistence in LocalStorage.
 */
export async function writeRowToGoogleSheet(
  action: 'append' | 'update' | 'toggleStatus',
  payload: any,
  appsScriptUrl?: string
): Promise<{ success: boolean; message: string; remoteSynced: boolean }> {
  let remoteSynced = false;
  let remoteMessage = '';

  if (appsScriptUrl && appsScriptUrl.trim().startsWith('http')) {
    try {
      // Send write payload to Google Apps Script Webhook
      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain prevents CORS preflight issues with Google Apps Script
        body: JSON.stringify({ action, data: payload, timestamp: new Date().toISOString() }),
      });

      if (res.ok) {
        remoteSynced = true;
        remoteMessage = 'Updated in live Google Sheet!';
      } else {
        remoteMessage = `Webhook responded with status ${res.status}`;
      }
    } catch (err: any) {
      console.warn('Error sending write to Google Apps Script:', err.message);
      remoteMessage = `Could not reach Apps Script Webhook: ${err.message}`;
    }
  }

  return {
    success: true,
    message: remoteSynced ? remoteMessage : 'Saved locally in browser storage.',
    remoteSynced,
  };
}

/**
 * Template for 1-Click Google Apps Script Web App for Google Sheets.
 * Users can paste this script into their Google Sheet (Extensions > Apps Script) to enable full 2-way read/write sync.
 */
export function generateGoogleAppsScriptCode(sheetName: string = 'Sheet1'): string {
  return `/**
 * Mentors Eduserv - Google Sheets 2-Way Live Sync Webhook
 * 
 * Instructions:
 * 1. In your Google Sheet, click 'Extensions' > 'Apps Script'.
 * 2. Delete any existing code and paste this entire file.
 * 3. Click 'Deploy' > 'New deployment'.
 * 4. Select type: 'Web app'.
 * 5. Set 'Execute as': 'Me'.
 * 6. Set 'Who has access': 'Anyone'.
 * 7. Click 'Deploy' and copy the resulting Web App URL.
 * 8. Paste that Web App URL into the Dashboard Settings in your app!
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'read';
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    return ContentService.createTextOutput(JSON.stringify({ success: true, headers: [], rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var rowObj = { _id: 'sheet-row-' + i };
    for (var j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    rows.push(rowObj);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    sheetName: sheet.getName(),
    headers: headers,
    rows: rows,
    lastUpdated: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var rowData = postData.data;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    
    if (action === 'append') {
      var newRow = [];
      for (var j = 0; j < headers.length; j++) {
        var h = headers[j];
        newRow.push(rowData[h] !== undefined ? rowData[h] : '');
      }
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Row appended successfully' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'update' || action === 'toggleStatus') {
      var targetSlNo = rowData['Sl No.'] || rowData.slNo;
      var foundRowIndex = -1;
      
      // Find row by Sl No.
      var slNoColIndex = headers.indexOf('Sl No.');
      if (slNoColIndex === -1) slNoColIndex = 0;
      
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][slNoColIndex]) === String(targetSlNo)) {
          foundRowIndex = i + 1; // 1-indexed for Sheets API
          break;
        }
      }
      
      if (foundRowIndex !== -1) {
        for (var j = 0; j < headers.length; j++) {
          var headerName = headers[j];
          if (rowData[headerName] !== undefined) {
            sheet.getRange(foundRowIndex, j + 1).setValue(rowData[headerName]);
          }
        }
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Row updated successfully' }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        // If not found, append it
        var newRow = [];
        for (var j = 0; j < headers.length; j++) {
          var h = headers[j];
          newRow.push(rowData[h] !== undefined ? rowData[h] : '');
        }
        sheet.appendRow(newRow);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Row appended (not previously found)' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action: ' + action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
}
