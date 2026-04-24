// ================================================================
//  StockWard — Configuration & shared utilities
//  Only GAS_URL and SPREADSHEET_ID live here.
//  No keys, no passwords — auth is handled by the backend.
// ================================================================

const CONFIG = {
  // Your GAS Web App deployment URL
  GAS_URL:
    'https://script.google.com/macros/s/AKfycbx68ZfBR8uI0472Ngu3SC8LUjd_0c0T0Ur9oMEzBujrfMruZKkQ374TtzzRGj-_bs-UuA/exec',

  // The long ID in your Google Sheets URL (between /d/ and /edit)
  SPREADSHEET_ID: '1GPQC9QVNk1SPQub1xWzag7DKg_MCSFZSSRZ7HaoM748',
};

// ── Drug category colours (labels come from lang.js) ─────────────
const CATS = {
  // ── Exact DRUG_CATEGORY values from MED_ID sheet (trimmed) ───────
  'รายการยาทั่วไป':      { color: '#1A73E8' },  // General      → Blue
  'ยาตา':                { color: '#9334E6' },  // Eye drops    → Purple
  'กลุ่มยาแช่เย็น':     { color: '#1E8E3E' },  // Refrigerated → Green
  'ยาแช่เย็นในวิสัญญี': { color: '#1E8E3E' },  // Refrig (Anes)→ Green
  'ยาแช่เย็นตึก50ปี':   { color: '#1E8E3E' },  // Refrig (Bld) → Green
  'ยาเสพติด':            { color: '#E8710A' },  // Narcotic     → Orange
  'High Alert Drugs':    { color: '#C5221F' },  // High Alert   → Red
  'high alert drugs':    { color: '#C5221F' },  // (lowercase fallback)
  // ── English aliases ───────────────────────────────────────────────
  general:       { color: '#1A73E8' },
  eye:           { color: '#9334E6' },
  refrigerated:  { color: '#1E8E3E' },
  narcotic:      { color: '#E8710A' },
  high_alert:    { color: '#C5221F' },
  cpr_box:       { color: '#00897B' },
};

// ── Password hashing (SHA-256, name-salted) ───────────────────────
// Hash = SHA256(name.toLowerCase() + ":" + password)
// The name acts as a per-user salt so hashes can't be cross-referenced.
async function hashPassword(name, password) {
  const input = name.trim().toLowerCase() + ':' + password;
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Session storage ───────────────────────────────────────────────
// Stores credentials for the browser session so the user doesn't
// need to re-login on refresh. Cleared when the tab is closed.
function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem('sw_sess') || 'null');
  } catch {
    return null;
  }
}
function saveSession(data) {
  sessionStorage.setItem('sw_sess', JSON.stringify(data));
}
function clearSession() {
  sessionStorage.removeItem('sw_sess');
}

// ── GAS POST with exponential backoff ────────────────────────────
async function callGAS(action, data = {}, attempt = 0) {
  const MAX = 6;
  const body = { action, ...data };
  try {
    const res = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.retryable && attempt < MAX) {
      await sleep(Math.min(800 * 2 ** attempt + Math.random() * 400, 25000));
      return callGAS(action, data, attempt + 1);
    }
    return json;
  } catch (e) {
    if (attempt < MAX) {
      await sleep(Math.min(1000 * 2 ** attempt, 16000));
      return callGAS(action, data, attempt + 1);
    }
    throw e;
  }
}

// ── gviz (zero GAS runtime) ───────────────────────────────────────
function parseGviz(text) {
  const m = text.match(
    /google\.visualization\.Query\.setResponse\(([\s\S]+?)\);?\s*$/,
  );
  if (!m) throw new Error('Invalid gviz response');
  const res = JSON.parse(m[1]);
  if (res.status === 'error')
    throw new Error(res.errors?.[0]?.detailed_message || 'gviz error');
  const cols = (res.table?.cols || []).map((c) => ({ id: c.id, label: c.label }));
  return (res.table?.rows || []).map((row) => {
    const obj = {};
    (row.c || []).forEach((cell, i) => {
      const val = cell ? cell.v : null;
      const { id, label } = cols[i];
      // Always store by letter key (e.g. "F") — works even without a header row.
      // Also store by header label (e.g. "USER_ID") when it exists.
      // Access code always uses label first: r["USER_ID"] || r["F"]
      if (id)    obj[id]    = val;
      if (label) obj[label] = val;
    });
    return obj;
  });
}

async function gviz(sheetName, query = '') {
  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/gviz/tq`,
  );
  url.searchParams.set('tqx', 'out:json');
  url.searchParams.set('sheet', sheetName);
  if (query) url.searchParams.set('tq', query);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`gviz HTTP ${res.status}`);
  return parseGviz(await res.text());
}

// ── Utilities ─────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? '')).join(','),
    ),
  ].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }),
  );
  a.download = filename;
  a.click();
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// At the bottom of your existing config.js
if (typeof module !== 'undefined') {
  module.exports = { CONFIG, hashPassword, callGAS };
}