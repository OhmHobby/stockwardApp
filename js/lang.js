// ================================================================
//  StockWard — Language system
//  Usage: t("key"), getCatLabel("general"), toggleLang()
//  Each page defines its own applyLang() — called by toggleLang()
// ================================================================

const LANG = {
  th: {
    // Common
    app_name:   "StockWard",
    tagline:    "ระบบตรวจสอบยาคงคลัง",
    loading:    "กำลังโหลด...",
    saving:     "กำลังบันทึก...",
    error:      "เกิดข้อผิดพลาด",
    confirm:    "ยืนยัน",
    cancel:     "ยกเลิก",
    reload:     "↻ โหลดใหม่",
    export_csv: "↓ Export CSV",
    all_cats:    "ทุกหมวด",
    drug_search_ph: "ค้นหาชื่อยา / Drug ID…",

    // Login
    login_title:      "เข้าสู่ระบบ",
    name_label:       "ชื่อ-นามสกุล",
    name_ph:          "กรอกชื่อตามที่ลงทะเบียนไว้",
    pass_label:       "รหัสผ่าน",
    pass_ph:          "กรอกรหัสผ่าน",
    login_btn:        "เข้าสู่ระบบ",
    first_login_note: "ครั้งแรก? รหัสที่กรอกจะถูกบันทึกเป็นรหัสประจำตัว",
    new_pass_toast:   "ลงทะเบียนรหัสผ่านเรียบร้อย",

    // Auth errors
    err_name_empty:   "กรุณากรอกชื่อ",
    err_pass_empty:   "กรุณากรอกรหัสผ่าน",
    err_wrong_pass:   "รหัสผ่านไม่ถูกต้อง",
    err_not_found:    "ไม่พบชื่อในระบบ — กรุณาติดต่อเภสัชกร",
    err_inactive:     "บัญชีนี้ถูกระงับ — กรุณาติดต่อเภสัชกร",
    err_not_boss:     "บัญชีนี้ไม่มีสิทธิ์เข้า Boss Dashboard",
    err_network:      "เชื่อมต่อไม่ได้ — กรุณาตรวจสอบอินเทอร์เน็ต",
    err_no_assign:    "ไม่พบการมอบหมายงานรอบนี้ — กรุณาติดต่อเภสัชกร",
    err_no_drugs:     "ไม่พบรายการยา — กรุณาติดต่อเภสัชกรเพื่อตั้งค่าระบบ",

    // Index
    idx_worker_title: "พนักงาน / Worker",
    idx_worker_desc:  "เข้าสู่หน้านับยาประจำหน่วยงาน",
    idx_boss_title:   "ผู้ดูแลระบบ / Boss",
    idx_boss_desc:    "แดชบอร์ดสำหรับเภสัชกรและผู้บริหาร",
    idx_go:           "เข้าสู่ระบบ →",

    // Worker — stat bar
    w_counted:  "นับแล้ว",
    w_total:    "ทั้งหมด",
    w_match:    "ตรง PAR",
    w_diff:     "ไม่ตรง",

    // Worker — drug row
    par:        "PAR",
    s_match:    "ตรง",

    // Worker — progress
    remaining:    (n) => `เหลืออีก ${n} รายการ`,
    all_counted:  "นับครบทุกรายการ ✓",
    kpi_reminder: "กรุณาตั้งค่า KPI ทั้ง 4 ข้อก่อนส่ง",
    ready:        "พร้อมส่ง",

    // Worker — sections
    kpi_title:   "การตรวจสอบคุณภาพ (KPI)",
    notes_title: "บันทึกเพิ่มเติม",
    kpi_pass:    "ผ่าน",
    kpi_fail:    "ไม่ผ่าน",
    kpi_note_ph: "ระบุรายละเอียด...",
    narc_label:  "ยาเสพติด / ยาควบคุม",
    cold_label:  "Cold Chain / ตู้แช่เย็น",
    other_label: "อื่น ๆ",
    narc_ph:     "ระบุหากพบปัญหา...",
    cold_ph:     "อุณหภูมิ, ปัญหาที่พบ...",
    other_ph:    "ข้อสังเกตอื่น ๆ...",

    // Worker — submit
    submit_btn:         "ส่งผลการตรวจ",
    submitting_btn:     "กำลังส่ง...",
    confirm_uncounted:  (n) => `ยังมียาที่ไม่ได้นับ ${n} รายการ\nยืนยันการส่งหรือไม่?`,
    confirm_submit:     (n) => `ยืนยันการส่งผลการตรวจ ${n} รายการ?`,
    success_title:      "ส่งสำเร็จ",

    // KPI labels
    kpis: [
      "ปริมาณยาตรงตามรายการที่อนุมัติ",
      "ไม่พบยาที่จะหมดอายุภายใน 8 เดือน",
      "ไม่พบยาหมดอายุในหน่วยงาน",
      "ไม่มีรายงาน ADR จากยาสำรองประจำหน่วย",
    ],

    // Boss — tabs
    tab_overview: "ภาพรวม",
    tab_reports:  "รายงาน",
    tab_manage:   "จัดการ",

    // Boss — overview
    ov_title:      "ภาพรวมการตรวจสอบ",
    ov_no_data:    "ยังไม่มีข้อมูลสำหรับรอบนี้",
    status_pending: "รอดำเนินการ",
    status_prog:    "กำลังนับ",
    status_done:    "ส่งแล้ว",
    ts_assigned:   "มอบหมาย",
    ts_started:    "เริ่มนับ",
    ts_submitted:  "ส่งแล้ว",

    // Boss — reports
    rpt_title:     "รายงานยาคงคลัง",
    by_qty:        "ปริมาณ",
    by_value:      "มูลค่า (฿)",
    all_wards:     "ทุกหน่วยงาน",
    chart_bar:     "PAR vs นับได้ แยกหมวด",
    chart_pie:     "สัดส่วนหมวดยา",
    drug_list:     "รายการยาทั้งหมด",
    col_id:        "Drug ID",
    col_name:      "ชื่อยา",
    col_cat:       "หมวด",
    col_ward:      "หน่วยงาน",
    col_par:       "PAR",
    col_counted:   "นับได้",
    col_var:       "ส่วนต่าง",
    col_par_val:   "มูลค่า PAR",
    col_act_val:   "มูลค่านับ",

    // Boss — manage
    mgmt_title:    "จัดการระบบ",
    asn_title:     "มอบหมายงาน",
    asn_period:    "รอบตรวจสอบ (YYYY-MM)",
    asn_ward:      "หน่วยงาน",
    asn_worker:    "ผู้ตรวจสอบ",
    sel_ward:      "— เลือกหน่วยงาน —",
    sel_worker:    "— เลือกพนักงาน —",
    asn_btn:       "มอบหมายงาน",
    cu_title:      "สร้างผู้ใช้ใหม่",
    cu_name:       "ชื่อ-นามสกุล",
    cu_role:       "บทบาท",
    cu_btn:        "สร้างผู้ใช้",
    ul_title:      "รายชื่อผู้ใช้",
    ul_regen:      "🔑 รหัสใหม่",
    ul_reset_pass: "🔓 รีเซ็ตรหัสผ่าน",
    ul_deact:      "✕ ระงับ",
    confirm_regen: "สร้างรหัสเข้าถึงใหม่? URL เดิมจะใช้ไม่ได้",
    confirm_reset: "รีเซ็ตรหัสผ่านผู้ใช้นี้? ผู้ใช้ต้องตั้งรหัสผ่านใหม่ในการเข้าครั้งถัดไป",
    confirm_deact: "ระงับบัญชีผู้ใช้นี้?",

    // Categories
    cats: {
      'รายการยาทั่วไป':      "ยาทั่วไป",
      'ยาตา':                "ยาตา",
      'กลุ่มยาแช่เย็น':     "ยาแช่เย็น",
      'ยาแช่เย็นในวิสัญญี': "ยาแช่เย็น (วิสัญญี)",
      'ยาแช่เย็นตึก50ปี':   "ยาแช่เย็น (ตึก 50 ปี)",
      'ยาเสพติด':            "ยาเสพติด / ควบคุม",
      'High Alert Drugs':    "High Alert Drugs",
      'high alert drugs':    "High Alert Drugs",
      general:       "ยาทั่วไป",
      eye:           "ยาตา",
      refrigerated:  "ยาแช่เย็น",
      narcotic:      "ยาเสพติด / ควบคุม",
      high_alert:    "High Alert Drugs",
      cpr_box:       "CPR Box",
    },
  },

  en: {
    app_name:   "StockWard",
    tagline:    "Stock Audit Management System",
    loading:    "Loading...",
    saving:     "Saving...",
    error:      "Error",
    confirm:    "Confirm",
    cancel:     "Cancel",
    reload:     "↻ Refresh",
    export_csv: "↓ Export CSV",
    all_cats:    "All Categories",
    drug_search_ph: "Search drug name / ID…",

    login_title:      "Sign In",
    name_label:       "Full Name",
    name_ph:          "Enter your registered name",
    pass_label:       "Password",
    pass_ph:          "Enter your password",
    login_btn:        "Sign In",
    first_login_note: "First time? The password you enter will be saved as your permanent password.",
    new_pass_toast:   "Password registered successfully",

    err_name_empty:  "Please enter your name",
    err_pass_empty:  "Please enter your password",
    err_wrong_pass:  "Incorrect password",
    err_not_found:   "Name not found — please contact the pharmacist",
    err_inactive:    "Account is inactive — please contact the pharmacist",
    err_not_boss:    "This account does not have Boss Dashboard access",
    err_network:     "Connection failed — please check your internet",
    err_no_assign:   "No assignment found for this period — please contact the pharmacist",
    err_no_drugs:    "No drug list found — please contact the pharmacist",

    idx_worker_title: "Worker",
    idx_worker_desc:  "Drug counting form for your ward",
    idx_boss_title:   "Boss / Pharmacist",
    idx_boss_desc:    "Dashboard for pharmacists and supervisors",
    idx_go:           "Enter →",

    w_counted: "Counted",
    w_total:   "Total",
    w_match:   "Match PAR",
    w_diff:    "Mismatch",

    par:     "PAR",
    s_match: "Match",

    remaining:    (n) => `${n} items remaining`,
    all_counted:  "All items counted ✓",
    kpi_reminder: "Please set all 4 KPI items before submitting",
    ready:        "Ready to submit",

    kpi_title:   "Quality Indicators (KPI)",
    notes_title: "Additional Notes",
    kpi_pass:    "Pass",
    kpi_fail:    "Fail",
    kpi_note_ph: "Add details...",
    narc_label:  "Narcotics / Controlled Substances",
    cold_label:  "Cold Chain / Refrigerator",
    other_label: "Other",
    narc_ph:     "Note any issues found...",
    cold_ph:     "Temperature, issues found...",
    other_ph:    "Other observations...",

    submit_btn:        "Submit Audit",
    submitting_btn:    "Submitting...",
    confirm_uncounted: (n) => `${n} items not counted.\nConfirm submission anyway?`,
    confirm_submit:    (n) => `Confirm submission of ${n} items?`,
    success_title:     "Submitted Successfully",

    kpis: [
      "Drug quantity matches the approved list",
      "No drugs expiring within 8 months",
      "No expired drugs found in the ward",
      "No ADR reports from reserved drugs",
    ],

    tab_overview: "Overview",
    tab_reports:  "Reports",
    tab_manage:   "Manage",

    ov_title:       "Audit Overview",
    ov_no_data:     "No data for this period yet",
    status_pending: "Pending",
    status_prog:    "In Progress",
    status_done:    "Submitted",
    ts_assigned:    "Assigned",
    ts_started:     "Started",
    ts_submitted:   "Submitted",

    rpt_title:   "Inventory Report",
    by_qty:      "Quantity",
    by_value:    "Value (฿)",
    all_wards:   "All Wards",
    chart_bar:   "PAR vs Counted by Category",
    chart_pie:   "Category Breakdown",
    drug_list:   "Drug List",
    col_id:      "Drug ID",
    col_name:    "Drug Name",
    col_cat:     "Category",
    col_ward:    "Ward",
    col_par:     "PAR",
    col_counted: "Counted",
    col_var:     "Variance",
    col_par_val: "PAR Value",
    col_act_val: "Actual Value",

    mgmt_title:    "System Management",
    asn_title:     "Create Assignment",
    asn_period:    "Audit Period (YYYY-MM)",
    asn_ward:      "Ward",
    asn_worker:    "Worker",
    sel_ward:      "— Select ward —",
    sel_worker:    "— Select worker —",
    asn_btn:       "Assign",
    cu_title:      "Create New User",
    cu_name:       "Full Name",
    cu_role:       "Role",
    cu_btn:        "Create User",
    ul_title:      "User List",
    ul_regen:      "🔑 New Key",
    ul_reset_pass: "🔓 Reset Password",
    ul_deact:      "✕ Deactivate",
    confirm_regen: "Generate a new access key? The old URL will stop working.",
    confirm_reset: "Reset this user's password? They will need to set a new one on next login.",
    confirm_deact: "Deactivate this account?",

    cats: {
      'รายการยาทั่วไป':      "General Drugs",
      'ยาตา':                "Eye Drops",
      'กลุ่มยาแช่เย็น':     "Refrigerated",
      'ยาแช่เย็นในวิสัญญี': "Refrigerated (Anesthesia)",
      'ยาแช่เย็นตึก50ปี':   "Refrigerated (Bldg 50)",
      'ยาเสพติด':            "Controlled Substances",
      'High Alert Drugs':    "High Alert Drugs",
      'high alert drugs':    "High Alert Drugs",
      general:       "General Drugs",
      eye:           "Eye Drops",
      refrigerated:  "Refrigerated",
      narcotic:      "Controlled Substances",
      high_alert:    "High Alert Drugs",
      cpr_box:       "CPR Box",
    },
  },
};

