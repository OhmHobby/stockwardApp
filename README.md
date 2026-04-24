# StockWard — ระบบตรวจสอบยาคงคลัง

Excited to share a system that's quietly transforming how 50+ healthcare professionals audit medication inventory across an entire hospital. 🚀

No servers. No licensing fees. No vendor lock-in. Just Google Sheets, a sprinkle of Apps Script, and GitHub Pages doing what enterprise software charges six figures to do.

The stack? Brutally simple. Reads hit Google Sheets directly via gviz (zero backend cost). Writes go through Google Apps Script. The whole thing lives on GitHub Pages for free. Some would call it scrappy. I call it **efficient**.

Here is the **Main Link** Btw UwU :
https://OhmHobby.github.io/stockwardApp/index.html

---

## 🏗️ The Architecture — or: How We Built a Hospital System on Vibes and Free Tiers

Let me tell you something. When people say "you need a proper backend," what they really mean is "I want something familiar." But familiar isn't always right.

StockWard runs a full medication audit cycle for an entire hospital using three things you already have a Google account for. Here's how it actually works.

---

### The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                        THE USER                                  │
│              (50 workers on their phones +                       │
│               pharmacists on their laptops)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │  opens a URL
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GITHUB PAGES                                   │
│              (Frontend — index / worker / boss)                  │
│                                                                  │
│   Pure HTML + CSS + Vanilla JS. No React. No build step.        │
│   Deploys on git push. Costs exactly $0.00/month.               │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
     READS (gviz)                   WRITES (fetch POST)
           │                              │
           ▼                              ▼
┌──────────────────────┐    ┌─────────────────────────────────────┐
│   GOOGLE SHEETS      │    │        GOOGLE APPS SCRIPT           │
│   (The Database)     │    │        (The Backend)                 │
│                      │    │                                      │
│  • USERS             │    │  Deployed as a Web App.             │
│  • WARD_ID           │    │  Handles auth, writes, assignments. │
│  • MED_ID            │◄───│  Validates keys, hashes passwords.  │
│  • MED+WARD_PAR      │    │  Returns JSON. That's it.           │
│  • MED+WARD          │    │                                      │
│  • LOGS              │    └─────────────────────────────────────┘
│                      │
│  Shared as "Anyone   │
│  can view" so the    │
│  frontend can read   │
│  directly — no API   │
│  call needed.        │
└──────────────────────┘
```

Three layers. No Docker. No EC2. No monthly bill that makes you cry.

---

### Layer 1 — The Frontend (GitHub Pages)

This is your classic static site. Three HTML files, two JS files, zero frameworks.

```
index.html   →  Role picker. Are you a worker or the boss?
worker.html  →  The counting form. This is what 50 people open every audit cycle.
boss.html    →  The pharmacist's cockpit. Charts, reports, team management.

js/config.js →  GAS URL + Spreadsheet ID. The only thing you change per deployment.
js/lang.js   →  Full Thai/English i18n. Because the workers speak Thai and the
                 pharmacist sometimes doesn't.
