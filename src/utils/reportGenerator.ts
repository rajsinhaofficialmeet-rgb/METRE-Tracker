import { NormalizedSheetRow, KPISummary, FilterState } from '../types';

export type ReportTemplateType =
  | 'whatsapp_quick'
  | 'executive_summary'
  | 'location_breakdown'
  | 'pending_checklist';

export interface GeneratedReport {
  text: string;
  subject: string;
  templateType: ReportTemplateType;
}

/**
 * Format a progress bar for WhatsApp / plain text
 */
function createProgressBar(percent: number, totalSlots: number = 10): string {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * totalSlots);
  const empty = totalSlots - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 1. WhatsApp-Optimized Quick Status Digest
 * Formatted with *bold*, emojis, clean line breaks, perfect for 1-tap WhatsApp sharing
 */
export function generateWhatsAppReport(
  rows: NormalizedSheetRow[],
  kpis: KPISummary,
  filterState: FilterState
): GeneratedReport {
  const dateRangeStr =
    filterState.startDate || filterState.endDate
      ? `${filterState.startDate || 'Start'} to ${filterState.endDate || 'Active'}`
      : 'All Available Dates';

  const progressBar = createProgressBar(kpis.completionRate);

  // Group by category
  const categoryMap = new Map<string, { total: number; installed: number }>();
  rows.forEach((r) => {
    const prev = categoryMap.get(r.category) || { total: 0, installed: 0 };
    categoryMap.set(r.category, {
      total: prev.total + r.noOfItems,
      installed: prev.installed + (r.installationDone ? r.noOfItems : 0),
    });
  });

  const categoryLines = Array.from(categoryMap.entries())
    .map(([cat, stats]) => {
      const pct = stats.total > 0 ? Math.round((stats.installed / stats.total) * 100) : 0;
      return `  • *${cat}*: ${stats.total.toLocaleString()} items (${pct}% installed)`;
    })
    .join('\n');

  // Top 3 locations
  const locationMap = new Map<string, number>();
  rows.forEach((r) => {
    locationMap.set(r.location, (locationMap.get(r.location) || 0) + r.noOfItems);
  });
  const topLocations = Array.from(locationMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([loc, count], idx) => `  ${idx + 1}. *${loc}*: ${count.toLocaleString()} items`)
    .join('\n');

  const text = `📢 *MENTORS EDUSERV — CAMPAIGN OPS UPDATE*
━━━━━━━━━━━━━━━━━━━━
📅 *Period:* ${dateRangeStr}
📊 *Total Tracked Records:* ${rows.length} records

🎯 *KEY METRICS SNAPSHOT*
• *Total Volume:* ${kpis.totalItems.toLocaleString()} items
• *Installation Rate:* *${kpis.completionRate}%*
  [${progressBar}]
• *Installed:* ${kpis.installedItems.toLocaleString()} items ✅
• *Pending:* ${kpis.pendingItems.toLocaleString()} items ⏳
• *Store Reach / Footprint:* ${kpis.totalStoreCounts.toLocaleString()}

📦 *CATEGORY BREAKDOWN*
${categoryLines || '  • No category data in current filter'}

📍 *TOP DEPLOYMENT HUBS*
${topLocations || '  • No location data in current filter'}

⚡ *STATUS:* Operational sprint is active. Field verifications underway.
━━━━━━━━━━━━━━━━━━━━
_Generated via Mentors Eduserv Live Operations Dashboard_`;

  const subject = `[Ops Flash] Mentors Eduserv Campaign Progress (${dateRangeStr})`;

  return { text, subject, templateType: 'whatsapp_quick' };
}

/**
 * 2. Executive Summary Report (Formal & Email-Ready)
 */
export function generateExecutiveReport(
  rows: NormalizedSheetRow[],
  kpis: KPISummary,
  filterState: FilterState
): GeneratedReport {
  const dateRangeStr =
    filterState.startDate || filterState.endDate
      ? `${filterState.startDate || 'Beginning'} to ${filterState.endDate || 'Present'}`
      : 'All Available Dates';

  const text = `MENTORS EDUSERV - MARKETING & DEPLOYMENT EXECUTIVE REPORT
============================================================
Reporting Period: ${dateRangeStr}
Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })} | ${new Date().toLocaleTimeString()}
Status: Live Google Spreadsheet Synchronized

1. EXECUTIVE SUMMARY & OVERALL METRICS
------------------------------------------------------------
• Total Campaign Items: ${kpis.totalItems.toLocaleString()}
• Completed Installations: ${kpis.installedItems.toLocaleString()} (${kpis.completionRate}%)
• Pending Deployments: ${kpis.pendingItems.toLocaleString()} (${100 - kpis.completionRate}%)
• Cumulative Store Counts / Outreach: ${kpis.totalStoreCounts.toLocaleString()}
• Active Deployment Hubs: ${kpis.uniqueLocations} Locations
• Media Categories: ${kpis.uniqueCategories} Media Types

2. PERFORMANCE HIGHLIGHTS
------------------------------------------------------------
• Leading Geographic Zone: ${kpis.topLocation.name || 'Boring Road'} with ${kpis.topLocation.items.toLocaleString()} total units.
• Core Media Format: ${kpis.topCategory.name || 'Hoardings'} leading with ${kpis.topCategory.items.toLocaleString()} items.
• Strategic Corridors: Fraser Road, Boring Road, and Bailey Road exhibit high concentration of outdoor impressions.

3. STRATEGIC NEXT ACTIONS
------------------------------------------------------------
1. Expedite remaining ${kpis.pendingItems.toLocaleString()} pending site installations.
2. Conduct field photographic verification and durability check for monsoon/weather resilience.
3. Review store footfall conversion metrics for upcoming marketing sprint.

============================================================
Mentors Eduserv Operations Dashboard | Source Sheet: 1p7_1ApCl2B4t4nWWLnYn3jN7bjOxXSyqzZxdO70hvxY`;

  const subject = `[Executive Brief] Mentors Eduserv Outdoor Campaign Report (${dateRangeStr})`;

  return { text, subject, templateType: 'executive_summary' };
}

