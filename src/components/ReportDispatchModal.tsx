import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Mail,
  Copy,
  Check,
  Send,
  Sparkles,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Share2,
  Users,
  Phone,
  ArrowUpRight,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Calendar,
  Zap,
} from 'lucide-react';
import { NormalizedSheetRow, KPISummary, FilterState, Stakeholder } from '../types';
import {
  ReportTemplateType,
  generateReportByTemplate,
  generateWhatsAppReport,
} from '../utils/reportGenerator';

interface ReportDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredRows: NormalizedSheetRow[];
  kpis: KPISummary;
  filterState: FilterState;
}

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  role: string;
}

const DEFAULT_STAKEHOLDERS: Stakeholder[] = [
  {
    id: 's1',
    name: 'Raj Sinha (Lead)',
    email: 'rajsinhaofficialmeet@gmail.com',
    role: 'Operations Lead',
    department: 'Marketing & Ops',
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
    name: 'Field Operations',
    email: 'fieldops.patna@mentorseduserv.com',
    role: 'Field Supervisor',
    department: 'Deployment Team',
  },
];

const DEFAULT_WHATSAPP_CONTACTS: WhatsAppContact[] = [
  {
    id: 'w1',
    name: 'Field Ops Lead (Raj Sinha)',
    phone: '',
    role: 'Operations Lead',
  },
  {
    id: 'w2',
    name: 'Outdoor Vendor Patna',
    phone: '',
    role: 'Fabrication & Install',
  },
  {
    id: 'w3',
    name: 'Mentors Executive Group',
    phone: '',
    role: 'Management Stakeholders',
  },
];