// ── Core functions ────────────────────────────────────────────────

let currentLang = localStorage.getItem("sw_lang") || "th";

/** Get a translated string. Falls back to Thai, then the key itself. */
function t(key) {
  const v = LANG[currentLang]?.[key];
  if (v !== undefined) return v;
  return LANG.th[key] ?? key;
}

/** Category display label in current language. */
function getCatLabel(cat) {
  return t("cats")?.[cat] || cat;
}

/** Toggle language and re-render. */
function toggleLang() {
  currentLang = currentLang === "th" ? "en" : "th";
  localStorage.setItem("sw_lang", currentLang);
  document.documentElement.lang = currentLang === "th" ? "th" : "en";
  // Update toggle button label on all pages
  document.querySelectorAll(".lang-btn").forEach(el => {
    el.textContent = currentLang === "th" ? "EN" : "ไทย";
  });
  if (typeof applyLang === "function") applyLang();
}

/** Apply translations to all [data-i18n] elements on the page. */
function applyI18nAttrs() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const v = t(el.dataset.i18n);
    if (typeof v === "string") el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const v = t(el.dataset.i18nPh);
    if (typeof v === "string") el.placeholder = v;
  });
}

// Set initial lang button label once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.lang = currentLang === "th" ? "th" : "en";
  document.querySelectorAll(".lang-btn").forEach(el => {
    el.textContent = currentLang === "th" ? "EN" : "ไทย";
  });
});