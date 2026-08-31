import React, { useState } from 'react';
import {
  Mail,
  Send,
  Sparkles,
  Clock,
  CheckCircle2,
  Users,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  History,
  FileText,
} from 'lucide-react';
import { NormalizedSheetRow, KPISummary, FilterState, EmailLog, Stakeholder } from '../types';

interface EmailDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredRows: NormalizedSheetRow[];
  kpis: KPISummary;
  filterState: FilterState;
}

const DEFAULT_STAKEHOLDERS: Stakeholder[] = [
  {
    id: 's1',
    name: 'Raj Sinha (Lead)',
    email: 'rajsinhaofficialmeet@gmail.com',
    role: 'Operations Lead',
    department: 'Marketing & Field Ops',
  },
  {
    id: 's2',
    name: 'Project Stakeholder',
    email: 'management@mentorseduserv.com',
    role: 'Executive Director',
    department: 'Leadership',
  },
  {
    id: 's3',
    name: 'Campaign Head',
    email: 'marketing.offline@mentorseduserv.com',
    role: 'Offline Brand Head',
    department: 'Brand Marketing',
  },
];

export const EmailDistributionModal: React.FC<EmailDistributionModalProps> = ({
  isOpen,
  onClose,
  filteredRows,
  kpis,
  filterState,
}) => {
  const [reportType, setReportType] = useState<
    'Weekly Project Summary' | 'Daily Stakeholder Digest' | 'Executive Operations Brief'
  >('Weekly Project Summary');

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(DEFAULT_STAKEHOLDERS);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([
    'rajsinhaofficialmeet@gmail.com',
    'management@mentorseduserv.com',
  ]);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');

  const [subject, setSubject] = useState(
    `[Weekly Summary] Mentors Eduserv Marketing & Deployment Update (${filterState.startDate || 'Latest'} - ${filterState.endDate || 'Active'})`
  );

  const [emailBody, setEmailBody] = useState<string>(() => {
    return `### Mentors Eduserv - Offline Marketing Campaign Update

**Reporting Period:** ${filterState.startDate || 'All Dates'} to ${filterState.endDate || 'Present'}
**Total Deployment Volume:** ${kpis.totalItems.toLocaleString()} Items tracked
**Current Installation Rate:** ${kpis.completionRate}% (${kpis.installedItems} Installed / ${kpis.pendingItems} Pending)
**Estimated Store Footprint Reach:** ${kpis.totalStoreCounts.toLocaleString()}

#### Key Operational Highlights:
- Top performing deployment zone is **${kpis.topLocation.name || 'Boring Road'}** with **${kpis.topLocation.items} items**.
- Active media types include **Hoardings, Banners, and Auto Vinyls** across key city junctions.
- High store count conversions noted along prime commercial streets.

#### Next Action Items:
1. Complete remaining pending site installations.
2. Conduct photo verification audit across high footfall hubs.
3. Prepare mid-campaign vendor performance evaluation.`;
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'compose' | 'schedule' | 'history'>('compose');

  // Schedule config
  const [scheduleFrequency, setScheduleFrequency] = useState<'weekly' | 'daily'>('weekly');
  const [scheduleDay, setScheduleDay] = useState<string>('Monday');
  const [scheduleTime, setScheduleTime] = useState<string>('09:00');
  const [isAutoScheduleActive, setIsAutoScheduleActive] = useState<boolean>(true);

  // Email Logs
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 3600000 * 24 * 3).toLocaleString(),
      subject: '[Weekly Summary] Mentors Eduserv Marketing Sprint 1',
      recipients: ['rajsinhaofficialmeet@gmail.com'],
      reportType: 'Weekly Project Summary',
      status: 'Delivered',
    },
  ]);

  if (!isOpen) return null;

  const handleToggleRecipient = (email: string) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter((e) => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const handleAddStakeholder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return;
    const item: Stakeholder = {
      id: `s-${Date.now()}`,
      name: newName || newEmail.split('@')[0],
      email: newEmail.trim(),
      role: 'Stakeholder',
      department: 'Operations',
    };
    setStakeholders([...stakeholders, item]);
    setSelectedEmails([...selectedEmails, item.email]);
    setNewEmail('');
    setNewName('');
  };

  const handleGenerateAISummary = async () => {
    setIsGeneratingAI(true);
    setSendStatus(null);
    try {
      const res = await fetch('/api/generate-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          dateRange: { start: filterState.startDate, end: filterState.endDate },
          stats: {
            totalItems: kpis.totalItems,
            completionRate: `${kpis.completionRate}%`,
            totalStoreCounts: kpis.totalStoreCounts,
            uniqueLocations: kpis.uniqueLocations,
            topLocation: kpis.topLocation,
            topCategory: kpis.topCategory,
          },
          filteredRows: filteredRows.slice(0, 15),
          targetAudience: 'Executive Leadership & Field Operations Managers',
        }),
      });

      const data = await res.json();
      if (data.success && data.summary) {
        setEmailBody(data.summary);
        if (data.subject) {
          setSubject(data.subject);
        }
      }
    } catch (err: any) {
      console.error('Failed to generate AI summary:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSendEmail = async () => {
    if (selectedEmails.length === 0) {
      setSendStatus({
        success: false,
        message: 'Please select at least one recipient email.',
      });
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    // Convert markdown to clean HTML email format
    const formattedHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="background: #0f172a; padding: 18px; border-radius: 8px; margin-bottom: 20px; color: #ffffff;">
          <h2 style="margin: 0 0 6px 0; font-size: 18px; color: #ffffff;">Mentors Eduserv Offline Marketing</h2>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">${reportType} • Live Data Synchronized Report</p>
        </div>
        
        <div style="font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-line;">
          ${emailBody.replace(/###/g, '<h3 style="color:#0f172a;margin-top:16px;">').replace(/####/g, '<h4 style="color:#334155;margin-top:12px;">')}
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
          <p style="margin: 0;">Generated automatically via Mentors Eduserv Live Operations Dashboard.</p>
          <p style="margin: 4px 0 0 0;">Connected Sheet ID: 1p7_1ApCl2B4t4nWWLnYn3jN7bjOxXSyqzZxdO70hvxY</p>
        </div>
      </div>
    `;

    try {
      const res = await fetch('/api/send-email-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedEmails,
          subject,
          bodyHtml: formattedHtml,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSendStatus({
          success: true,
          message: `Update dispatched successfully to ${selectedEmails.length} stakeholder(s)!`,
        });

        // Add to logs
        const newLog: EmailLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          subject,
          recipients: selectedEmails,
          reportType,
          status: 'Delivered',
        };
        setEmailLogs([newLog, ...emailLogs]);
      } else {
        setSendStatus({
          success: false,
          message: data.error || 'Failed to dispatch email.',
        });
      }
    } catch (err: any) {
      setSendStatus({
        success: false,
        message: err.message || 'Error communicating with mail server.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shrink-0">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Stakeholder Email Distribution
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Dispatch AI-generated weekly summaries & operational updates
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

        {/* Tabs: Compose | Schedule | History */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 font-semibold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'compose'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 font-semibold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'schedule'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 font-semibold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'history'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({emailLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Compose Email */}
        {activeTab === 'compose' && (
          <div className="py-4 space-y-4 text-xs">
            {/* Template & AI Trigger Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
                  Report Type
                </label>
                <select
                  aria-label="Report Type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium"
                >
                  <option value="Weekly Project Summary">Weekly Project Summary</option>
                  <option value="Daily Stakeholder Digest">Daily Stakeholder Digest</option>
                  <option value="Executive Operations Brief">Executive Operations Brief</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateAISummary}
                  disabled={isGeneratingAI}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-semibold shadow-xs disabled:opacity-50 transition-all"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                  <span>
                    {isGeneratingAI ? 'Generating with Gemini...' : 'Generate AI Executive Summary'}
                  </span>
                </button>
              </div>
            </div>

            {/* Recipient Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-zinc-400" /> Stakeholder Recipients ({selectedEmails.length} selected)
                </label>
              </div>

              <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 max-h-28 overflow-y-auto">
                {stakeholders.map((s) => {
                  const isChecked = selectedEmails.includes(s.email);
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleToggleRecipient(s.email)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        isChecked
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-transparent'
                          : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                      }`}
                    >
                      <span>{s.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">({s.email})</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Stakeholder Form */}
              <form onSubmit={handleAddStakeholder} className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Stakeholder Name (optional)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200"
                />
                <input
                  type="email"
                  placeholder="name@organization.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Subject Line */}
            <div>
              <label className="text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              />
            </div>

            {/* Email Body Content */}
            <div>
              <label className="text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
                Email Content (Markdown & Formatted)
              </label>
              <textarea
                rows={8}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            {/* Status Alert */}
            {sendStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  sendStatus.success
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {sendStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{sendStatus.message}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending || selectedEmails.length === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs disabled:opacity-50 transition-all"
              >
                <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                <span>{isSending ? 'Dispatching...' : `Send Update (${selectedEmails.length})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Automated Schedule */}
        {activeTab === 'schedule' && (
          <div className="py-4 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">
                    Automated Recurring Digest Cron
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoScheduleActive}
                    onChange={(e) => setIsAutoScheduleActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900 dark:peer-checked:bg-zinc-100"></div>
                </label>
              </div>

              <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                When enabled, the server automatically reads the live Google Spreadsheet at the scheduled time, synthesizes the latest installation KPIs and store counts, and dispatches the project summary report to selected stakeholders.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-500 font-medium block mb-1">Frequency</label>
                  <select
                    aria-label="Frequency"
                    value={scheduleFrequency}
                    onChange={(e) => setScheduleFrequency(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>

                {scheduleFrequency === 'weekly' && (
                  <div>
                    <label className="text-zinc-500 font-medium block mb-1">Day of Week</label>
                    <select
                      aria-label="Day of Week"
                      value={scheduleDay}
                      onChange={(e) => setScheduleDay(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="Monday">Every Monday</option>
                      <option value="Wednesday">Every Wednesday</option>
                      <option value="Friday">Every Friday</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-zinc-500 font-medium block mb-1">Dispatch Time</label>
                  <input
                    type="time"
                    aria-label="Dispatch Time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Next Scheduled Dispatch:</span>
                  <span className="text-[11px] font-mono">
                    {scheduleFrequency === 'weekly' ? scheduleDay : 'Tomorrow'} at {scheduleTime} (Local Time) to {selectedEmails.length} recipients.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950"
              >
                Save Schedule Preferences
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: History Log */}
        {activeTab === 'history' && (
          <div className="py-4 space-y-3 text-xs">
            <h3 className="font-bold text-zinc-800 dark:text-zinc-200">
              Recent Automated & Manual Dispatches
            </h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              {emailLogs.map((log) => (
                <div key={log.id} className="p-3 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {log.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {log.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    <span>To: {log.recipients.join(', ')}</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
