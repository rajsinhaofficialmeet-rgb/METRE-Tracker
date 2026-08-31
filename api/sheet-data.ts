export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const DEFAULT_SHEET_ID = '1p7_1ApCl2B4t4nWWLnYn3jN7bjOxXSyqzZxdO70hvxY';
  const sheetId = (req.query?.sheetId as string) || DEFAULT_SHEET_ID;
  const gid = (req.query?.gid as string) || '0';
  const authHeader = req.headers?.authorization;

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

  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map((line, idx) => {
      const values = parseLine(line);
      const rowObj: Record<string, any> = { _id: `row-${idx + 1}` };
      headers.forEach((h, i) => {
        rowObj[h] = values[i] !== undefined ? values[i] : '';
      });
      return rowObj;
    });
    return { headers, rows };
  };

  const timestamp = Date.now();
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&_t=${timestamp}`;

  try {
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    if (authHeader) {
      fetchHeaders['Authorization'] = authHeader;
    }

    let csvData = '';
    const response = await fetch(csvUrl, { headers: fetchHeaders });

    if (response.ok) {
      csvData = await response.text();
    } else {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}&_t=${timestamp}`;
      const gvizRes = await fetch(gvizUrl);
      if (gvizRes.ok) {
        csvData = await gvizRes.text();
      } else {
        throw new Error(`Failed to fetch spreadsheet. Status: ${response.status}`);
      }
    }

    const parsed = parseCSV(csvData);
    return res.status(200).json({
      success: true,
      sheetId,
      lastSync: new Date().toISOString(),
      rowCount: parsed.rows.length,
      headers: parsed.headers,
      data: parsed.rows,
    });
  } catch (error: any) {
    console.error('Vercel serverless sheet-data error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