```

GitHub Pages serves all of this for free, globally, with SSL. The whole "frontend infrastructure" story ends there.

**Why no framework?** Because 50 hospital workers opening a URL on their phone don't need a 200kb React bundle. They need a form that loads fast on hospital WiFi. Vanilla JS loads in milliseconds. Done.

---

### Layer 2 — Google Apps Script (The Backend That Isn't a Backend)

GAS is deployed as a Web App with a single public URL. Every write operation in the system is a `POST` to that URL with a JSON body.

```
Worker submits audit  →  POST { action: "submitAudit", items: [...], session: {...} }
Boss creates user     →  POST { action: "createUser", name: "...", role: "..." }
Worker logs in        →  POST { action: "auth", name: "...", passwordHash: "..." }
```

GAS receives the request, validates the key, does its thing, appends rows to Google Sheets, and returns `{ success: true }`. No database driver. No ORM. No migrations. The spreadsheet IS the database.

**Auth works like this:**

```
Password never travels in plaintext.
Hash = SHA-256( name.toLowerCase() + ":" + password )
The name is the salt. Same password, different names = different hashes.
First login? Hash gets saved to the USERS sheet. That's your registration.
Second login? Hash compared. Match = welcome back.
```

It's not OAuth. It's not JWT. It's name-salted SHA-256 stored in a spreadsheet cell. For a hospital pharmacy audit tool with a budget measured in milkshakes, it's exactly enough.

**Retry logic with exponential backoff** is baked into every GAS call because Apps Script cold starts are a thing and nobody likes a spinner that just sits there forever:

```javascript
// Simplified — actual code lives in config.js
async function callGAS(action, data, attempt = 0) {
  try {
    const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action, ...data }) });
    const json = await res.json();
    if (json.retryable && attempt < 6) {
      await sleep(800 * 2 ** attempt + randomJitter);
      return callGAS(action, data, attempt + 1);  // try again, slower
    }
    return json;
  } catch (e) {
    if (attempt < 6) return callGAS(action, data, attempt + 1);
    throw e;
  }
}
```

Max 6 retries. Jitter to avoid thundering herd. Works great in practice.

---

### Layer 3 — Google Sheets (The Database You Already Know How to Use)

This is the part people raise an eyebrow at. "Google Sheets as a database?" Yes. And here's why it's actually genius for this use case.

The data model is six sheets:

| Sheet | What it stores |
|---|---|
| `USERS` | USER_ID, NAME, ROLE, WARD_ID, PASSWORD_HASH, ACTIVE |
| `WARD_ID` | Ward codes, Thai names, groups |
| `MED_ID` | Drug catalog — ID, name, category, unit price |
| `MED+WARD_PAR` | **Pivot matrix** — drugs × wards = PAR quantities (targets) |
| `MED+WARD` | **Pivot matrix** — drugs × wards = actual counted quantities |
| `LOGS` | Every event. ASSIGNED, STARTED, SUBMITTED_ITEM, SUBMITTED_SESSION. Everything. |

The two pivot sheets are the interesting ones. Forget long-format tables. The structure is literally:

```
         | ICU1 | ICU2 | SUR1 | SUR2 | OBG1 | ...
