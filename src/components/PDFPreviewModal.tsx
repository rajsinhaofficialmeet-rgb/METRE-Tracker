import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Settings2,
  FileCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { NormalizedSheetRow, KPISummary, FilterState } from '../types';
import { generateProjectReportPDF } from '../utils/pdfExport';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredRows: NormalizedSheetRow[];
  kpis: KPISummary;
  filterState: FilterState;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  filteredRows,
  kpis,
  filterState,
}) => {
  const [reportTitle, setReportTitle] = useState(
    'Mentors Eduserv - Official Marketing & Deployment Report'
  );
  const [organization, setOrganization] = useState(
    'Mentors Eduserv Marketing & Field Operations'
  );
  const [includeSummaryKPIs, setIncludeSummaryKPIs] = useState<boolean>(true);
  const [customNotes, setCustomNotes] = useState(
    'Official Mentors Eduserv field marketing status report synchronized from live Google Spreadsheet. All outdoor installations, hoards, and store counts verified.'
  );
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = await generateProjectReportPDF({
        title: reportTitle,
        organization,
        filterState,
        kpis,
        rows: filteredRows,
        includeSummaryKPIs,
        notes: customNotes,
      });

      const fileName = `Mentors_Eduserv_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      onClose();
    } catch (err: any) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Export Executive PDF Report
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Configure parameters and download publication-ready PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 rounded-lg text-sm min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs">
          {/* Report Title */}
          <div>
            <label className="text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
              Report Title
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
            />
          </div>

          {/* Organization */}
          <div>
            <label className="text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
              Organization / Subtitle
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
            />
          </div>

          {/* Inclusions summary preview */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="font-bold text-zinc-900 dark:text-white block font-mono">
              Report Inclusions:
            </span>
            <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{filteredRows.length} Filtered Sheet Records</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Executive KPI Summary Grid</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Category & Location Metrics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Filter & Sync Timestamps</span>
              </div>
            </div>
          </div>

          {/* Executive Notes */}
          <div>
            <label className="text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
              Executive Notes / Auditor Remarks
            </label>
            <textarea
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-none"
            />
          </div>

          {/* Toggle KPI Cards */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="includeKPIs"
              checked={includeSummaryKPIs}
              onChange={(e) => setIncludeSummaryKPIs(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="includeKPIs" className="text-zinc-700 dark:text-zinc-300 font-medium">
              Include High-Level KPI Metric Cards in PDF Header
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs disabled:opacity-50 transition-all"
          >
            <Download className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Building PDF Document...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
