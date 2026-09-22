// ======================= Config ================================================
// Conectado de fábrica al Sheet de Merari (Bitácora 1: Mayo-Agosto, Bitácora 2:
// Agosto-Diciembre). Quien abra el dashboard ya ve los datos en vivo sin
// configurar nada. Si algún día cambia el Sheet, basta con actualizar estas
// dos URLs aquí (o usar Configuración para sobreescribirlo solo en un navegador).
const DEFAULT_RAW_URLS = [
  'https://docs.google.com/spreadsheets/d/1TI4c6d1ANwW94SXY3REi3W-6Y59CJXftbyJcYefwzgI/edit?gid=1114020288#gid=1114020288',
  'https://docs.google.com/spreadsheets/d/1TI4c6d1ANwW94SXY3REi3W-6Y59CJXftbyJcYefwzgI/edit?gid=1112205141#gid=1112205141',
];
const DEFAULT_CONFIG = {
  rawUrls: DEFAULT_RAW_URLS,
  csvUrls: DEFAULT_RAW_URLS.map(sheetUrlToCsvUrl),
};

const CONFIG_KEY = 'merari_dashboard_config_v1';

function getConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const cfg = JSON.parse(raw);
      if (cfg.csvUrls && cfg.csvUrls.length >= 2) return cfg;
    }
  } catch (e) { /* ignora y cae al default */ }
  return DEFAULT_CONFIG;
}

function saveConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

function clearConfig() {
  localStorage.removeItem(CONFIG_KEY);
}

// Convierte la URL normal de una pestaña del Sheet (la que se ve en la barra
// del navegador al tenerla abierta) en su URL de exportación CSV.
// Ej: https://docs.google.com/spreadsheets/d/1TI4c.../edit#gid=123456789
//  -> https://docs.google.com/spreadsheets/d/1TI4c.../export?format=csv&gid=123456789
function sheetUrlToCsvUrl(input) {
  const s = (input || '').trim();
  if (!s) return null;
  const idMatch = s.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return null;
  const id = idMatch[1];
  const gidMatch = s.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

// ============================================================================

const EXPECTED_COLS = [
  'Fecha de prospección','Canal de contacto','País','Empresa','Industria','Nombre',
  'Apellido','Proceso','Categoría de puesto','LinkedIn','¿Quién prospectó?',
  'Fecha de invite','¿Invite aceptada?','Fecha del primer mensaje'
];

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i+1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function parseFecha(s) {
  s = (s || '').trim();
  if (!s) return null;
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [_, d, mo, y] = m;
    y = y.length === 2 ? '20' + y : y;
    const dt = new Date(Date.UTC(+y, +mo - 1, +d));
    return isNaN(dt) ? null : dt;
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    const [_, d, mo] = m;
    const dt = new Date(Date.UTC(2026, +mo - 1, +d));
    return isNaN(dt) ? null : dt;
  }
  return null;
}

function parseInviteStatus(s) {
  s = (s || '').trim();
  if (!s || s === '\\-' || s === '-') return false;
  if (/^s[ií]/i.test(s)) return true;
  return false;
}

function mondayOf(d) {
  const day = (d.getUTCDay() + 6) % 7; // 0=Mon
  const dt = new Date(d);
  dt.setUTCDate(d.getUTCDate() - day);
  return dt;
}

function normCargo(cRaw) {
  const c = (cRaw || '').trim();
  const cl = c.toLowerCase();
  if (cl.includes('recursos humanos') || cl === 'gerente de rh' || cl === 'director rh' ||
      cl.includes('atracción de talento') || cl === 'jefa de recursos humanos') return 'Recursos Humanos';
  if (cl === 'ti' || cl === 'it' || cl.includes(' de ti') || cl.includes('deti') ||
      cl.includes(' ti') || cl.includes('de it') || cl.startsWith('gerente de it') ||
      cl.includes('procesos de negocio') || cl === 'director it') return 'TI';
  if (cl.includes('operaciones')) return 'Operaciones';
  if (cl === 'cfo' || cl.includes('finanzas') || cl === 'tax' || cl.includes('impuestos') ||
      cl.includes('contralor')) return 'Finanzas';
  if (cl.includes('cuentas por pagar')) return 'Cuentas por pagar';
  if (cl.includes('compras') || cl.includes('abastecimiento')) return 'Compras';
  if (cl.includes('auditor')) return 'Auditoría Interna';
  if (cl.includes('ehs') || cl.includes('hse') || cl.includes('seguridad patrimonial')) return 'HSE/EHS/Seguridad';
  if (cl.includes('legal')) return 'Legal';
  if (cl.includes('comercial')) return 'Comercial';
  return c || 'Sin especificar';
}

