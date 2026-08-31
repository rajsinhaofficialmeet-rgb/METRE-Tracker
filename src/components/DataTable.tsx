import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Download,
  Eye,
  Edit2,
  CheckCircle2,
  Clock,
  MapPin,
  Building,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { NormalizedSheetRow } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';

interface DataTableProps {
  rows: NormalizedSheetRow[];
  onAddNewRow: (newRow: Omit<NormalizedSheetRow, 'id' | 'parsedDate' | 'isoDate'>) => void;
  onUpdateRow: (updatedRow: NormalizedSheetRow) => void;
  onToggleStatus: (id: string) => void;
  onExportCSV: () => void;
}

type SortField = keyof NormalizedSheetRow;

export const DataTable: React.FC<DataTableProps> = ({
  rows,
  onAddNewRow,
  onUpdateRow,
  onToggleStatus,
  onExportCSV,
}) => {
  const [sortField, setSortField] = useState<SortField>('slNo');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected row for detail modal or editing
  const [inspectRow, setInspectRow] = useState<NormalizedSheetRow | null>(null);
  const [editingRow, setEditingRow] = useState<NormalizedSheetRow | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Row Form state
  const [newRowForm, setNewRowForm] = useState({
    slNo: rows.length + 1,
    category: 'Hoarding',
    date: '29/08/26',
    installationDone: true,
    installationStatusText: 'Yes',
    location: 'Boring road',
    noOfItems: 50,
    storeLocation: 'PL',
    storeCounts: 100000,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [rows, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-indigo-500" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-500" />
    );
  };

  const handleSaveNewRow = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNewRow(newRowForm);
    setIsAddModalOpen(false);
    // Reset form with incremented Sl No
    setNewRowForm({
      slNo: rows.length + 2,
      category: 'Hoarding',
      date: '30/08/26',
      installationDone: true,
      installationStatusText: 'Yes',
      location: '',
      noOfItems: 25,
      storeLocation: 'PL',
      storeCounts: 50000,
    });
  };

  const handleSaveEditRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRow) {
      onUpdateRow(editingRow);
      setEditingRow(null);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden transition-all mb-8">
      {/* Table Header Controls */}
      <div className="p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Mentors Eduserv Marketing Deployment Records
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700/60">
              {rows.length} Total Records
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Official marketing inventory, billboard locations, and outdoor installation tracking
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono text-[11px] border-b border-zinc-200 dark:border-zinc-800 select-none">
            <tr>
              <th
                onClick={() => handleSort('slNo')}
                className="py-3 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 group"
              >
                <div className="flex items-center gap-1">
                  <span>Sl No.</span>
                  {renderSortIcon('slNo')}
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="py-3 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 group"
              >
                <div className="flex items-center gap-1">
                  <span>Category</span>
                  {renderSortIcon('category')}
                </div>
              </th>
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 group"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  {renderSortIcon('date')}
                </div>
              </th>
              <th
                onClick={() => handleSort('installationDone')}
                className="py-3 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 group text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Installation</span>
                  {renderSortIcon('installationDone')}
                </div>
              </th>
              <th
                onClick={() => handleSort('location')}
                className="py-3 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 group"
              >
                <div className="flex items-center gap-1">
                  <span>Location</span>
                  {renderSortIcon('location')}
                </div>
              </th>
              <th
                onClick={() => handleSort('noOfItems')}
                className="py-3 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 group text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>No. of Items</span>
                  {renderSortIcon('noOfItems')}
                </div>
              </th>
              <th
                onClick={() => handleSort('storeLocation')}
                className="py-3 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 group"
              >
                <div className="flex items-center gap-1">
                  <span>Store Location</span>
                  {renderSortIcon('storeLocation')}
                </div>
              </th>
              <th
                onClick={() => handleSort('storeCounts')}
                className="py-3 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 group text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Store Counts</span>
                  {renderSortIcon('storeCounts')}
                </div>
              </th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-200">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-zinc-400 dark:text-zinc-500 font-mono">
                  No records match your selected filters or search query.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-medium text-zinc-500 dark:text-zinc-400">
                    #{row.slNo}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      <Layers className="w-3 h-3" />
                      {row.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium">
                    {formatDisplayDate(row.date)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onToggleStatus(row.id)}
                      title="Click to toggle installation status"
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                        row.installationDone
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {row.installationDone ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Done (Yes)</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Pending</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-medium capitalize">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {row.location}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-white font-mono">
                    {row.noOfItems.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300 font-mono">
                      <Building className="w-3 h-3 text-zinc-400" />
                      {row.storeLocation || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-zinc-900 dark:text-zinc-100">
                    {row.storeCounts.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setInspectRow(row)}
                        title="View Full Item Details"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingRow(row)}
                        title="Edit Record"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-zinc-700 dark:text-zinc-200 focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>
            Showing {(page - 1) * pageSize + 1} -{' '}
            {Math.min(page * pageSize, sortedRows.length)} of {sortedRows.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-zinc-700 dark:text-zinc-200 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Modal: Inspect Row Details */}
      {inspectRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  Record #{inspectRow.slNo}
                </span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {inspectRow.category} - {inspectRow.location}
                </h3>
              </div>
              <button
                onClick={() => setInspectRow(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4 text-xs">
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-medium">Category</span>
                <p className="font-bold text-zinc-900 dark:text-white text-sm mt-0.5">
                  {inspectRow.category}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-medium">Installation Status</span>
                <p className={`font-bold text-sm mt-0.5 ${inspectRow.installationDone ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {inspectRow.installationDone ? 'Completed (Yes)' : 'Pending (No)'}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-medium">Date</span>
                <p className="font-bold text-zinc-900 dark:text-white text-sm mt-0.5 font-mono">
                  {formatDisplayDate(inspectRow.date)}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-medium">No. of Items</span>
                <p className="font-bold text-zinc-900 dark:text-white text-sm mt-0.5 font-mono">
                  {inspectRow.noOfItems.toLocaleString()}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-medium">Deployment Location</span>
                <p className="font-bold text-zinc-900 dark:text-white text-sm mt-0.5">
                  {inspectRow.location}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-medium">Store Location</span>
                <p className="font-bold text-zinc-900 dark:text-white text-sm mt-0.5">
                  {inspectRow.storeLocation || 'N/A'}
                </p>
              </div>

              <div className="col-span-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-medium">Store Footprint / Counts</span>
                <p className="font-bold text-zinc-900 dark:text-white text-base mt-0.5 font-mono">
                  {inspectRow.storeCounts.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  setEditingRow(inspectRow);
                  setInspectRow(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 transition-colors"
              >
                Edit Record
              </button>
              <button
                onClick={() => setInspectRow(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Edit Row */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEditRow}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-zinc-900 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">
              Edit Record #{editingRow.slNo}
            </h3>

            <div className="grid grid-cols-2 gap-3 py-4 text-xs">
              <div>
                <label className="text-zinc-500 font-medium block mb-1">Category</label>
                <input
                  type="text"
                  value={editingRow.category}
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, category: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-500 font-medium block mb-1">Date</label>
                <input
                  type="text"
                  value={editingRow.date}
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, date: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono"
                  placeholder="29/08/26"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-500 font-medium block mb-1">Location</label>
                <input
                  type="text"
                  value={editingRow.location}
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, location: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-500 font-medium block mb-1">No. of Items</label>
                <input
                  type="number"
                  value={editingRow.noOfItems}
                  onChange={(e) =>
                    setEditingRow({
                      ...editingRow,
                      noOfItems: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-500 font-medium block mb-1">Store Location</label>
                <input
                  type="text"
                  value={editingRow.storeLocation}
                  onChange={(e) =>
                    setEditingRow({
                      ...editingRow,
                      storeLocation: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="text-zinc-500 font-medium block mb-1">Store Counts</label>
                <input
                  type="number"
                  value={editingRow.storeCounts}
                  onChange={(e) =>
                    setEditingRow({
                      ...editingRow,
                      storeCounts: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono"
                  required
                />
              </div>

              <div className="col-span-2 flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editInstalled"
                  checked={editingRow.installationDone}
                  onChange={(e) =>
                    setEditingRow({
                      ...editingRow,
                      installationDone: e.target.checked,
                      installationStatusText: e.target.checked ? 'Yes' : 'Pending',
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="editInstalled" className="text-zinc-700 dark:text-zinc-300 font-medium">
                  Installation is Done / Completed
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Modal: Add New Row */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form
            onSubmit={handleSaveNewRow}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-zinc-900 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">
              Add New Sheet Record
            </h3>

            <div className="grid grid-cols-2 gap-3 py-4 text-xs">
              <div>
                <label className="text-zinc-500 font-medium block mb-1">Sl No.</label>
                <input
                  type="number"
                  value={newRowForm.slNo}
                  onChange={(e) =>
                    setNewRowForm({ ...newRowForm, slNo: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-500 font-medium block mb-1">Category</label>
                <select
                  value={newRowForm.category}
                  onChange={(e) =>
                    setNewRowForm({ ...newRowForm, category: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="Hoarding">Hoarding</option>
                  <option value="Banners">Banners</option>
                  <option value="AutoVenyl">AutoVenyl</option>
                  <option value="Kiosk">Kiosk</option>
                  <option value="Leaflet">Leaflet</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-500 font-medium block mb-1">Date</label>
                <input
                  type="text"
                  value={newRowForm.date}
                  onChange={(e) =>
                    setNewRowForm({ ...newRowForm, date: e.target.value })
                  }
                  placeholder="29/08/26"
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-500 font-medium block mb-1">Location</label>
                <input
                  type="text"
                  value={newRowForm.location}
                  onChange={(e) =>
                    setNewRowForm({ ...newRowForm, location: e.target.value })
                  }
                  placeholder="e.g. Fraser Road"
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-500 font-medium block mb-1">No. of Items</label>
                <input
                  type="number"
                  value={newRowForm.noOfItems}
                  onChange={(e) =>
                    setNewRowForm({
                      ...newRowForm,
                      noOfItems: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-500 font-medium block mb-1">Store Location</label>
                <input
                  type="text"
                  value={newRowForm.storeLocation}
                  onChange={(e) =>
                    setNewRowForm({
                      ...newRowForm,
                      storeLocation: e.target.value,
                    })
                  }
                  placeholder="PL / Boring road"
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="col-span-2">
                <label className="text-zinc-500 font-medium block mb-1">Store Counts</label>
                <input
                  type="number"
                  value={newRowForm.storeCounts}
                  onChange={(e) =>
                    setNewRowForm({
                      ...newRowForm,
                      storeCounts: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono"
                  required
                />
              </div>

              <div className="col-span-2 flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="newInstalled"
                  checked={newRowForm.installationDone}
                  onChange={(e) =>
                    setNewRowForm({
                      ...newRowForm,
                      installationDone: e.target.checked,
                      installationStatusText: e.target.checked ? 'Yes' : 'Pending',
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="newInstalled" className="text-zinc-700 dark:text-zinc-300 font-medium">
                  Installation is Done / Completed
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950"
              >
                Add Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