export const ReportDispatchModal: React.FC<ReportDispatchModalProps> = ({
  isOpen,
  onClose,
  filteredRows,
  kpis,
  filterState,
}) => {
  const [templateType, setTemplateType] = useState<ReportTemplateType>('whatsapp_quick');
  const [reportText, setReportText] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'email' | 'preview'>('whatsapp');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  // WhatsApp Channel State
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  // Email Channel State
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(DEFAULT_STAKEHOLDERS);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([
    'rajsinhaofficialmeet@gmail.com',
    'management@mentorseduserv.com',
  ]);
  const [customEmailInput, setCustomEmailInput] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Initialize or re-generate report text when template changes
  useEffect(() => {
    if (isOpen) {
      const generated = generateReportByTemplate(templateType, filteredRows, kpis, filterState);
      setReportText(generated.text);
      setSubject(generated.subject);
    }
  }, [templateType, isOpen, filteredRows, kpis, filterState]);

  if (!isOpen) return null;

  // Character & word statistics
  const charCount = reportText.length;
  const wordCount = reportText.trim() ? reportText.trim().split(/\s+/).length : 0;
  const isWhatsAppLengthOptimal = charCount <= 3000;

  // 1. Copy to Clipboard Action
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // 2. Generate with Gemini AI
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/generate-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType:
            templateType === 'whatsapp_quick'
              ? 'WhatsApp Fast Field Digest'
              : templateType === 'pending_checklist'
              ? 'Pending Installations Punchlist'
              : 'Executive Project Operations Brief',
          dateRange: { start: filterState.startDate, end: filterState.endDate },
          stats: {
            totalItems: kpis.totalItems,
            completionRate: `${kpis.completionRate}%`,
            totalStoreCounts: kpis.totalStoreCounts,
            uniqueLocations: kpis.uniqueLocations,
            topLocation: kpis.topLocation,
            topCategory: kpis.topCategory,
            installedItems: kpis.installedItems,
            pendingItems: kpis.pendingItems,
          },
          filteredRows: filteredRows.slice(0, 15),
          targetAudience:
            activeChannel === 'whatsapp'
              ? 'Field Team & Instant WhatsApp Group'
              : 'Executive Management & Operations Leadership',
        }),
      });

      const data = await res.json();
      if (data.success && data.summary) {
        setReportText(data.summary);
        if (data.subject) {
          setSubject(data.subject);
        }
      }
    } catch (err: any) {
      console.warn('AI summary fetch failed, keeping formatted template:', err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 3. WhatsApp Dispatch Handlers
  const handleSendWhatsApp = (mode: 'direct' | 'web' = 'direct') => {
    const encodedText = encodeURIComponent(reportText);
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    // If country code is specified and phone doesn't have it
    if (cleanPhone) {
      const codeOnly = countryCode.replace('+', '');
      if (!cleanPhone.startsWith(codeOnly) && cleanPhone.length === 10) {
        cleanPhone = `${codeOnly}${cleanPhone}`;
      }
    }

    let url = '';
    if (mode === 'web') {
      url = cleanPhone
        ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
        : `https://web.whatsapp.com/send?text=${encodedText}`;
    } else {
      url = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 4. Email Dispatch Handlers
  const handleOpenMailto = () => {
    const to = selectedEmails.join(',');
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(reportText);
    const mailtoUrl = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
    window.location.href = mailtoUrl;
  };

  const handleOpenGmailWeb = () => {
    const to = encodeURIComponent(selectedEmails.join(','));
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(reportText);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${encodedSubject}&body=${encodedBody}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendDirectServerEmail = async () => {
    if (selectedEmails.length === 0) {
      setEmailStatus({
        success: false,
        message: 'Please select at least one recipient email.',
      });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus(null);

    const formattedHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="background: #0f172a; padding: 18px; border-radius: 8px; margin-bottom: 20px; color: #ffffff;">
          <h2 style="margin: 0 0 4px 0; font-size: 18px; color: #ffffff;">Mentors Eduserv Offline Campaign Report</h2>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">${subject}</p>
        </div>
        <div style="font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-line;">
          ${reportText.replace(/###/g, '<h3 style="color:#0f172a;margin-top:16px;">').replace(/####/g, '<h4 style="color:#334155;margin-top:12px;">')}
        </div>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
          <p style="margin: 0;">Automated Report • Mentors Eduserv Live Operations Tracker</p>
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
        setEmailStatus({
          success: true,
          message: `Dispatched to ${selectedEmails.length} recipient(s)!`,
        });
      } else {
        setEmailStatus({
          success: false,
          message: data.error || 'Failed to dispatch email.',
        });
      }
    } catch (err: any) {
      setEmailStatus({
        success: false,
        message: err.message || 'Network error sending email.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleToggleEmailRecipient = (email: string) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter((e) => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const handleAddCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmailInput || !customEmailInput.includes('@')) return;
    const trimmed = customEmailInput.trim();
    if (!selectedEmails.includes(trimmed)) {
      setSelectedEmails([...selectedEmails, trimmed]);
      setStakeholders([
        ...stakeholders,
        {
          id: `s-${Date.now()}`,
          name: trimmed.split('@')[0],
          email: trimmed,
          role: 'Custom Recipient',
          department: 'Stakeholder',
        },
      ]);
    }
    setCustomEmailInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800 gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Share2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Report Dispatcher & Instant Share
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  WhatsApp & Email Ready
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                Generate formatted text reports • 1-Click Copy • Send via WhatsApp or Email
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

        {/* Template Selector & AI Bar */}
        <div className="py-3 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0">
          {/* Template Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
            <span className="text-zinc-400 dark:text-zinc-500 text-[11px] font-mono mr-1 shrink-0">
              Template:
            </span>
            <button
              onClick={() => setTemplateType('whatsapp_quick')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                templateType === 'whatsapp_quick'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp Quick Digest</span>
            </button>

            <button
              onClick={() => setTemplateType('executive_summary')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                templateType === 'executive_summary'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Executive Brief</span>
            </button>

            <button
              onClick={() => setTemplateType('location_breakdown')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                templateType === 'location_breakdown'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Location Breakdown</span>
            </button>

            <button
              onClick={() => setTemplateType('pending_checklist')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                templateType === 'pending_checklist'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Pending Punchlist ({kpis.pendingItems})</span>
            </button>
          </div>

          {/* AI Generator & Reset */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-50 min-h-[34px]"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAI ? 'Generating AI Report...' : 'Generate with AI'}</span>
            </button>

            <button
              onClick={handleCopy}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[34px] ${
                isCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs'
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Report'}</span>
            </button>
          </div>
        </div>

        {/* Main Body: Two-Column Editor & Dispatch Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-4 overflow-y-auto flex-1">
          {/* Left Column (7/12): Formatted Text Editor */}
          <div className="lg:col-span-7 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Report Content (Editable)
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {charCount} chars • {wordCount} words
                </span>
              </div>

              {templateType === 'whatsapp_quick' && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    isWhatsAppLengthOptimal
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}
                >
                  {isWhatsAppLengthOptimal ? '✓ WhatsApp Optimal' : '⚠️ Long Message'}
                </span>
              )}
            </div>

            {/* Email Subject Input (if in email or executive mode) */}
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Report Subject Line..."
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>

            {/* Editable Text Area */}
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={12}
              className="flex-1 w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-xs leading-relaxed focus:ring-1 focus:ring-emerald-500 resize-none min-h-[220px]"
              placeholder="Report text will appear here..."
            />

            {/* Quick Text Formatting Helper Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono pt-1">
              <span>Tip: WhatsApp formatting uses <code className="text-emerald-500">*bold*</code>, <code className="text-emerald-500">_italics_</code>, and <code className="text-emerald-500">• bullets</code>.</span>
              <button
                onClick={() => {
                  const generated = generateReportByTemplate(templateType, filteredRows, kpis, filterState);
                  setReportText(generated.text);
                }}
                className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to template</span>
              </button>
            </div>
          </div>

          {/* Right Column (5/12): Dispatch Tabs & Direct Action Center */}
          <div className="lg:col-span-5 flex flex-col space-y-3 bg-zinc-50 dark:bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            {/* Channel Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-900 text-xs font-semibold">
              <button
                onClick={() => setActiveChannel('whatsapp')}
                className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  activeChannel === 'whatsapp'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => setActiveChannel('email')}
                className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  activeChannel === 'email'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Mail className="w-4 h-4 text-indigo-500" />
                <span>Email</span>
              </button>

              <button
                onClick={() => setActiveChannel('preview')}
                className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  activeChannel === 'preview'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-zinc-500" />
                <span>Preview</span>
              </button>
            </div>

            {/* CHANNEL 1: WHATSAPP DISPATCH */}
            {activeChannel === 'whatsapp' && (
              <div className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-[11px] leading-relaxed">
                    <strong>Direct WhatsApp Sharing:</strong> Send this report instantly to your team group, field vendors, or management directly on WhatsApp.
                  </div>

                  {/* Specific Recipient Phone (Optional) */}
                  <div>
                    <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">
                      Direct WhatsApp Number (Optional)
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        aria-label="Country Dialing Code"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs w-20"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+971">+971 (UAE)</option>
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 9876543210 (Leave blank for contact picker)"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Quick WhatsApp Contacts */}
                  <div>
                    <span className="text-[11px] text-zinc-500 font-semibold block mb-1">
                      Quick Contact Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_WHATSAPP_CONTACTS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedContactId(c.id);
                            if (c.phone) setPhoneNumber(c.phone);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${
                            selectedContactId === c.id
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* WhatsApp Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => handleSendWhatsApp('direct')}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Send via WhatsApp App / Mobile</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleSendWhatsApp('web')}
                    className="w-full py-2 px-4 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Open in WhatsApp Web</span>
                  </button>
                </div>
              </div>
            )}

            {/* CHANNEL 2: EMAIL DISPATCH */}
            {activeChannel === 'email' && (
              <div className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-[11px] leading-relaxed">
                    <strong>Email Options:</strong> Dispatch pre-formatted report using your default email client (Apple Mail, Outlook), Gmail Web, or direct automated server dispatch.
                  </div>

                  {/* Stakeholders List */}
                  <div>
                    <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1.5">
                      Recipients ({selectedEmails.length} selected):
                    </label>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {stakeholders.map((s) => {
                        const isSelected = selectedEmails.includes(s.email);
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleToggleEmailRecipient(s.email)}
                            className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-xs truncate">{s.name}</p>
                              <p className="text-[10px] font-mono text-zinc-400 truncate">{s.email}</p>
                            </div>
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-indigo-600 text-white' : 'border border-zinc-400'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Custom Email */}
                  <form onSubmit={handleAddCustomEmail} className="flex gap-1.5">
                    <input
                      type="email"
                      value={customEmailInput}
                      onChange={(e) => setCustomEmailInput(e.target.value)}
                      placeholder="Add custom email address..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs"
                    >
                      Add
                    </button>
                  </form>

                  {emailStatus && (
                    <div
                      className={`p-2 rounded-lg text-[11px] font-mono flex items-center gap-1.5 ${
                        emailStatus.success
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {emailStatus.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{emailStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* Email Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleOpenMailto}
                      className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Default Mail</span>
                    </button>

                    <button
                      onClick={handleOpenGmailWeb}
                      className="py-2 px-3 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Gmail Web</span>
                    </button>
                  </div>

                  <button
                    onClick={handleSendDirectServerEmail}
                    disabled={isSendingEmail}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-spin' : ''}`} />
                    <span>{isSendingEmail ? 'Dispatching...' : 'Dispatch Automated Email'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* CHANNEL 3: LIVE PREVIEW BUBBLE */}
            {activeChannel === 'preview' && (
              <div className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-zinc-500 text-[11px] font-mono">
                    <span>WhatsApp Chat Bubble Rendering:</span>
                    <span className="text-emerald-500">Live Preview</span>
                  </div>

                  {/* Simulated WhatsApp Bubble */}
                  <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-3 rounded-xl border border-zinc-300 dark:border-zinc-800 max-h-[300px] overflow-y-auto">
                    <div className="bg-[#dcf8c6] dark:bg-[#005c4b] text-zinc-900 dark:text-[#e9edef] p-3 rounded-lg rounded-tr-none shadow-xs text-xs font-sans whitespace-pre-wrap leading-relaxed">
                      {reportText}
                      <div className="text-[9px] text-zinc-500 dark:text-[#8696a0] text-right mt-1.5 flex items-center justify-end gap-1 font-mono">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-sky-500 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={handleCopy}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800 gap-2 shrink-0">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono hidden sm:block">
            Targeting: {filteredRows.length} rows • {kpis.totalItems.toLocaleString()} items • {kpis.completionRate}% Done
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 min-h-[38px]"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-xs flex items-center gap-1.5 min-h-[38px]"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied!' : 'Copy Report'}</span>
            </button>
            <button
              onClick={() => handleSendWhatsApp('direct')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 min-h-[38px]"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
