import * as XLSX from 'xlsx';

export type UnderwritingData = {
  units?: number;
  occupiedUnits?: number;
  occupancy?: number; // 0-1
  avgRent?: number;
  gprAnnual?: number; // Gross Potential Rent
  otherIncomeAnnual?: number;
  vacancyLossAnnual?: number;
  egiAnnual?: number; // Effective Gross Income
  opExAnnual?: number; // Operating Expenses
  noiAnnual?: number; // Net Operating Income
  notes?: string[];
};

type ParsedTable = { headers: string[]; rows: (string | number)[][] };

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function parseCSV(text: string): ParsedTable {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(s => s.trim());
  const rows = lines.slice(1).map(l => l.split(',').map(s => s.trim()));
  return { headers, rows };
}

function parseXLSX(file: File): Promise<ParsedTable[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read XLSX file'));
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const tables: ParsedTable[] = [];
        wb.SheetNames.forEach(name => {
          const ws = wb.Sheets[name];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1 }) as (string | number)[][];
          if (!json || json.length === 0) return;
          const headers = (json[0] || []).map(v => String(v));
          const rows = json.slice(1);
          tables.push({ headers, rows });
        });
        resolve(tables);
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export async function extractUnderwritingDataFromFile(file: File): Promise<UnderwritingData> {
  const name = file.name.toLowerCase();
  const notes: string[] = [];
  let tables: ParsedTable[] = [];

  if (name.endsWith('.csv')) {
    const text = await readText(file);
    tables = [parseCSV(text)];
  } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    try { tables = await parseXLSX(file); } catch (e: any) { notes.push('XLSX parse failed: ' + (e?.message || e)); }
  } else if (name.endsWith('.txt') || name.endsWith('.json')) {
    const text = await readText(file);
    // naive attempt: treat as CSV-like if commas present
    if (/[,\t]/.test(text)) {
      tables = [parseCSV(text.replace(/\t/g, ','))];
    } else {
      notes.push('Unsupported text format; attach CSV/XLSX for best results');
    }
  } else {
    notes.push('Unsupported file type for automated parsing; please upload CSV/XLSX exports of T12 and rent roll');
  }

  const data: UnderwritingData = { notes };
  for (const table of tables) {
    const headersNorm = table.headers.map(normalizeHeader);
    const hIndex = (key: string) => headersNorm.findIndex(h => h.includes(key));

    // Attempt rent roll parsing
    const rentIdx = hIndex('rent');
    const statusIdx = hIndex('status');
    const unitIdx = hIndex('unit');
    if (rentIdx !== -1) {
      let units = 0;
      let occupied = 0;
      let rentSum = 0;
      table.rows.forEach(r => {
        const rentVal = toNumber(r[rentIdx]);
        if (Number.isFinite(rentVal) && rentVal > 0) {
          units += 1;
          rentSum += rentVal;
          const status = String(r[statusIdx] || '').toLowerCase();
          if (statusIdx !== -1) {
            if (status.includes('occ') || status.includes('current')) occupied += 1;
          } else {
            // If no status column, assume occupied when rent > 0
            occupied += 1;
          }
        } else if (unitIdx !== -1 && String(r[unitIdx]).trim()) {
          units += 1; // count units even if rent missing
        }
      });
      if (units > 0) {
        data.units = Math.max(data.units || 0, units);
        data.occupiedUnits = Math.max(data.occupiedUnits || 0, occupied);
        data.avgRent = Math.max(data.avgRent || 0, rentSum / Math.max(units, 1));
      }
    }

    // Attempt T12 income/expense parsing
    const incomeIdx = findHeaderIndex(headersNorm, ['total_income', 'income_total', 'total_rent', 'gross_potential_rent']);
    const otherIncIdx = findHeaderIndex(headersNorm, ['other_income']);
    const vacancyIdx = findHeaderIndex(headersNorm, ['vacancy', 'loss_to_lease']);
    const opExIdx = findHeaderIndex(headersNorm, ['operating_expenses', 'total_expenses', 'opex_total']);
    const noiIdx = findHeaderIndex(headersNorm, ['noi', 'net_operating_income']);

    const sumColumn = (idx: number): number | undefined => {
      if (idx === -1) return undefined;
      let s = 0; let count = 0;
      table.rows.forEach(r => {
        const n = toNumber(r[idx]);
        if (Number.isFinite(n)) { s += n; count++; }
      });
      return count > 0 ? s : undefined;
    };

    const income = sumColumn(incomeIdx);
    const otherInc = sumColumn(otherIncIdx);
    const vacancy = sumColumn(vacancyIdx);
    const opEx = sumColumn(opExIdx);
    const noi = sumColumn(noiIdx);

    if (income != null) data.gprAnnual = Math.max(data.gprAnnual || 0, income);
    if (otherInc != null) data.otherIncomeAnnual = Math.max(data.otherIncomeAnnual || 0, otherInc);
    if (vacancy != null) data.vacancyLossAnnual = Math.max(data.vacancyLossAnnual || 0, Math.abs(vacancy));
    if (opEx != null) data.opExAnnual = Math.max(data.opExAnnual || 0, opEx);
    if (noi != null) data.noiAnnual = Math.max(data.noiAnnual || 0, noi);
  }

  // Derive missing metrics
  if (data.units && data.avgRent && !data.gprAnnual) {
    data.gprAnnual = Math.round((data.units * data.avgRent) * 12);
  }
  if (data.gprAnnual != null && data.otherIncomeAnnual != null && data.vacancyLossAnnual != null) {
    data.egiAnnual = Math.round((data.gprAnnual + data.otherIncomeAnnual) - data.vacancyLossAnnual);
  }
  if (data.egiAnnual != null && data.opExAnnual != null) {
    data.noiAnnual = Math.round(data.egiAnnual - data.opExAnnual);
  }
  if (data.occupiedUnits != null && data.units) {
    data.occupancy = +(data.occupiedUnits / data.units).toFixed(3);
  }

  return data;
}

