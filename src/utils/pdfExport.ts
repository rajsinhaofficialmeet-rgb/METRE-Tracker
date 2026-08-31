import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NormalizedSheetRow, KPISummary, FilterState } from '../types';
import { formatNumberCompact } from './dataParser';

interface PDFExportOptions {
  title?: string;
  organization?: string;
  filterState?: FilterState;
  kpis?: KPISummary;
  rows: NormalizedSheetRow[];
  includeSummaryKPIs?: boolean;
  notes?: string;
}

export async function generateProjectReportPDF({
  title = 'Offline Marketing & Operations Field Report',
  organization = "Mentors Eduserv Offline Operations",
  filterState,
  kpis,
  rows,
  includeSummaryKPIs = true,
  notes
}: PDFExportOptions): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Organization name & title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`${organization} • Live Google Spreadsheet Synchronized Report`, 14, 21);

  // Date on top right
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${dateString}`, pageWidth - 14, 14, { align: 'right' });
  doc.text(`Total Records: ${rows.length}`, pageWidth - 14, 21, { align: 'right' });

  let curY = 36;

  // 2. Metadata / Filter Badges
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFont('helvetica', 'bold');
  doc.text('Applied Filters:', 18, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const filterDesc = [
    filterState?.startDate && filterState?.endDate ? `Date: ${filterState.startDate} to ${filterState.endDate}` : 'Date: All Time',
    filterState?.categories?.length ? `Categories: ${filterState.categories.join(', ')}` : 'Categories: All',
    filterState?.locations?.length ? `Locations: ${filterState.locations.join(', ')}` : 'Locations: All',
    filterState?.installationStatus !== 'all' ? `Status: ${filterState.installationStatus.toUpperCase()}` : 'Status: All'
  ].join('  |  ');
  doc.text(filterDesc, 46, curY + 6);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Source Sheet: Mentors Eduserv Live Tracker (Google Sheets API)', 18, curY + 11);

  curY += 19;

  // 3. Executive KPI Metrics Cards (5 columns)
  if (includeSummaryKPIs && kpis) {
    const cardWidth = (pageWidth - 28 - 12) / 5;
    const cardHeight = 18;

    const growthFormatted = kpis.installationGrowth?.formattedPercentage || '0.0%';
    const growthSub = kpis.installationGrowth ? `${kpis.installationGrowth.currentWeekRecords} vs ${kpis.installationGrowth.previousWeekRecords} prev` : 'WoW Pace';

    const cards = [
      { label: 'TOTAL ITEMS', value: kpis.totalItems.toLocaleString(), sub: `${kpis.totalRecords} Records` },
      { label: 'COMPLETION', value: `${kpis.completionRate}%`, sub: `${kpis.installedItems} Installed` },
      { label: 'WOW GROWTH', value: growthFormatted, sub: growthSub },
      { label: 'STORE FOOTPRINT', value: formatNumberCompact(kpis.totalStoreCounts), sub: 'Total Store Counts' },
      { label: 'TOP LOCATION', value: kpis.topLocation.name || 'N/A', sub: `${kpis.topLocation.items} Items` }
    ];

    cards.forEach((card, i) => {
      const x = 14 + i * (cardWidth + 3);
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.roundedRect(x, curY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, x + 3.5, curY + 4.5);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(card.value), x + 3.5, curY + 10.5);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(card.sub, x + 3.5, curY + 15);
    });

    curY += cardHeight + 6;
  }

  // 4. Notes if provided
  if (notes && notes.trim()) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    doc.text(`Executive Notes: ${notes}`, 14, curY);
    curY += 6;
  }

  // 5. Data Table using jspdf-autotable
  const tableHeaders = [
    'Sl No.',
    'Category',
    'Date',
    'Installation Done',
    'Location',
    'No. of Items',
    'Store Location',
    'Store Counts'
  ];

  const tableData = rows.map((r) => [
    r.slNo,
    r.category,
    r.date || 'N/A',
    r.installationDone ? 'Yes' : 'Pending',
    r.location,
    r.noOfItems.toLocaleString(),
    r.storeLocation || '-',
    r.storeCounts.toLocaleString()
  ]);

  autoTable(doc, {
    startY: curY,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2.2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 28 },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 24 },
      7: { cellWidth: 24, halign: 'right' }
    },
    didDrawCell: (data) => {
      // Highlight "Yes" in green text and "Pending" in amber
      if (data.column.index === 3 && data.section === 'body') {
        const text = String(data.cell.raw);
        if (text === 'Yes') {
          doc.setTextColor(22, 101, 52); // green-800
        } else {
          doc.setTextColor(180, 83, 9); // amber-700
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = (doc.internal as any).getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);

      // Left footer
      doc.text(
        'Mentors Eduserv • Confidential Operations Report',
        14,
        pageHeight - 8
      );

      // Right footer
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    }
  });

  return doc;
}