---------|------|------|------|------|------|----
GNR1     |  1   |  1   |  2   |  1   |  1   | ...
GNR2     |  1   |  2   |  1   |  0   |  1   | ...
EYE1     |  1   |  1   |  1   |  1   |  2   | ...
HAD1     |  2   |  2   |  2   |  2   |  1   | ...
```

First column = drug IDs. First row = ward IDs. Every cell = quantity. The pharmacist can read it, edit it, and understand it without opening a terminal or filing a ticket.

**The clever bit — reading without an API:**

For reads, we completely bypass GAS. The frontend calls Google's built-in `gviz` (Google Visualization Query Language) endpoint directly:

```javascript
// Zero GAS execution quota used. Zero cost. Just... reading a spreadsheet.
async function gviz(sheetName, query = '') {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?sheet=${sheetName}`;
  const res = await fetch(url);
  return parseGviz(await res.text());
}
```

The spreadsheet is set to "Anyone can view." The frontend fetches it like a JSON API. No server involved. No quota burned. Both pivot sheets load in parallel, get joined in memory in the browser, and the dashboard renders. The whole read cycle is direct browser → Google CDN.

**Writes are the only thing that touches GAS**, and that's appropriate — writes need validation, auth checks, and audit logging.

---

### How a Worker Audit Actually Flows

Here's the full journey from "pharmacist creates assignment" to "data is in the sheet":

```
1. BOSS assigns a ward to a worker
   └─► POST /gas → writes ASSIGNED row to LOGS

2. WORKER opens their URL, logs in
   └─► POST /gas (auth) → validates hash → returns userId, wardId

3. WORKER starts counting
   └─► POST /gas (startAudit) → writes STARTED row to LOGS
   └─► Frontend fetches MED+WARD_PAR via gviz → shows drug list with PAR targets

4. WORKER counts drugs, fills quantities, sets KPI pass/fail

5. WORKER hits Submit
   └─► POST /gas (submitAudit) → writes:
       • One SUBMITTED_SESSION row (KPI results, notes)
       • One SUBMITTED_ITEM row per drug (drugId, parQty, actualQty, variance)

6. BOSS opens dashboard
   └─► gviz fetches MED+WARD_PAR (targets) + MED+WARD (actuals) in parallel
   └─► gviz fetches LOGS (for assignment status timeline)
   └─► Browser joins everything in memory → renders charts + expandable drug table
```

No polling. No websockets. No real-time anything. The pharmacist refreshes when they want to see new data. Hospital audit workflows don't need sub-second updates — they need reliability and something that works on the hospital's WiFi.

---

### The Cost Breakdown

| Thing | Cost |
|---|---|
| Frontend hosting (GitHub Pages) | **$0** |
| Backend compute (Google Apps Script) | **$0** |
| Database (Google Sheets) | **$0** |
| Auth system | **$0** |
| SSL certificate | **$0** |
| CDN | **$0** |
| **Total** | **$0** |

The only real constraint is GAS execution quota (6 min/day free, 30 min/day Workspace). For 50 workers submitting once a month, we burn maybe 2 minutes per audit cycle. We're nowhere near the limit.

---

## What's in the box

```
/
├── index.html      → The front door. Pick your role and go.
├── worker.html     → Where the counting happens (50 people use this daily)
├── boss.html       → Dashboard, reports, charts, team management
└── js/
    ├── config.js   ← The ONLY file you touch before deploying
    └── lang.js     ← Thai/English, because accessibility matters
```

---

## Getting it running

### 1. Google Sheets — the backbone

1. Open your spreadsheet
2. Run `setupSheets()` once in the GAS editor — it scaffolds all sheets with headers
3. Set sharing to **Anyone with the link → Viewer** *(required for gviz reads)*

### 2. Google Apps Script — the engine

1. Paste `gas_backend_v2.js` into your Apps Script project
2. Drop your real keys into `CONFIG` at the top
3. Deploy as Web App: **Execute as Me, Anyone can access**
4. Copy the deployment URL

### 3. Config — one file, two minutes

```javascript
const CONFIG = {
  GAS_URL:        "https://script.google.com/macros/s/YOUR_ID/exec",
  SPREADSHEET_ID: "YOUR_SHEET_ID",
  CLIENT_KEY:     "SW-2026-...",
  BOSS_KEY:       "BOSS-...",
};
```

### 4. Feed the sheets

- **WARD_ID** — ward codes, Thai names, groups, ACTIVE = TRUE
- **MED_ID** — drug catalog (ID, name, category, unit price)
- **MED+WARD_PAR** — PAR pivot matrix (target quantities per drug per ward)
- **MED+WARD** — actual pivot matrix (formula-driven from LOGS submissions)

### 5. Ship it

1. Push to a GitHub repo
2. **Settings → Pages → Source: main branch / root**
3. Done. Live. Free.

---

## URLs worth knowing

**Main link:**

```
https://OhmHobby.github.io/stockwardApp/index.html
```

**Worker link:**
```
https://OhmHobby.github.io/stockwardApp/worker.html
```
Generate from **Boss Dashboard → Manage → Create User**.

**Boss link:**
```
https://OhmHobby.github.io/stockwardApp/boss.html
```

---

## The MED+WARD actual qty formula

```
=IFERROR(SUMPRODUCT(
  (LOGS!$B$2:$B$5000="SUBMITTED_ITEM")*
  (LOGS!$I$2:$I$5000=A2)*
  (LOGS!$E$2:$E$5000=E2)*
  LOGS!$L$2:$L$5000
), 0)
```

`A2` = DRUG_ID, `E2` = WARD_ID. Drag down. Column H = `=G2-F2` for variance.

---

## Honest notes

- Keys in `config.js` are visible in source. Conscious trade-off. Security model = key + URL obscurity. Fine for this use case.
- Public-view spreadsheet means LOGS are readable. That's transparency, not a vulnerability.
- Audit periods: `YYYY-MM` format — e.g. `2026-09` for September 2026.

---

*Built lean. Deployed free. Runs a whole hospital pharmacy's audit cycle.*

*Sometimes the right architecture is the one that fits on a free tier.* 🏥