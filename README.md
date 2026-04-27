# StockWard — ระบบตรวจสอบยา

A medication audit system for a hospital. Built around what was already there — Google Sheets, Apps Script, GitHub Pages — because the right tool is the one that fits the problem, not the one on the enterprise price list.

Zero cost. Low maintenance. The pharmacist asked if it could link to their existing Sheets. It could. That was the architecture.

**Main Link:**
 https://OhmHobby.github.io/stockwardApp/index.html

---

## How It Works

Think of it like a kitchen with one rule: no new appliances. You figure out what the existing tools can actually do... and it turns out a good knife, a pan, and knowing your stove covers 95% of everything. The "free tier" isn't the compromise here. It's the design.

```
┌─────────────────────────────────────────────────────────────────┐
│                        THE USER                                  │
│                  (workers + boss, on any device)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │  opens a URL
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GITHUB PAGES                                   │
│         (index / worker / boss ... pure HTML + JS)               │
│                                                                  │
│   No framework. No build step. git push = deployed.             │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
     READS (gviz)                   WRITES (fetch POST)
     free, direct,                  validated, logged,
     no quota burned                goes through GAS
           │                              │
           ▼                              ▼
┌──────────────────────┐    ┌─────────────────────────────────────┐
│   GOOGLE SHEETS      │    │        GOOGLE APPS SCRIPT           │
│   (the database)     │◄───│        (the backend)                 │
│                      │    │                                      │
│  USERS · WARD_ID     │    │  One URL. POST in, JSON out.        │
│  MED_ID · LOGS       │    │  Auth, validate, write. That's it.  │
│  MED+WARD_PAR        │    └─────────────────────────────────────┘
│  MED+WARD            │
└──────────────────────┘
  Set to "Anyone can view"
  so the frontend reads it
  like a free JSON API ...
  no server, no quota.
```