/**
 * 3. Comprehensive Location & Category Breakdown Report
 */
export function generateLocationBreakdownReport(
  rows: NormalizedSheetRow[],
  kpis: KPISummary,
  filterState: FilterState
): GeneratedReport {
  const dateRangeStr =
    filterState.startDate || filterState.endDate
      ? `${filterState.startDate || 'Beginning'} to ${filterState.endDate || 'Active'}`
      : 'All Dates';

  // Group by Location -> Categories
  const locMap = new Map<string, { total: number; installed: number; pending: number; categories: Record<string, number> }>();

  rows.forEach((r) => {
    const loc = r.location || 'Unspecified';
    const curr = locMap.get(loc) || { total: 0, installed: 0, pending: 0, categories: {} };
    curr.total += r.noOfItems;
    if (r.installationDone) {
      curr.installed += r.noOfItems;
    } else {
      curr.pending += r.noOfItems;
    }
    curr.categories[r.category] = (curr.categories[r.category] || 0) + r.noOfItems;
    locMap.set(loc, curr);
  });

  let breakdownText = '';
  Array.from(locMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([loc, data], idx) => {
      const pct = data.total > 0 ? Math.round((data.installed / data.total) * 100) : 0;
      const cats = Object.entries(data.categories)
        .map(([c, count]) => `${c}: ${count}`)
        .join(' | ');

      breakdownText += `\n${idx + 1}. LOCATION: ${loc.toUpperCase()}\n`;
      breakdownText += `   • Total Items: ${data.total.toLocaleString()} units\n`;
      breakdownText += `   • Done: ${data.installed} (${pct}%) | Pending: ${data.pending}\n`;
      breakdownText += `   • Media Types: ${cats}\n`;
    });

  const text = `MENTORS EDUSERV - LOCATION & MEDIA BREAKDOWN REPORT
============================================================
Filter Window: ${dateRangeStr}
Total Filtered Rows: ${rows.length} | Total Items: ${kpis.totalItems.toLocaleString()}
============================================================
${breakdownText}
============================================================
Total Aggregate: ${kpis.installedItems} Installed / ${kpis.pendingItems} Pending (${kpis.completionRate}% Done)
Mentors Eduserv Campaign Tracking System`;

  const subject = `[Location Breakdown] Mentors Eduserv Field Deployment Analysis`;

  return { text, subject, templateType: 'location_breakdown' };
}

/**
 * 4. Actionable Pending Installations Checklist / Punchlist
 */
export function generatePendingChecklistReport(
  rows: NormalizedSheetRow[],
  kpis: KPISummary,
  filterState: FilterState
): GeneratedReport {
  const pendingRows = rows.filter((r) => !r.installationDone);

  let listText = '';
  if (pendingRows.length === 0) {
    listText = '🎉 GREAT NEWS: All items in current filtered view have been marked as INSTALLED (100% Complete).';
  } else {
    pendingRows.forEach((r, idx) => {
      listText += `[ ] #${r.slNo} - ${r.category} | ${r.location} | Qty: ${r.noOfItems} items | Date: ${r.date} | Store: ${r.storeLocation || 'N/A'}\n`;
    });
  }

  const text = `📋 PENDING INSTALLATION ACTION LIST - MENTORS EDUSERV
============================================================
Action Required: Follow up with vendors/installers for immediate execution.
Pending Records: ${pendingRows.length} | Pending Units: ${kpis.pendingItems.toLocaleString()}
============================================================

${listText}

============================================================
Please complete and confirm photo proof once installation is completed.`;

  const subject = `[Urgent Action] Pending Installations Punchlist (${pendingRows.length} Sites)`;

  return { text, subject, templateType: 'pending_checklist' };
}

/**
 * Generate Report by Template Type
 */
export function generateReportByTemplate(
  templateType: ReportTemplateType,
  rows: NormalizedSheetRow[],
  kpis: KPISummary,
  filterState: FilterState
): GeneratedReport {
  switch (templateType) {
    case 'whatsapp_quick':
      return generateWhatsAppReport(rows, kpis, filterState);
    case 'executive_summary':
      return generateExecutiveReport(rows, kpis, filterState);
    case 'location_breakdown':
      return generateLocationBreakdownReport(rows, kpis, filterState);
    case 'pending_checklist':
      return generatePendingChecklistReport(rows, kpis, filterState);
    default:
      return generateWhatsAppReport(rows, kpis, filterState);
  }
}
