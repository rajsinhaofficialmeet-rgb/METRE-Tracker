// Parse various date strings into standard Date object and ISO string (YYYY-MM-DD)
export function parseSheetDate(dateStr: string | null | undefined): { date: Date | null; iso: string } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { date: null, iso: '' };
  }

  const clean = dateStr.trim();
  if (!clean) return { date: null, iso: '' };

  // Format 1: DD/MM/YY or DD/MM/YYYY (e.g. 28/08/26 or 28/08/2026)
  const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) {
      year += 2000;
    }
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { date: d, iso };
    }
  }

  // Format 2: YYYY-MM-DD
  const dashMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dashMatch) {
    const year = parseInt(dashMatch[1], 10);
    const month = parseInt(dashMatch[2], 10) - 1;
    const day = parseInt(dashMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { date: d, iso };
    }
  }

  // Native Date fallback
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const iso = d.toISOString().split('T')[0];
    return { date: d, iso };
  }

  return { date: null, iso: '' };
}

export function formatDisplayDate(dateStrOrIso: string): string {
  if (!dateStrOrIso) return 'N/A';
  const { date } = parseSheetDate(dateStrOrIso);
  if (!date) return dateStrOrIso;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function isDateInRange(isoDate: string, startDate?: string, endDate?: string): boolean {
  if (!isoDate) return true; // If no date, do not strictly drop unless range active
  if (!startDate && !endDate) return true;

  if (startDate && isoDate < startDate) return false;
  if (endDate && isoDate > endDate) return false;

  return true;
}