Reads and writes have completely different needs. Reads need to be fast and free. Writes need to be safe and logged. So they take different paths — reads go straight from the browser to Google Sheets via `gviz` (a read endpoint that's been quietly sitting there the whole time). Writes go through Apps Script. Once you split them like that, the whole thing just... clicks.

---

## The Files

```
index.html   ...  pick your role and go
worker.html  ...  the audit form
boss.html    ...  overview, reports, team

js/config.js ...  the only file you change per deployment (literally two values)
js/lang.js   ...  Thai/English, because not everyone in the hospital speaks the same language
```

No framework, because the users open this on whatever device they have on whatever WiFi is left after the medical equipment takes its share. Fast load is a feature. Vanilla JS delivers it.

---

## Secret Sauce

**Reads bypass the backend entirely.** `gviz` is Google's own query endpoint for public Sheets. The browser calls it directly — no GAS execution, no quota burn, no latency from a middleman. The boss can refresh the dashboard all day. Costs nothing.

**Writes are the only thing GAS touches** ... and that's appropriate, because writes are the only thing that needs to be validated, authenticated, and logged.

**The spreadsheet IS the database.** Not a cache of it, not a mirror. The actual database. When a worker submits a count, Apps Script appends rows to LOGS. A SUMIF formula in MED+WARD reads those rows and recalculates automatically. No sync job. No cache to invalidate. Sheets just does it.

**LOGS is an event log.** Every action is a row: `ASSIGNED`, `STARTED`, `SUBMITTED_SESSION`, `SUBMITTED_ITEM`. The frontend reconstructs current state by grouping rows on `ASSIGNMENT_ID`, reading bottom-to-top (newest last, so reverse first), and taking the last event as the current status. It's event sourcing on a spreadsheet and it works embarrassingly well.

---

## Auth

Name-salted SHA-256:

```
hash = SHA-256( name.toLowerCase() + ":" + password )
```

Same password, different name = different hash. First login saves it. Every login after compares it. Not OAuth. Not JWT. But security is about matching the lock to the door... not putting a vault door on a broom closet.

---

## Retry Logic

GAS cold starts are real — if nobody's touched the deployment in a while, the first request catches it mid-warmup. Every call retries up to 6 times with exponential backoff and jitter:

```javascript
async function callGAS(action, data, attempt = 0) {
  try {
    const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action, ...data }) });
    const json = await res.json();
    if (json.retryable && attempt < 6) {
      await sleep(800 * 2 ** attempt + randomJitter); // patience
      return callGAS(action, data, attempt + 1);
    }
    return json;
  } catch (e) {
    if (attempt < 6) return callGAS(action, data, attempt + 1);
    throw e;
  }
}
```

---

## Data Model

| Sheet | What lives there |
|---|---|
| `USERS` | USER_ID, NAME, ROLE, WARD_ID, PASSWORD_HASH, ACTIVE |
| `WARD_ID` | ward codes and names |
| `MED_ID` | drug catalog... ID, name, category, unit price |
| `MED+WARD_PAR` | pivot: drugs × wards = target quantities |
| `MED+WARD` | pivot: drugs × wards = actual counted quantities |
| `LOGS` | everything that ever happened, in order |

The pivot structure:

```
         | ICU1 | ICU2 | SUR1 | PED4 | OBG1 | ...
---------|------|------|------|------|------|----
GNR1     |  1   |  1   |  2   |  1   |  1   | ...
GNR2     |  1   |  2   |  1   |  0   |  1   | ...
EYE1     |  1   |  1   |  1   |  1   |  2   | ...
```

Normalized long-format would be "more correct." But the people editing PAR values aren't engineers... they just need a grid they can look at, understand, and fix. Asking them to think in foreign keys is like asking someone to edit a photo by modifying the JPEG binary. Pivot wins.

---

## The Audit Flow

```
1. Boss assigns a ward to a worker
   └─► POST → ASSIGNED row in LOGS

2. Worker logs in
   └─► POST (auth) → validates hash, returns session
   └─► gviz reads LOGS → finds newest non-submitted ASSIGNED row

3. Worker starts
   └─► POST (startAudit) → STARTED row in LOGS
   └─► gviz fetches MED+WARD_PAR → drug list + targets rendered

4. Worker counts every drug. Marks KPIs pass/fail.

5. Worker submits
   └─► POST (submitAudit) →
       • 1× SUBMITTED_SESSION (KPIs, notes)
       • 1× SUBMITTED_ITEM per drug (par, actual, variance)

6. Boss refreshes
   └─► gviz fetches MED+WARD_PAR + MED+WARD in parallel
   └─► gviz fetches LOGS → reconstructs assignment cards + session history
   └─► charts, tables, status overview render in browser
```

---

## Cost

| | |
|---|---|
| GitHub Pages | $0 |
| Apps Script | $0 |
| Google Sheets | $0 |
| SSL, CDN | $0 |
| **Monthly total** | **$0** |

GAS free tier: 6 min execution/day. Actual usage per audit cycle: ~2 min. The other 4 minutes just sit there, unbothered.

---

## For Workers ... How To Use

You open a URL. That's most of it honestly. But here's the full picture:

**Logging In**
- Enter your name and password exactly as registered
- First time? Whatever password you type becomes your password. No reset email, no confirmation... it just saves. Don't forget it.
- If you see "wrong password" and you're sure it's right, ask the boss to reset it.

**Starting Your Audit**
- After login, the system finds your assignment automatically and loads your drug list
- If you see "no assignment found," someone hasn't assigned you yet... check with the boss
- Tap **Start** (or it may auto-start) — this logs that you began, which the boss can see

**Counting**
- Each drug shows its PAR quantity (the target) next to the input
- Type in what you actually counted. Don't leave anything blank — the submit button won't unlock until every row has a number
- If a drug is genuinely missing, enter `0`
- Need to add a drug that's not on the list? Use the **+ Add** button at the bottom

**KPIs**
- Four yes/no questions at the bottom of the form
- If you mark one as fail, a notes box appears — describe what you found
- All four must be answered before you can submit

**Submitting**
- Hit submit, confirm, done
- You'll see a success screen with a session ID — that's your receipt
- You can submit more than once if needed... each submission creates a separate session and the boss can see all of them

---

## For the Boss ... How To Use

Three tabs: **Overview**, **Reports**, **Manage**.

### Overview
Shows all assignments created today — one card per assignment, color coded by status:
- 🟡 Yellow ... assigned but nobody's started yet
- 🟢 Green ... worker is currently in progress
- ⚫ Gray ... submitted and done

Each card shows the assigned worker, timestamps, and all submitted sessions. Click a session ID to see exactly what was submitted — every drug, PAR vs actual, variance, KPI results.

### Reports
Drug-level data across wards. Filter by ward, category, or search by drug name. Toggle between quantity and value view. The pie chart has a PAR / นับได้ toggle so you can compare target vs actual at a glance.

### Manage

**Assigning work:**
- Pick a period (defaults to current month)
- Pick a ward
- Pick a worker
- Hit assign... that's it. The worker will see it next time they log in.
- To unassign, select **✕ Unassign** from the ward dropdown

**Creating users:**
- Name, role (worker or boss), home ward
- The user sets their own password on first login
- You'll see a summary box with their USER_ID after creation — copy it somewhere useful

**User list:**
- Shows all active users with their current status (today's activity only)
- 🔓 resets their password (they set a new one on next login)
- ✕ deactivates the account

### Fixing Things in the Sheets Backend

Sometimes things need manual correction. Here's where to go:

**Wrong count was submitted?**
Go to LOGS, find the SUBMITTED_ITEM rows by SESSION_ID, and correct the ACTUAL_QTY values directly. MED+WARD recalculates automatically.

**Worker submitted to wrong ward?**
Find their SUBMITTED_ITEM rows in LOGS by SESSION_ID. Change the WARD_ID column. MED+WARD picks it up on next recalculate (or hit Ctrl+Alt+F9 to force).

**Need to invalidate a session entirely?**
There's no soft delete... just find all rows with that SESSION_ID in LOGS and set ACTUAL_QTY to 0, or delete the rows directly. The formula in MED+WARD will stop including them.

**User can't log in and reset doesn't help?**
Go to USERS sheet, find the row, clear the PASSWORD_HASH cell (column E). Next login will set a fresh hash.

**Assignment showing wrong status in Overview?**
The status reads from the last LOGS row for that ASSIGNMENT_ID. If it looks wrong, check that the most recent row in LOGS for that assignment has the right EVENT_TYPE. You can manually append a correction row if needed.

**Period column looks garbled?**
Expected. gviz returns `Date(2026,3,1)` for dates written by Apps Script (month is 0-indexed, so 3 = April). The frontend normalises it. Don't filter on this column in Sheets formulas... use TIMESTAMP instead.

---

## Setup

### 1. Google Sheets
1. Run `setupSheets()` in the GAS editor once — scaffolds all sheets with headers
2. Sharing → **Anyone with link → Viewer** (gviz requires this)

### 2. Apps Script
1. Paste `gas_backend_v2.js` into your project
2. Fill in `CONFIG` at the top
3. Deploy → Web App → **Execute as Me, Anyone can access**
4. Copy the URL

### 3. config.js
```javascript
const CONFIG = {
  GAS_URL:        "https://script.google.com/macros/s/YOUR_ID/exec",
  SPREADSHEET_ID: "YOUR_SHEET_ID",
  CLIENT_KEY:     "SW-2026-...",
  BOSS_KEY:       "BOSS-...",
};
```

### 4. Seed the sheets
- **WARD_ID** ... ward codes, Thai names, ACTIVE = TRUE
- **MED_ID** ... drug catalog
- **MED+WARD_PAR** ... fill the PAR pivot (or import)
- **MED+WARD** ... paste the SUMIF formula, drag across grid

### 5. Ship it
Push to GitHub → Settings → Pages → main / root. Live.

---

## URLs

```
https://OhmHobby.github.io/stockwardApp/index.html   ... front door
https://OhmHobby.github.io/stockwardApp/worker.html  ... workers
https://OhmHobby.github.io/stockwardApp/boss.html    ... boss
```

---

## MED+WARD Formula

```
=IFERROR(
  VALUE(
    SUMIFS(
      LOGS!$L:$L, 
      LOGS!$E:$E, B$1, 
      LOGS!$I:$I, $A2)
    ), 
  0)
```

`A2` = drug ID, `E2` = ward ID. Drag down, drag across. Variance: `=G2-F2`.

---

## Things That Bit Me

Documenting these so you don't have to rediscover them.

**The PERIOD column is a liar.** Apps Script writes Date objects, gviz returns them as `Date(2026,3,1)` with 0-indexed months (3 = April). Manually written rows might come back as `2026-04` or `01/04/2026`. All three formats, same column, no warning. Don't WHERE on it. Use TIMESTAMP column instead... it's always `DD/MM/YYYY HH:MM:SS` and you can parse it reliably.

**`new Date("27/04/2026")` is not your friend.** JS reads the first number as month, breaks, gives you Invalid Date or silently parses something wrong. Write a manual regex parser. Four lines. Worth it. Spent an embarrassing amount of time staring at an empty overview page because of this.

**Group by `ASSIGNMENT_ID`, not `WARD_ID`.** The boss can reassign a ward mid-period. If you group logs by ward, two separate sessions merge into one card with a confused status. Each assignment is its own thing.

**Read LOGS bottom-to-top.** Sheets appends, so newest = last row. Scan top-down and take the first match... you get the oldest assignment, probably one from three months ago. `.reverse()` before `.find()`. Now you know for free.

---

## Trade-offs

- Keys in `config.js` are visible in source. Intentional. The security model is key + URL obscurity, which fits this tool's threat model. Don't use this for a bank.
- Spreadsheet is public-view so LOGS are readable. For an audit system, that transparency is actually fine.
- No real-time updates. Refresh when you want fresh data. Monthly audits don't need sub-second sync... and keeping it simple keeps it reliable.
- If 50 workers submit at the exact same second, some retries happen. In practice they don't, because people finish at different times. If it becomes a problem: stagger the window.

---

Built for what the problem actually was. Works because the pieces fit.

That's the whole thing. 🏥