const CARGO_TO_CATEGORIA = {
  'Legal': 'Legal/Compliance/Auditoría-REPSE',
  'Auditoría Interna': 'Legal/Compliance/Auditoría-REPSE',
  'Finanzas': 'Finanzas y Fiscal',
  'Cuentas por pagar': 'Finanzas y Fiscal',
  'HSE/EHS/Seguridad': 'HSE/EHS/Seguridad',
  'Compras': 'Compras y Abastecimiento',
  'Recursos Humanos': 'Recursos Humanos',
  'TI': 'TI/Transformación Digital/Operaciones',
  'Operaciones': 'TI/Transformación Digital/Operaciones',
  'Comercial': 'Otro / Comercial',
};

async function fetchCSV(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo leer el Sheet (HTTP ' + res.status + '). Revisa en Configuración que la URL sea correcta y que el Sheet esté compartido como "Cualquier persona con el enlace: Lector".');
  return await res.text();
}

function rowsToRecords(rows) {
  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 9) continue;
    const rec = {};
    EXPECTED_COLS.forEach((h, idx) => { rec[h] = (r[idx] || '').trim(); });
    if (!rec['Fecha de prospección'] && !rec['Empresa']) continue;
    records.push(rec);
  }
  return records;
}

function buildData(allRecords) {
  const data = allRecords.map(r => {
    const cargoN = normCargo(r['Categoría de puesto']);
    const categoria = CARGO_TO_CATEGORIA[cargoN] || 'Sin categorizar';
    const fp = parseFecha(r['Fecha de prospección']);
    const fm = parseFecha(r['Fecha del primer mensaje']);
    return {
      fp, fm,
      acc: parseInviteStatus(r['¿Invite aceptada?']),
      msg: !!fm,
      cargo: cargoN,
      categoria,
      industria: r['Industria'] || 'Sin dato',
    };
  });

  const total = data.length;
  const totalAcc = data.filter(d => d.acc).length;
  const totalMsg = data.filter(d => d.msg).length;

  const weeklyMap = new Map();
  data.forEach(d => {
    if (!d.fp) return;
    const k = mondayOf(d.fp).toISOString().slice(0,10);
    if (!weeklyMap.has(k)) weeklyMap.set(k, {prospectados:0, aceptados:0, mensajes:0});
    const w = weeklyMap.get(k);
    w.prospectados++;
    if (d.acc) w.aceptados++;
    if (d.msg) w.mensajes++;
  });
  const weekly = [...weeklyMap.entries()].sort((a,b) => a[0] < b[0] ? -1 : 1)
    .map(([semana, v]) => ({ semana, ...v, tasa: v.prospectados ? Math.round(v.aceptados/v.prospectados*1000)/10 : 0 }));

  function breakdown(field) {
    const counts = new Map(), accs = new Map();
    data.forEach(d => {
      const v = d[field] || 'Sin dato';
      counts.set(v, (counts.get(v)||0)+1);
      if (d.acc) accs.set(v, (accs.get(v)||0)+1);
    });
    return [...counts.entries()].sort((a,b) => b[1]-a[1])
      .map(([categoria, prospectados]) => {
        const aceptados = accs.get(categoria) || 0;
        return { categoria, prospectados, aceptados, tasa: Math.round(aceptados/prospectados*1000)/10 };
      });
  }

  return {
    summary: {
      total_prospectados: total,
      total_aceptados: totalAcc,
      tasa_aceptacion_global: total ? Math.round(totalAcc/total*1000)/10 : 0,
      total_mensajes: totalMsg,
      updated: new Date().toISOString(),
    },
    weekly,
    cargo: breakdown('cargo'),
    categoria_script: breakdown('categoria'),
    industria: breakdown('industria'),
  };
}

// API pública del módulo
window.Dashboard = {
  getConfig, saveConfig, clearConfig, sheetUrlToCsvUrl,
  async load() {
    const cfg = getConfig();
    if (!cfg) throw new Error('SIN_CONFIGURAR');
    const texts = await Promise.all(cfg.csvUrls.map(fetchCSV));
    const allRecords = texts.flatMap(t => rowsToRecords(parseCSV(t)));
    if (!allRecords.length) throw new Error('Se leyó el Sheet pero no se encontraron filas de datos. Revisa en Configuración que elegiste la pestaña correcta.');
    return buildData(allRecords);
  }
};