export function formatUnderwritingDataSummary(data: UnderwritingData): string {
  const parts: string[] = [];
  if (data.units != null) parts.push(`Units: ${data.units}`);
  if (data.occupancy != null) parts.push(`Occupancy: ${(data.occupancy * 100).toFixed(1)}%`);
  if (data.avgRent != null) parts.push(`Avg Rent: $${Math.round(data.avgRent).toLocaleString()}`);
  if (data.gprAnnual != null) parts.push(`GPR Annual: $${Math.round(data.gprAnnual).toLocaleString()}`);
  if (data.otherIncomeAnnual != null) parts.push(`Other Income Annual: $${Math.round(data.otherIncomeAnnual).toLocaleString()}`);
  if (data.vacancyLossAnnual != null) parts.push(`Vacancy/LTL Annual: $${Math.round(data.vacancyLossAnnual).toLocaleString()}`);
  if (data.egiAnnual != null) parts.push(`EGI Annual: $${Math.round(data.egiAnnual).toLocaleString()}`);
  if (data.opExAnnual != null) parts.push(`OpEx Annual: $${Math.round(data.opExAnnual).toLocaleString()}`);
  if (data.noiAnnual != null) parts.push(`NOI Annual: $${Math.round(data.noiAnnual).toLocaleString()}`);
  const notes = (data.notes || []).length ? `\nNotes: ${data.notes.join('; ')}` : '';
  return parts.length ? `Parsed Property Data:\n- ${parts.join('\n- ')}${notes}` : `No structured data parsed.`;
}

function toNumber(v: any): number | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[$%,]/g, '').trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsText(file);
  });
}

function findHeaderIndex(headersNorm: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headersNorm.findIndex(h => h.includes(c));
    if (idx !== -1) return idx;
  }
  return -1;
}