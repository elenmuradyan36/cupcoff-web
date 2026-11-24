/* CupCoff — owner dashboard + customer app (vanilla JS, hash routing).
 * Mounted by components/CupCoffApp.tsx: startCupCoff(root) renders every screen into `root`.
 */
import { QR } from "./qr";
import { ILL, ILL_DEFS, ILL_STYLE, ILL_WASH, illusSvg } from "./illustrations";
import { Charts } from "./charts";
import { api } from "./api";
import { CONFIG } from "./config";
import { registerServiceWorker } from "./pwa";

export function startCupCoff(root) {

  /* ================================================================ helpers */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => Number(n || 0).toLocaleString("en-US");
  const fmtDate = (iso, o) => new Date(iso).toLocaleDateString("en-GB", o || { day: "numeric", month: "short", year: "numeric" });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const fmtDateTime = (iso) => `${fmtDate(iso, { day: "numeric", month: "short" })}, ${fmtTime(iso)}`;
  const money = (n, cur = "AMD") => cur === "AMD" ? `${fmt(n)} ֏` : new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
  const pct = (x) => `${Math.round(x * 100)}%`;
  const DAY = 86400000;
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const isoDay = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  function rel(iso) {
    const s = (Date.now() - new Date(iso)) / 1000;
    if (s < 60) return "Just now";
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    const days = Math.round((today0() - new Date(new Date(iso).setHours(0, 0, 0, 0))) / DAY);
    if (days === 0) return `Today, ${fmtTime(iso)}`;
    if (days === 1) return `Yesterday, ${fmtTime(iso)}`;
    if (days < 30) return `${days} days ago`;
    return fmtDate(iso);
  }
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;

  /* ================================================================ icons */
  const P = {
    overview: '<rect x="3" y="3" width="7" height="8" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="15" width="7" height="6" rx="2"/>',
    analytics: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.4 3.5 5.2"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6.5 15h4"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.3-2.5 3.8M12 17.2v.1"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    store: '<path d="M4 10v10h16V10M3 10l1.5-6h15L21 10M3 10c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M10 20v-5h4v5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"/>',
    cup: '<path d="M4 8h12v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6z"/><path d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16M8 2.5c-.6 1 .6 1.6 0 3M12 2.5c-.6 1 .6 1.6 0 3"/>',
    stamp: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.3 4.6-5"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3.5-5.5-3.7-5.5-1.3C6.5 8 9 8 12 8zm0 0c1.5-3.5 5.5-3.7 5.5-1.3C17.5 8 15 8 12 8z"/>',
    userPlus: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5 1.8 0 3.4.6 4.6 1.8M18 14v6M15 17h6"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',
    alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.3v.1"/>',
    up: '<path d="M7 14l5-5 5 5"/>',
    down: '<path d="M7 10l5 5 5-5"/>',
    sort: '<path d="M8 15l4 4 4-4M8 9l4-4 4 4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    phone: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18.5h2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/>',
    team: '<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  };
  const icon = (n, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ""}</svg>`;
  // Hand-lettered CupCoff wordmark (original, monoline script). Stroke colour comes from CSS or the caller.
  const WORD_D = "M50 30C44 17 24 17 16 34C8 52 14 78 32 80C42 81 50 74 54 66C57 60 59 55 62 52C60 62 57 74 64 79C71 83 77 72 80 52C78 63 77 76 84 79C89 81 92 74 95 66C97 61 99 56 101 52L95 106M99 62C103 52 117 50 119 61C121 73 108 82 99 76C108 81 116 78 122 72M176 30C170 17 150 17 142 34C134 52 140 78 158 80C168 81 176 74 180 66C182 61 184 57 188 55C198 50 207 58 203 70C199 82 184 80 186 67C188 58 200 57 210 61C216 50 223 32 225 22C228 9 215 8 215 21C211 42 213 80 209 104C207 113 200 110 204 100C208 90 220 80 232 66C238 52 245 32 247 22C250 9 237 8 237 21C233 42 235 80 231 104C229 113 222 110 226 100C230 90 244 79 262 70M204 56L256 52";
  const wordmark = (cls, stroke = "", outline = "") => `<svg class="${cls}" viewBox="0 0 280 118" aria-hidden="true"><g transform="translate(10 0) skewX(-6)" fill="none" stroke-linecap="round" stroke-linejoin="round">${outline ? `<path d="${WORD_D}" stroke="${outline}" stroke-width="17"/>` : ""}<path d="${WORD_D}" stroke-width="7.5"${stroke ? ` stroke="${stroke}"` : ""}/></g></svg>`;
  const illus = (name, cls = "") => illusSvg(name, cls);
  const ILL_DEFS_HOST = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${ILL_DEFS}</defs></svg>`;
  const STAMP_GLYPH = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P.cup}</svg>`;
  const GIFT_GLYPH = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P.gift}</svg>`;

  /* ================================================================ state */
  const BRANCH_COLORS = ["#C0394F", "#2B7BBF", "#9A7A10", "#7A5BB0"]; // validated for colour-blind separation
  const S = {
    session: null, branches: [], settings: null, branchId: "", route: "overview",
    analytics: { range: "30", from: null, to: null },
    cust: { q: "", status: "all", sort: { key: "lastActivityAt", dir: "desc" }, page: 1 },
    vip: null, vipSelected: new Set(),
    settingsTab: "profile",
  };
  const branchColor = (id) => { const i = S.branches.findIndex((b) => b.id === id); return i >= 0 && i < 4 ? BRANCH_COLORS[i] : "#855058"; };
  const branchLabel = () => S.branches.find((b) => b.id === S.branchId)?.name || "All branches";
  const isOwner = () => S.session?.user.role === "owner";

  const ROUTES = [
    { id: "overview", label: "Overview", icon: "overview", render: renderOverview },
    { id: "analytics", label: "Analytics", icon: "analytics", render: renderAnalytics },
    { id: "insights", label: "Insights", icon: "sparkle", render: renderInsights },
    { id: "customers", label: "All Customers", icon: "users", render: renderCustomers },
    { id: "vip", label: "VIP Customers", icon: "star", render: renderVip },
    { id: "subscription", label: "Subscription", icon: "card", render: renderSubscription },
    { id: "payments", label: "Payment History", icon: "receipt", render: renderPayments },
    { id: "support", label: "Support", icon: "help", render: renderSupport },
    { id: "shop-settings", label: "Settings", icon: "settings", render: renderSettings },
  ];
  // Reached from the header button, not a tab: the café's QR code that customers scan at the till.
  const HIDDEN_ROUTES = [{ id: "counter", label: "Café QR code", icon: "qr", render: renderCafeQr }];

  /* ================================================================ toast / dialogs */
  function toast(msg, type = "") {
    let box = $(".toasts");
    if (!box) { box = document.createElement("div"); box.className = "toasts"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.innerHTML = icon(type === "error" ? "alert" : "check") + `<span>${esc(msg)}</span>`;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3800);
  }

  function overlay({ kind = "dialog", title, desc = "", body = "", wide = false, onOpen, labelledBy }) {
    const opener = document.activeElement;
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    const box = document.createElement("div");
    box.className = kind + (wide ? " wide" : "");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    const hid = "dlg-" + Math.random().toString(36).slice(2, 8);
    box.setAttribute("aria-labelledby", hid);
    if (kind === "drawer") {
      box.innerHTML = `<div class="drawer-head"><div><h2 id="${hid}">${title}</h2>${desc ? `<p class="muted" style="font-size:14px;margin-top:2px">${desc}</p>` : ""}</div><button class="icon-btn" data-close aria-label="Close">${icon("x")}</button></div><div class="drawer-body">${body}</div>`;
    } else if (kind === "sheet") {
      box.innerHTML = `<div class="sheet-grab"></div><h2 id="${hid}" class="sr-only">${title}</h2>${body}`;
    } else {
      box.innerHTML = `<div class="dialog-head"><div><h2 id="${hid}">${title}</h2>${desc ? `<p>${desc}</p>` : ""}</div><button class="icon-btn" data-close aria-label="Close">${icon("x")}</button></div><div class="dialog-body">${body}</div>`;
    }
    document.body.append(scrim, box);
    requestAnimationFrame(() => { scrim.classList.add("open"); box.classList.add("open"); });
    const close = () => {
      scrim.classList.remove("open"); box.classList.remove("open");
      document.removeEventListener("keydown", onKey, true);
      setTimeout(() => { scrim.remove(); box.remove(); }, 220);
      if (opener && document.contains(opener)) opener.focus();
    };
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); close(); }
      if (e.key === "Tab") {
        const f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', box).filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { f[f.length - 1].focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { f[0].focus(); e.preventDefault(); }
      }
    };
    document.addEventListener("keydown", onKey, true);
    scrim.addEventListener("click", close);
    box.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
    const api_ = { el: box, close };
    onOpen?.(api_);
    setTimeout(() => (box.querySelector("[autofocus]") || box.querySelector("input, select, textarea, button:not([data-close])") || box.querySelector("button"))?.focus(), 60);
    return api_;
  }
  const dialog = (o) => overlay({ ...o, kind: "dialog" });
  const drawer = (o) => overlay({ ...o, kind: "drawer" });

  function formError(form, msg) {
    let e = form.querySelector(".form-error");
    if (!e) { e = document.createElement("div"); e.className = "note form-error"; e.setAttribute("role", "alert"); e.style.cssText = "background:var(--crit-bg);color:var(--crit);margin-top:14px"; form.querySelector(".form-actions")?.before(e); }
    e.innerHTML = icon("alert") + `<span>${esc(msg)}</span>`;
  }
  async function busy(btn, fn) {
    const label = btn.innerHTML; btn.disabled = true;
    try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = label; }
  }

  /* ================================================================ downloads */
  let dlPromise = null;
  const getDownloads = () => {
    if (!dlPromise && window.claude?.use) dlPromise = window.claude.use("downloads").catch(() => null);
    return dlPromise || Promise.resolve(null);
  };
  async function saveFile(filename, data, mime) {
    const ns = await getDownloads();
    if (ns) {
      try { await ns.save({ filename, data }); toast(`Saved ${filename}`); }
      catch (e) { if (e?.code !== "declined") toast("This view can't save files. Open the dashboard in its own tab and try again.", "error"); }
      return;
    }
    if (window.claude) { toast("This view can't save files. Open the dashboard in its own tab and try again.", "error"); return; }
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    toast(`Downloaded ${filename}`);
  }
  const csv = (rows) => rows.map((r) => r.map((v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(",")).join("\n");

  /* ================================================================ stamp card + phone preview */
  const ordinal = (n) => n + (["th", "st", "nd", "rd"][((n % 100) - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
  // "Buy 6, get the 7th free" when the reward is a free drink; otherwise "6 stamps earn a ...".
  const offerLine = (L = S.settings.loyalty) => /free (drink|coffee)/i.test(L.rewardName) ? `Buy ${L.stampsPerReward}, get the ${ordinal(L.stampsPerReward + 1)} free` : `${L.stampsPerReward} stamps earn a ${L.rewardName.toLowerCase()}`;
  function stampRow(n, filled, { animate = false, rewardSlot = true, cols } = {}) {
    let html = "";
    for (let i = 0; i < n; i++) {
      const last = rewardSlot && i === n - 1;
      const on = i < filled;
      html += `<span class="stamp ${on ? "on" : ""} ${last && !on ? "reward" : ""}" style="--d:${i}">${last && !on ? GIFT_GLYPH : STAMP_GLYPH}</span>`;
    }
    return `<div class="stamps" style="--n:${cols || n}" ${animate ? "data-animate" : ""}>${html}</div>`;
  }
  // What the customer sees: their card for this café, and their personal code to show at the till.
  function phonePreview({ brand, n, filled, reward, customerId }) {
    const left = Math.max(0, n - filled);
    return `<div class="phone" role="img" aria-label="Customer app preview: ${esc(brand)} card with ${filled} of ${n} stamps">
      <div class="phone-screen">
        <div class="phone-status"><span>9:41</span><span class="phone-notch"></span>${wordmark("phone-wordmark")}</div>
        <div class="phone-app">
          <div class="phone-card">
            <div class="phone-card-top"><span class="phone-brand">${esc(brand)}</span><span class="phone-count">${filled}/${n}</span></div>
            ${stampRow(n, filled, { cols: n <= 7 ? n : 5 })}
            <div class="phone-progress">${left ? `${left} more to a ${esc(reward.toLowerCase())}` : `Your ${esc(reward.toLowerCase())} is ready`}</div>
          </div>
          <div class="phone-code"><span class="phone-scan">${icon("qr")}</span><div><b>Scan at the till</b><span>1 stamp per visit</span></div></div>
          <div class="phone-other"><span class="dotc"></span>2 more cafés in your wallet</div>
        </div>
      </div>
    </div>`;
  }

  /* ================================================================ QR codes and the counter sign */
  function qrSvg(text, px = 160, dark = "#51000E") {
    const m = QR.encode(text), q = 3, s = m.size + q * 2;
    return `<svg viewBox="0 0 ${s} ${s}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${s}" height="${s}" fill="#FFFFFF"/><path d="${QR.toSvgPath(m, q)}" fill="${dark}"/></svg>`;
  }
  // The link inside every café QR code. Scanning it with any phone camera opens CupCoff and adds the stamp.
  const cafeScanUrl = (branchId) => {
    const p = api.cafeScanParams(branchId);
    return `${location.origin}/#c-scan?` + new URLSearchParams({ cafe: p.cafe, b: p.b, n: p.n, p: String(p.p), r: p.r }).toString();
  };
  // QR as an SVG fragment placed inside a bigger SVG (signs, stickers)
  function qrPlaced(text, x, y, size, dark = "#51000E") {
    const m = QR.encode(text), q = 2, s = m.size + q * 2;
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges"><rect width="${s}" height="${s}" fill="#FFFFFF"/><path d="${QR.toSvgPath(m, q)}" fill="${dark}"/></svg>`;
  }
  function wrapText(t, max) {
    const words = String(t).split(/\s+/), lines = []; let cur = "";
    words.forEach((w) => { if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); });
    if (cur) lines.push(cur);
    return lines;
  }
  // A4 counter sign with the café's QR code: customers scan it with their phone when they pay.
  function signSvg({ brand, branch, n, reward, offer, url }) {
    const F = `font-family="'Bricolage Grotesque', ${CONFIG.fonts.display ? CONFIG.fonts.display + ", " : ""}'Helvetica Neue', Arial, sans-serif"`;
    const B = `font-family="'Instrument Sans', ${CONFIG.fonts.body ? CONFIG.fonts.body + ", " : ""}'Helvetica Neue', Arial, sans-serif"`;
    const brandLines = wrapText(brand, 22), extra = (brandLines.length - 1) * 44;
    const bandH = 190 + extra, stripeBottom = 600 + extra;
    let stripes = "", awning = "";
    for (let x = 0, i = 0; x < 595; x += 22, i++) {
      stripes += `<rect x="${x}" y="${bandH}" width="22" height="${stripeBottom - bandH}" fill="${i % 2 ? "#FFFFFF" : "#BDE0FF"}"/>`;
      awning += `<path d="M${x} ${bandH}h22v11a11 11 0 0 1-22 0z" fill="${i % 2 ? "#FFFFFF" : "#BDE0FF"}" stroke="#51000E" stroke-width="1.5"/>`;
    }
    const art = (name, x, y, size) => `<g transform="translate(${x},${y}) scale(${size / 120})" class="ill"><path class="wash" d="${ILL_WASH[name]}" filter="url(#ill-wash)" transform="translate(3 4)"/><g class="ghost" filter="url(#ill-sketch)" transform="translate(.7 .5)">${ILL[name]}</g><g filter="url(#ill-rough)">${ILL[name]}</g></g>`;
    const box = 260, bx = 297.5 - box / 2, by = bandH + 40, boxH = box + 40;
    const step = (x, num, lines) => `<g transform="translate(${x},0)"><circle r="17" fill="#51000E"/><text y="6" text-anchor="middle" fill="#BDE0FF" font-size="17" font-weight="700" ${F}>${num}</text>${lines.map((l, i) => `<text y="${42 + i * 19}" text-anchor="middle" fill="#51000E" font-size="15" ${B}>${esc(l)}</text>`).join("")}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 842" width="595" height="842">
  <defs>${ILL_DEFS}</defs><style>${ILL_STYLE}</style>
  <rect width="595" height="842" fill="#FFFDFA"/>${stripes}
  <rect width="595" height="${bandH}" fill="#51000E"/>${awning}
  <text x="48" y="64" fill="#BDE0FF" font-size="17" ${B}>${esc(branch ? branch + " branch" : "All branches")}</text>
  ${brandLines.map((l, i) => `<text x="48" y="${114 + i * 44}" fill="#FFFDFA" font-size="40" font-weight="700" ${F}>${esc(l)}</text>`).join("")}
  <text x="48" y="${158 + extra}" fill="#BDE0FF" font-size="21" ${B}>Collect stamps with CupCoff. No app download needed.</text>
  ${art("latte", 18, bandH + 40, 150)}${art("croissant", 22, bandH + 210, 140)}${art("machine", 430, bandH + 40, 150)}${art("milk", 440, bandH + 210, 140)}
  <rect x="${bx}" y="${by}" width="${box}" height="${boxH}" rx="26" fill="#FFFFFF" stroke="#51000E" stroke-width="3"/>
  ${qrPlaced(url, bx + 18, by + 16, box - 36)}
  <text x="297.5" y="${by + box + 24}" text-anchor="middle" fill="#51000E" font-size="18" font-weight="700" ${F}>Paid? Scan for your stamp</text>
  <rect x="${297.5 - 150}" y="${by + boxH + 14}" width="300" height="44" rx="22" fill="#51000E"/>
  <text x="297.5" y="${by + boxH + 43}" text-anchor="middle" fill="#FFFDFA" font-size="20" font-weight="700" ${F}>${esc(offer)}</text>
  <rect y="${stripeBottom}" width="595" height="3" fill="#51000E"/>
  <g transform="translate(0,${stripeBottom + 52})">${step(118, 1, ["Pay for", "your drink"])}${step(297.5, 2, ["Scan the code with", "your phone camera"])}${step(477, 3, wrapText(offer, 18))}</g>
  <rect y="792" width="595" height="50" fill="#51000E"/>
  <g transform="translate(40,798) scale(0.33)"><g transform="translate(10 0) skewX(-6)" fill="none" stroke="#BDE0FF" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"><path d="${WORD_D}"/></g></g>
  <text x="555" y="822" text-anchor="end" fill="#BDE0FF" font-size="13" ${B}>1 stamp per visit</text>
</svg>`;
  }
  async function svgToPng(svg, w = 1190, h = 1684) {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    return new Promise((r) => c.toBlob(r, "image/png"));
  }
  function signFor(branchId) {
    const b = S.branches.find((x) => x.id === branchId);
    const L = S.settings.loyalty;
    return { brand: S.session.brand.name, branch: b?.name || "", n: L.stampsPerReward, reward: L.rewardName, offer: offerLine(L), url: cafeScanUrl(b?.id || branchId) };
  }
  const fileSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  // Round counter sticker (print at 10 cm). Same QR as the A4 sign.
  function stickerSvg({ brand, offer, url }) {
    const F = `font-family="'Bricolage Grotesque', ${CONFIG.fonts.display ? CONFIG.fonts.display + ", " : ""}'Helvetica Neue', Arial, sans-serif"`;
    const B = `font-family="'Instrument Sans', ${CONFIG.fonts.body ? CONFIG.fonts.body + ", " : ""}'Helvetica Neue', Arial, sans-serif"`;
    const name = wrapText(brand.toUpperCase(), 26)[0];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <circle cx="200" cy="200" r="200" fill="#51000E"/><circle cx="200" cy="200" r="188" fill="none" stroke="#BDE0FF" stroke-width="3"/>
  <g transform="translate(144,34) scale(0.4)"><g transform="translate(10 0) skewX(-6)" fill="none" stroke="#BDE0FF" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"><path d="${WORD_D}"/></g></g>
  <text x="200" y="100" text-anchor="middle" fill="#BDE0FF" font-size="13" letter-spacing="1.5" font-weight="600" ${B}>${esc(name)}</text>
  <rect x="112" y="112" width="176" height="176" rx="18" fill="#FFFFFF"/>${qrPlaced(url, 122, 122, 156)}
  <text x="200" y="320" text-anchor="middle" fill="#FFFDFA" font-size="22" font-weight="700" ${F}>Scan for your stamp</text>
  <text x="200" y="344" text-anchor="middle" fill="#BDE0FF" font-size="13.5" ${B}>${esc(offer)}</text>
</svg>`;
  }
  async function downloadSign(branchId, kind) {
    api.completeSetupStep("sign");
    const p = signFor(branchId);
    const svg = signSvg(p);
    const base = `cupcoff-counter-sign-${fileSlug(p.brand)}${p.branch ? "-" + fileSlug(p.branch) : ""}`;
    if (kind === "sticker" || kind === "sticker-svg") {
      const st = stickerSvg(p), sb = base.replace("counter-sign", "sticker");
      if (kind === "sticker-svg") return saveFile(sb + ".svg", st, "image/svg+xml");
      try { saveFile(sb + ".png", await svgToPng(st, 1200, 1200), "image/png"); }
      catch { toast("Couldn't create the PNG. Download the SVG version instead.", "error"); }
      return;
    }
    if (kind === "png") {
      try { saveFile(base + ".png", await svgToPng(svg), "image/png"); }
      catch { toast("Couldn't create the PNG. Download the SVG version instead.", "error"); }
    } else saveFile(base + ".svg", svg, "image/svg+xml");
  }
  function openSign(branchId) {
    const p = signFor(branchId);
    dialog({
      title: "Counter sign", wide: true,
      desc: `A4 sign for ${esc(p.branch || "all branches")}. Customers scan its QR code with their phone when they pay, and the stamp is added straight away.`,
      body: `<div class="poster-preview">${signSvg(p).replace('width="595" height="842"', 'role="img" aria-label="Counter sign preview"')}</div>
        <div class="form-actions"><button class="btn btn-secondary" data-dl="png">${icon("download")}Download PNG</button><button class="btn btn-primary" data-dl="svg">${icon("download")}Download SVG for print</button></div>`,
      onOpen: ({ el }) => $$("[data-dl]", el).forEach((b) => b.addEventListener("click", () => downloadSign(branchId, b.dataset.dl))),
    });
  }
  function customerInstructions() {
    const L = S.settings.loyalty, brand = S.session.brand.name;
    const text = `How to collect stamps at ${brand}\n1. Pay for your drink.\n2. Scan the CupCoff QR code on our counter with your phone camera. No app download needed.\n3. Your stamp is added straight away (1 per visit).\n4. ${offerLine(L)}. When your card is full, scan the code again and choose "Use it now".`;
    dialog({
      title: "Instructions for customers",
      desc: "Share these at the till, on table cards, or in your social posts.",
      body: `<ol class="steps"><li><div><strong>Pay for your drink</strong><span>As usual, at the till.</span></div></li>
        <li><div><strong>Scan the QR code on the counter</strong><span>With the phone camera or the CupCoff app. The first time, it asks for a name and email. No app download needed.</span></div></li>
        <li><div><strong>The stamp is added straight away</strong><span>1 stamp per visit${Number(L.scanCooldownMinutes) ? `: another scan within ${L.scanCooldownMinutes} minutes doesn't add a second one` : ""}.</span></div></li>
        <li><div><strong>Enjoy the reward</strong><span>${esc(offerLine(L))}. When the card is full, the customer scans again, taps "Use it now" and shows the green screen to the barista.</span></div></li></ol>
        <div class="form-actions"><button class="btn btn-primary" data-copy>${icon("copy")}Copy as text</button></div>`,
      onOpen: ({ el }) => $("[data-copy]", el).addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(text); toast("Instructions copied"); } catch { toast("Copying isn't allowed here. Select the text and copy it instead.", "error"); }
      }),
    });
  }

  /* ================================================================ shell */
  function renderShell() {
    const u = S.session.user;
    root.innerHTML = `${ILL_DEFS_HOST}
      <a href="#main" class="sr-only" style="position:absolute">Skip to content</a>
      <header class="topbar">
        <div class="topbar-inner">
          <div class="topbar-row">
            <a class="logo" href="#overview" aria-label="CupCoff, go to overview">${wordmark("logo-word")}</a>
            <div class="brandline"><strong id="brandName">${esc(S.session.brand.name)}</strong><span>Welcome back, ${esc(u.firstName)}</span></div>
            <div class="topbar-actions">
              <label class="select-dark"><span class="sr-only">Branch</span>${icon("store", "lead")}
                <select id="branchSelect" ${u.role !== "owner" ? "disabled" : ""}></select>${icon("chevron", "trail")}</label>
              <a class="btn btn-sky" id="scanBtn" href="#counter" aria-label="Café QR code" title="Café QR code">${icon("qr")}<span class="add-branch-label">Café QR code</span></a>
              ${isOwner() ? `<button class="btn btn-outline-dark" id="addBranchBtn" aria-label="Add branch" title="Add branch">${icon("plus")}<span class="add-branch-label">Add branch</span></button>` : ""}
              <div class="account">
                <button class="account-btn" id="accountBtn" aria-haspopup="menu" aria-expanded="false" aria-controls="accountMenu">
                  <span class="avatar" aria-hidden="true">${esc(u.name.split(" ").map((x) => x[0]).join("").slice(0, 2))}</span>
                  <span class="account-name">${esc(u.name)}</span>${icon("chevron")}</button>
                <div class="menu" id="accountMenu" role="menu">
                  <div class="menu-head"><strong>${esc(u.name)}</strong><span>${esc(u.email)} · ${u.role === "owner" ? "Owner" : "Branch manager"}</span></div>
                  <a role="menuitem" href="#shop-settings" data-settings-tab="profile">${icon("store")}Café profile</a>
                  <a role="menuitem" href="#shop-settings" data-settings-tab="team">${icon("team")}Team and access</a>
                  <a role="menuitem" href="#subscription">${icon("card")}Subscription</a>
                  <button role="menuitem" id="toCustomerApp">${icon("phone")}Open the customer app</button>
                  <div class="sep"></div>
                  <div class="menu-label">View the dashboard as (demo)</div>
                  <button role="menuitemradio" aria-checked="${u.role === "owner"}" data-role="owner">${icon("shield")}Owner</button>
                  <button role="menuitemradio" aria-checked="${u.role !== "owner"}" data-role="branch_manager">${icon("store")}Branch manager</button>
                  <div class="sep"></div>
                  <button role="menuitem" class="logout" id="logoutBtn">${icon("logout")}Log out</button>
                </div>
              </div>
            </div>
          </div>
          <nav class="tabs" aria-label="Dashboard sections">${ROUTES.map((r) => `<a class="tab" href="#${r.id}" data-route="${r.id}">${icon(r.icon)}${r.label}</a>`).join("")}</nav>
          <button class="btn mobile-nav-btn" id="mobileNavBtn" aria-haspopup="dialog"><span id="mobileNavLabel">Overview</span>${icon("menu")}</button>
        </div>
        <div class="awning" aria-hidden="true"></div>
      </header>
      <main id="main" tabindex="-1"></main>`;
    fillBranchSelect();
    $("#branchSelect").addEventListener("change", (e) => { S.branchId = e.target.value; S.cust.page = 1; S.vip = null; route(); toast(`Showing ${branchLabel()}`); });
    $("#addBranchBtn")?.addEventListener("click", openAddBranch);
    const btn = $("#accountBtn"), menu = $("#accountMenu");
    const setMenu = (open) => { menu.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); if (open) menu.querySelector("a,button")?.focus(); };
    btn.addEventListener("click", (e) => { e.stopPropagation(); setMenu(!menu.classList.contains("open")); });
    document.addEventListener("click", (e) => { if (!e.target.closest(".account")) setMenu(false); });
    menu.addEventListener("keydown", (e) => {
      const items = $$("a,button", menu);
      const i = items.indexOf(document.activeElement);
      if (e.key === "Escape") { setMenu(false); btn.focus(); }
      if (e.key === "ArrowDown") { items[(i + 1) % items.length].focus(); e.preventDefault(); }
      if (e.key === "ArrowUp") { items[(i - 1 + items.length) % items.length].focus(); e.preventDefault(); }
    });
    $$("[data-settings-tab]", menu).forEach((a) => a.addEventListener("click", () => { S.settingsTab = a.dataset.settingsTab; setMenu(false); if (S.route === "shop-settings") route(); }));
    $$("a[href='#subscription']", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    $$("[data-role]", menu).forEach((b) => b.addEventListener("click", async () => {
      S.session = await api.setDemoRole(b.dataset.role);
      S.branchId = S.session.user.branchId || "";
      renderShell(); route();
      toast(b.dataset.role === "owner" ? "Viewing as the owner" : "Viewing as the Cascade branch manager");
    }));
    $("#toCustomerApp").addEventListener("click", () => switchTo("customer", "c-cards"));
    $("#logoutBtn").addEventListener("click", async () => { await api.logout(); S.session.signedIn = false; renderSignIn("You're signed out."); history.replaceState(null, "", location.pathname + location.search); });
    $("#mobileNavBtn").addEventListener("click", () => {
      overlay({ kind: "sheet", title: "Sections", body: `<nav aria-label="Dashboard sections">${ROUTES.map((r) => `<a href="#${r.id}" ${r.id === S.route ? 'aria-current="page"' : ""}>${icon(r.icon)}${r.label}</a>`).join("")}</nav>`,
        onOpen: ({ el, close }) => $$("a", el).forEach((a) => a.addEventListener("click", close)) });
    });
  }
  function fillBranchSelect() {
    const sel = $("#branchSelect");
    if (!sel) return;
    const opts = (isOwner() ? [`<option value="">All branches</option>`] : []).concat(S.branches.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`));
    sel.innerHTML = opts.join("");
    sel.value = S.branchId;
  }

  function openAddBranch() {
    api.getSubscription().then((sub) => {
      const add = sub.pricing.additionalBranch;
      dialog({
        title: "Add a branch",
        desc: "The new branch gets its own QR poster and appears in the branch selector straight away.",
        body: `<form id="branchForm" novalidate>
          <div class="form-grid">
            <div class="field full"><label for="bName">Branch name</label><input class="input" id="bName" name="name" required maxlength="40" placeholder="e.g. Komitas" autocomplete="off"></div>
            <div class="field full"><label for="bAddr">Address</label><input class="input" id="bAddr" name="address" maxlength="80" placeholder="Street and city"></div>
          </div>
          <div class="note" style="margin-top:16px">${icon("card")}<span>Your monthly price goes from <b>${money(sub.monthlyTotal)}</b> to <b>${money(sub.monthlyTotal + add)}</b>. Each additional branch costs ${money(add)} per month. Demo pricing, so nothing is charged.</span></div>
          <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" type="submit">${icon("plus")}Add branch</button></div>
        </form>`,
        onOpen: ({ el, close }) => {
          const f = $("#branchForm", el);
          f.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = f.name.value;
            if (!name.trim()) { f.name.setAttribute("aria-invalid", "true"); formError(f, "Enter a branch name."); f.name.focus(); return; }
            try {
              const b = await busy(f.querySelector("[type=submit]"), () => api.createBranch({ name, address: f.address.value }));
              S.branches = await api.getBranches();
              S.branchId = b.id;
              fillBranchSelect(); close(); route();
              toast(`Branch "${b.name}" added`);
            } catch (err) { formError(f, err.message); }
          });
        },
      });
    });
  }

  /* ================================================================ router */
  let renderToken = 0;
  function route(fromHash = false) {
    stopCamera();
    if (S.mode === "customer") return routeCustomer();
    if (!document.getElementById("main")) return;
    const id = (location.hash || "#overview").slice(1);
    const r = ROUTES.find((x) => x.id === id) || HIDDEN_ROUTES.find((x) => x.id === id) || ROUTES[0];
    S.route = r.id;
    $$(".tab").forEach((t) => (t.dataset.route === r.id ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current")));
    const lbl = $("#mobileNavLabel"); if (lbl) lbl.textContent = r.label;
    document.title = `${r.label} · CupCoff`;
    const main = $("#main");
    main.innerHTML = `<div class="skel" style="height:34px;width:240px;margin-bottom:24px"></div><div class="grid"><div class="span-8 skel" style="height:260px"></div><div class="span-4 skel" style="height:260px"></div></div>`;
    const tk = ++renderToken;
    r.render(main, () => tk === renderToken).then(() => {
      if (fromHash && tk === renderToken) { main.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }
    }).catch((err) => {
      console.error(err);
      if (tk === renderToken) main.innerHTML = `<div class="panel empty"><strong>This section didn't load</strong><p>${esc(err.message)}</p><button class="btn btn-secondary" style="margin-top:14px" id="retry">Try again</button></div>`;
      $("#retry")?.addEventListener("click", () => route());
    });
  }
  const pageHead = (title, sub, right = "") => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div>${right ? `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${right}</div>` : ""}</div>`;

  /* ================================================================ OVERVIEW */
  const ACT = {
    join: { icon: "userPlus", label: "Joined the program", cls: "join" },
    stamp: { icon: "stamp", label: "Stamp issued", cls: "" },
    reward: { icon: "gift", label: "Reward redeemed", cls: "reward" },
    special: { icon: "sparkle", label: "Special reward assigned", cls: "special" },
  };
  const actQty = (e) => e.type === "stamp" ? `+${e.qty} ${e.qty === 1 ? "stamp" : "stamps"}` : e.type === "reward" ? `1 reward <span class="muted" style="font-weight:400">(−${e.qty} stamps)</span>` : e.type === "join" ? `<span class="muted" style="font-weight:400">New member</span>` : `<span class="muted" style="font-weight:400">${esc(e.label || "")}</span>`;
  const activityList = (items) => items.length ? `<ul class="activity">${items.map((e) => {
    const a = ACT[e.type] || ACT.stamp;
    return `<li><span class="act-icon ${a.cls}">${icon(a.icon)}</span>
      <div class="act-main"><strong>${a.label}</strong><span><button class="linkbtn" data-customer="${e.customerId}">${esc(e.customerName || e.customerId)}</button> <span class="num">${e.customerId}</span></span></div>
      <div class="act-where"><span class="branch-dot" style="background:${branchColor(e.branchId)}"></span>${esc(e.branch)}<br>${fmtDateTime(e.at)}</div>
      <div class="act-qty">${actQty(e)}</div></li>`;
  }).join("")}</ul>` : `<div class="empty">${illus("milk")}<strong>No activity yet</strong><p>Stamps and rewards appear here as soon as customers scan your counter code.</p></div>`;
  const bindCustomerLinks = (root) => $$("[data-customer]", root).forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openCustomer(b.dataset.customer); }));

  async function renderOverview(main, alive) {
    if (S.session.brand.isNew) { const setup = await api.getSetup(); if (setup && Object.values(setup).some((v) => !v)) return renderWelcome(main, alive); }
    const t0 = today0();
    const [ov, act, sub, payments, ins] = await Promise.all([
      api.getOverview({ branchId: S.branchId }), api.getActivity({ branchId: S.branchId, limit: 8 }), api.getSubscription(),
      api.getPayments(), api.getInsights({ branchId: S.branchId, from: new Date(t0.getTime() - 6 * DAY), to: t0 })]);
    if (!alive()) return;
    const signBranch = S.branchId || S.branches[0]?.id;
    const renew = new Date(sub.renewsAt), start = new Date(sub.currentPeriodStart);
    const periodDays = Math.round((renew - start) / DAY), daysLeft = Math.max(0, Math.ceil((renew - Date.now()) / DAY));
    const failed = payments.find((p) => p.status === "failed");
    const now = new Date(), hour = now.getHours();
    const greet = hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const T = ov.today;
    const where = S.branchId ? `at ${esc(branchLabel())}` : "across all branches";
    const vsLast = T.visits - T.sameTimeLastWeek;
    const line = (label, value, strong) => `<div class="rc-line${strong ? " strong" : ""}"><span>${label}</span><i></i><b>${value}</b></div>`;
    const topDrinks = ins.top.slice(0, 5);

    main.innerHTML = `
      <div class="ov-head">
        <div><p class="ov-date">${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}, ${where}</p>
          <h1 class="squiggle">${greet}, ${esc(S.session.user.firstName)}</h1></div>
      </div>

      <section aria-label="Key figures">
        <div class="stats">
          ${statCell("users", fmt(ov.totalCustomers), "Total loyalty customers", `+${fmt(ov.newCustomers7d)} in the last 7 days`, ov.trend.customers)}
          ${statCell("stamp", fmt(ov.totalStamps), "Total stamps issued", `${fmt(ov.stamps7d)} in the last 7 days`, ov.trend.stamps)}
          ${statCell("gift", fmt(ov.rewardsRedeemed), "Rewards redeemed", `${fmt(ov.rewards7d)} in the last 7 days`, ov.trend.rewards)}
          ${statCell("clock", fmt(ov.activeCustomers), "Active loyalty customers", `${pct(ov.activeShare)} visited in the last 30 days`, ov.trend.active)}
        </div>
        <p class="spark-note">Lines show the last 30 days.</p>
      </section>

      <div class="grid">
        <section class="panel span-8" aria-labelledby="actTitle">
          <div class="panel-head"><div><h2 id="actTitle">Recent activity</h2><p>Latest stamps and rewards ${S.branchId ? "at " + esc(branchLabel()) : "across all branches"}</p></div><a class="btn btn-ghost btn-sm" href="#customers">All customers</a></div>
          ${activityList(act)}
        </section>

        <div class="span-4 ov-side">
          <div class="receipt-wrap"><section class="receipt" aria-labelledby="rcTitle">
            <div class="rc-top">${illus("takeaway", "rc-art")}<strong>${esc(S.session.brand.name)}</strong><span id="rcTitle">Today so far, ${fmtTime(now.toISOString())}</span></div>
            ${T.visits || T.rewards || T.joins ? `
              <div class="rc-sep"></div>
              ${line("Visits", fmt(T.visits), true)}${line("Stamps given", fmt(T.stamps))}${line("Rewards redeemed", fmt(T.rewards))}${line("New members", fmt(T.joins))}
              ${T.topItems.length ? `<div class="rc-sep"></div><div class="rc-label">Most ordered today</div>${T.topItems.map((i) => line(esc(i.name), fmt(i.count))).join("")}` : ""}
              <div class="rc-sep"></div>
              ${T.topBranch ? `<p class="rc-note">Busiest branch: <b>${esc(T.topBranch.name)}</b> (${plural(T.topBranch.visits, "visit")})</p>` : ""}
              ${T.firstAt ? `<p class="rc-note">First scan ${fmtTime(T.firstAt)}, latest ${fmtTime(T.lastAt)}</p>` : ""}
              <p class="rc-note">${vsLast === 0 ? "Same number of visits as" : `${plural(Math.abs(vsLast), "visit")} ${vsLast > 0 ? "more" : "fewer"} than`} this time last ${now.toLocaleDateString("en-GB", { weekday: "long" })}</p>`
            : `<div class="rc-sep"></div><p class="rc-note" style="text-align:center;padding:10px 0">No scans yet today. Your first customer will appear here.</p>`}
            <p class="rc-thanks">Thanks for brewing with CupCoff</p>
          </section></div>

          <section class="panel sub-summary" aria-labelledby="subTitle">
            <div class="panel-head"><div><h2 id="subTitle">Subscription</h2><p>Paid automatically each month</p></div>${subBadge(sub)}</div>
            <div style="display:flex;align-items:baseline;gap:10px"><span class="days-left">${daysLeft}</span><span class="muted">${daysLeft === 1 ? "day" : "days"} until ${sub.cancelAtPeriodEnd ? "it ends" : `the next payment of ${money(sub.monthlyTotal)}`}</span></div>
            <div class="daybar" aria-hidden="true">${Array.from({ length: periodDays }, (_, i) => `<i class="${i < periodDays - daysLeft - 1 ? "used" : i === periodDays - daysLeft - 1 ? "today" : ""}"></i>`).join("")}</div>
            ${failed && (Date.now() - new Date(failed.date)) / DAY < 150 ? `<p class="muted" style="font-size:13.5px;margin-top:8px">One payment failed on ${fmtDate(failed.date, { day: "numeric", month: "short" })} and went through on the retry.</p>` : ""}
            <a class="btn btn-secondary btn-sm" href="#subscription" style="margin-top:14px">Manage subscription</a>
          </section>
        </div>

        <section class="panel span-8 popular" aria-labelledby="popTitle">
          <div class="panel-head"><div><h2 id="popTitle">Popular this week</h2><p>Drinks ordered in the last 7 days ${S.branchId ? "at " + esc(branchLabel()) : ""}</p></div><a class="btn btn-ghost btn-sm" href="#insights">All insights</a></div>
          ${topDrinks.length ? `<div class="pop-grid">
            <ol class="pop-list">${topDrinks.map((d, i) => `<li><span class="pop-n">${i + 1}</span><span class="pop-name">${esc(d.name)}</span><span class="pop-bar"><i style="width:${(d.share / topDrinks[0].share) * 100}%"></i></span><span class="pop-val">${pct(d.share)}</span></li>`).join("")}</ol>
            <div class="pop-side">${illus(["cappuccino", "latte", "flatwhite", "raf", "matcha", "cocoa"].includes(topDrinks[0].id) ? "latte" : topDrinks[0].id === "americano" || topDrinks[0].id === "espresso" ? "machine" : topDrinks[0].id === "armenian" ? "moka" : "takeaway", "pop-art")}
              ${(() => { const r = ins.rising.find((x) => !x.food); return r ? `<p><b>${esc(r.name)}</b> is up ${Math.round(r.change * 100)}% on the week before.</p>` : ""; })()}
              ${ins.milks.find((m) => m.name === "Oat") ? `<p>${pct(ins.milks.find((m) => m.name === "Oat").share)} of milk drinks use oat milk.</p>` : ""}</div>
          </div>` : `<div class="empty">${illus("croissant")}<strong>No orders recorded this week</strong><p>Drinks customers tap after scanning your QR code show up here.</p></div>`}
        </section>

        <section class="panel span-4 counter-panel" aria-labelledby="ctTitle">
          <div class="panel-head"><div><h2 id="ctTitle">At the till</h2><p>Customers scan your café's QR code when they pay</p></div></div>
          <div class="counter-art">${illus("pourover")}${illus("machine")}</div>
          <div class="field" style="margin-bottom:10px"><label for="signBranch">Counter sign for</label>
            <select class="input" id="signBranch">${S.branches.filter((b) => isOwner() || b.id === S.branchId).map((b) => `<option value="${b.id}" ${b.id === signBranch ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select></div>
          <div class="qr-actions">
            <a class="btn btn-primary btn-sm" href="#counter">${icon("qr")}Café QR code</a>
            <button class="btn btn-secondary btn-sm" id="signView">${icon("eye")}View sign</button>
            <button class="btn btn-ghost btn-sm" id="qrHelp">${icon("help")}Customer instructions</button>
          </div>
        </section>
      </div>`;
    bindCustomerLinks(main);
    $("#signView").addEventListener("click", () => openSign($("#signBranch").value));
    $("#qrHelp").addEventListener("click", customerInstructions);
  }
  const STAT_ART = { users: "latte", stamp: "machine", gift: "takeaway", clock: "pourover" };
  function sparkline(values) {
    const w = 120, h = 34, max = Math.max(...values), min = Math.min(...values), rng = max - min || 1;
    const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 4 - ((v - min) / rng) * (h - 8)]);
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
    const last = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}L${w},${h}L0,${h}Z" fill="#EAF4FF"/><path d="${d}" fill="none" stroke="#51000E" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/><circle cx="${last[0]}" cy="${last[1]}" r="3" fill="#51000E"/></svg>`;
  }
  const statCell = (ic, value, label, foot, trend) => `<div class="stat"><span class="stat-icon">${illus(STAT_ART[ic] || "latte")}</span><span class="stat-value">${value}</span><span class="stat-label">${label}</span>${trend ? sparkline(trend) : ""}<span class="stat-foot">${foot}</span></div>`;
  const subBadge = (sub) => sub.cancelAtPeriodEnd ? `<span class="badge warn">${icon("pause")}Ends ${fmtDate(sub.renewsAt, { day: "numeric", month: "short" })}</span>`
    : sub.status === "trial" ? `<span class="badge info">${icon("clock")}Free trial</span>` : `<span class="badge good">${icon("check")}Active</span>`;

  /* ================================================================ ANALYTICS */
  function rangeDates() {
    // Presets cover complete days (ending yesterday) so today's half-finished day doesn't read as a drop.
    const A = S.analytics, t = new Date(today0().getTime() - DAY);
    if (A.range === "custom" && A.from && A.to) return { from: new Date(A.from), to: new Date(A.to) };
    const n = Number(A.range === "custom" ? 30 : A.range);
    return { from: new Date(t.getTime() - (n - 1) * DAY), to: t };
  }
  async function renderAnalytics(main, alive) {
    const { from, to } = rangeDates();
    const data = await api.getAnalytics({ branchId: S.branchId, from, to });
    if (!alive()) return;
    const A = S.analytics;
    const rangeText = `${fmtDate(from, { day: "numeric", month: "short" })} – ${fmtDate(to)}`;
    const delta = ([cur, prev]) => {
      if (!prev) return `<span class="delta flat">No data for the previous period</span>`;
      const d = (cur - prev) / prev;
      const cls = Math.abs(d) < 0.005 ? "flat" : d > 0 ? "up" : "down";
      return `<span class="delta ${cls}">${cls !== "flat" ? icon(d > 0 ? "up" : "down") : ""}${cls === "flat" ? "Same as" : (d > 0 ? "+" : "") + Math.round(d * 100) + "% vs"} previous ${Math.round((to - from) / DAY) + 1} days</span>`;
    };
    const charts = [
      { key: "registrations", title: "Loyalty registrations", sub: "Customers who joined the program", kind: "bar" },
      { key: "repeatVisits", title: "Repeat visits", sub: "Recorded visits after a customer's first one", kind: "line" },
      { key: "stamps", title: "Stamps issued", sub: "Stamps added to customer cards", kind: "line" },
      { key: "rewards", title: "Rewards redeemed", sub: "Completed cards turned into rewards", kind: "bar" },
    ];
    main.innerHTML = pageHead("Analytics", `Recorded loyalty activity at ${esc(S.branchId ? branchLabel() : "all branches")}, ${rangeText}.${A.range !== "custom" ? " Today's activity is on the Overview." : ""}`) + `
      <div class="toolbar" role="group" aria-label="Date range">
        <div class="seg">${[["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"], ["custom", "Custom range"]].map(([v, l]) => `<button type="button" data-range="${v}" aria-pressed="${A.range === v}">${l}</button>`).join("")}</div>
        <form class="date-range" id="customRange" ${A.range === "custom" ? "" : "hidden"}>
          <label class="sr-only" for="rFrom">From</label><input class="input" type="date" id="rFrom" value="${isoDay(from)}" max="${isoDay(today0())}" min="${isoDay(new Date(Date.now() - 365 * DAY))}">
          <span class="muted">to</span>
          <label class="sr-only" for="rTo">To</label><input class="input" type="date" id="rTo" value="${isoDay(to)}" max="${isoDay(today0())}">
          <button class="btn btn-primary btn-sm" type="submit">Apply</button>
        </form>
      </div>
      <div class="note" style="margin-bottom:20px">${icon("info")}<span>These figures count stamps, visits and rewards recorded in CupCoff. They show how customers use your loyalty program, not how much extra revenue it brings in.</span></div>
      <div class="kpis">${charts.map((c) => `<div class="kpi"><div class="kpi-label">${c.title}</div><div class="kpi-value">${fmt(data.totals[c.key][0])}</div>${delta(data.totals[c.key])}</div>`).join("")}</div>
      <div class="grid">
        ${charts.map((c) => `<section class="panel span-6 chart-card" aria-labelledby="ch-${c.key}">
          <div class="panel-head"><div><h3 id="ch-${c.key}">${c.title}</h3><p>${c.sub}, by ${data.bucket}</p></div>
            <button class="btn btn-ghost btn-sm" data-table="${c.key}" aria-pressed="false" aria-controls="tbl-${c.key}">Show table</button></div>
          <div id="chart-${c.key}"></div>
          <div id="tbl-${c.key}" hidden>${seriesTable(data[c.key], data.bucket, c.title)}</div>
        </section>`).join("")}
        <section class="panel span-6" aria-labelledby="byBranch">
          <div class="panel-head"><div><h3 id="byBranch">Loyalty activity by branch</h3><p>Stamps issued in the selected period</p></div></div>
          <div id="branchChart"></div>
          <div class="table-wrap" style="margin-top:16px"><table><thead><tr><th>Branch</th><th class="n">Visits</th><th class="n">Stamps</th><th class="n">Rewards</th><th class="n">New members</th></tr></thead>
            <tbody>${data.byBranch.map((b) => `<tr><td><span class="branch-dot" style="background:${branchColor(b.id)}"></span>${esc(b.name)}</td><td class="n">${fmt(b.visits)}</td><td class="n">${fmt(b.stamps)}</td><td class="n">${fmt(b.rewards)}</td><td class="n">${fmt(b.registrations)}</td></tr>`).join("")}</tbody></table></div>
        </section>
        <section class="panel span-6" aria-labelledby="topCust">
          <div class="panel-head"><div><h3 id="topCust">Most active loyalty customers</h3><p>By recorded visits in the selected period</p></div></div>
          ${data.topCustomers.length ? `<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Home branch</th><th class="n">Visits</th><th class="n">Rewards</th></tr></thead><tbody>
            ${data.topCustomers.map((c) => `<tr class="clickable" tabindex="0" data-open="${c.id}"><td class="cust-cell"><strong>${esc(c.displayName)}</strong><span>${c.id}</span></td><td>${esc(c.homeBranch)}</td><td class="n">${fmt(c.visits)}</td><td class="n">${fmt(c.rewards)}</td></tr>`).join("")}
          </tbody></table></div>` : `<div class="empty">${illus("beans")}<strong>No visits in this period</strong><p>Try a longer date range.</p></div>`}
        </section>
      </div>`;
    charts.forEach((c) => Charts.timeSeries($(`#chart-${c.key}`, main), { data: data[c.key], kind: c.kind, name: c.title, bucket: data.bucket, color: "#51000E" }));
    Charts.hbar($("#branchChart", main), { name: "Stamps issued", rows: data.byBranch.map((b) => ({ label: b.name, value: b.stamps, color: branchColor(b.id), extra: `${fmt(b.visits)} visits, ${fmt(b.rewards)} rewards` })) });
    $$("[data-range]", main).forEach((b) => b.addEventListener("click", () => {
      A.range = b.dataset.range;
      if (A.range === "custom") { $$("[data-range]", main).forEach((x) => x.setAttribute("aria-pressed", x === b)); $("#customRange").hidden = false; $("#rFrom").focus(); return; }
      route();
    }));
    $("#customRange").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = $("#rFrom").value, t = $("#rTo").value;
      if (!f || !t) { toast("Pick both a start and an end date.", "error"); return; }
      if (f > t) { toast("The start date must be before the end date.", "error"); return; }
      A.range = "custom"; A.from = f + "T00:00"; A.to = t + "T00:00"; route();
    });
    $$("[data-table]", main).forEach((b) => b.addEventListener("click", () => {
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", on); b.textContent = on ? "Show chart" : "Show table";
      $(`#tbl-${b.dataset.table}`).hidden = !on; $(`#chart-${b.dataset.table}`).hidden = on;
    }));
    $$("[data-open]", main).forEach((r) => { r.addEventListener("click", () => openCustomer(r.dataset.open)); r.addEventListener("keydown", (e) => { if (e.key === "Enter") openCustomer(r.dataset.open); }); });
  }
  const seriesTable = (rows, bucket, name) => `<div class="table-wrap" style="max-height:240px;overflow:auto"><table><caption class="sr-only">${name}</caption><thead><tr><th>${bucket === "day" ? "Date" : bucket === "week" ? "Week starting" : "Month"}</th><th class="n">${name}</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${Charts.labelFor(r.t, bucket, true)}</td><td class="n">${fmt(r.v)}</td></tr>`).join("")}</tbody></table></div>`;

  /* ================================================================ COUNTER: scan the customer's code */
  let camera = null; // { stream, timer }
  function stopCamera() {
    if (!camera) return;
    clearInterval(camera.timer);
    camera.stream.getTracks().forEach((t) => t.stop());
    camera = null;
  }
  let jsqrPromise = null;
  async function getDecoder() {
    if ("BarcodeDetector" in window) {
      try {
        const formats = await BarcodeDetector.getSupportedFormats?.();
        if (!formats || formats.includes("qr_code")) {
          const bd = new BarcodeDetector({ formats: ["qr_code"] });
          return async (src) => (await bd.detect(src))[0]?.rawValue || null;
        }
      } catch { /* fall through to jsQR */ }
    }
    let jsQR;
    try { jsqrPromise ||= import("jsqr").then((m) => m.default || m); jsQR = await jsqrPromise; } catch { jsqrPromise = null; return null; }
    const cv = document.createElement("canvas"), ctx = cv.getContext("2d", { willReadFrequently: true });
    return async (src) => {
      const w = src.videoWidth || src.width, h = src.videoHeight || src.height;
      if (!w || !h) return null;
      const scale = Math.min(1, 720 / Math.max(w, h));
      cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
      ctx.drawImage(src, 0, 0, cv.width, cv.height);
      return jsQR(ctx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height)?.data || null;
    };
  }

  async function renderCafeQr(main, alive) {
    const br = S.branchId || (S.qrBranch && S.branches.some((b) => b.id === S.qrBranch) ? S.qrBranch : S.branches[0].id);
    const url = cafeScanUrl(br), b = S.branches.find((x) => x.id === br), L = S.settings.loyalty;
    main.innerHTML = pageHead("Café QR code", "Customers scan this code with their phone when they pay. Each scan adds 1 stamp straight away.",
      `<label class="field" style="flex-direction:row;align-items:center;gap:8px"><span class="label" style="white-space:nowrap">Branch</span>
        <select class="input" id="qrBranch" style="width:auto" ${S.branchId ? "disabled" : ""}>${S.branches.map((x) => `<option value="${x.id}" ${x.id === br ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>`) + `
      <div class="grid">
        <section class="panel span-5 qr-panel" aria-labelledby="qrT">
          <div class="panel-head"><div><h2 id="qrT">${esc(S.session.brand.name)}</h2><p>${esc(b?.name || "")} branch</p></div></div>
          <div class="qr-big" role="img" aria-label="QR code for ${esc(S.session.brand.name)}, ${esc(b?.name || "")}">${qrSvg(url, 260)}</div>
          <p class="qr-cap"><b>Scan for your stamp</b><span>${esc(offerLine(L))}</span></p>
          <div class="qr-actions" style="justify-content:center">
            <button class="btn btn-primary btn-sm" id="qrShow">${icon("eye")}Show full screen</button>
            <button class="btn btn-secondary btn-sm" data-dl="sticker">${icon("download")}Round sticker (PNG)</button>
            <button class="btn btn-secondary btn-sm" id="qrSign">${icon("download")}A4 sign</button>
            <button class="btn btn-ghost btn-sm" id="qrCopy">${icon("copy")}Copy link</button>
          </div>
          <div class="note" style="margin-top:14px">${icon("sparkle")}<span>Try it: scan this code with your own phone's camera. That's exactly what customers see.</span></div>
        </section>
        <section class="panel span-7" aria-labelledby="scansT">
          <div class="panel-head"><div><h2 id="scansT">Today's scans</h2><p>${S.branchId ? esc(branchLabel()) : "All branches"} · updates by itself</p></div></div>
          <div id="scanList" aria-live="polite"></div>
          <h3 style="margin:22px 0 8px">How it works</h3>
          <ol class="steps"><li><div><strong>Print the code once</strong><span>Round sticker (10 cm) or the A4 sign. Put it next to the till.</span></div></li>
            <li><div><strong>Customers scan it when they pay</strong><span>With the phone camera or the CupCoff app. Nothing for your team to do.</span></div></li>
            <li><div><strong>Rewards</strong><span>When a card is full, the customer taps "Use it now" and shows a green confirmation screen. Give them the ${esc(L.rewardName.toLowerCase())}.</span></div></li></ol>
          <p class="muted" style="font-size:13.5px;margin-top:10px">${Number(L.scanCooldownMinutes) ? `A second scan by the same customer within ${L.scanCooldownMinutes} minutes doesn't add a stamp.` : "There's no waiting time between scans."} <a href="#shop-settings" data-settings-tab="loyalty">Change it</a></p>
        </section>
      </div>`;
    const list = $("#scanList");
    const draw = async () => {
      const scans = await api.todaysScans(S.branchId || "");
      if (!alive() || !document.contains(list)) return false;
      list.innerHTML = scans.length ? `<ul class="activity">${scans.map((e) => `<li><span class="act-icon ${e.type === "reward" ? "reward" : ""}">${icon(e.type === "reward" ? "gift" : "stamp")}</span>
          <div class="act-main"><strong>${e.type === "reward" ? "Reward used" : "Stamp added"}</strong><span><button class="linkbtn" data-customer="${e.customerId}">${esc(e.customerName)}</button> <span class="num">${e.customerId}</span></span></div>
          <div class="act-where"><span class="branch-dot" style="background:${branchColor(e.branchId)}"></span>${esc(e.branch)}<br>${fmtTime(e.at)}</div></li>`).join("")}</ul>`
        : `<div class="empty">${illus("latte")}<strong>No scans yet today</strong><p>They appear here as soon as customers scan your code.</p></div>`;
      bindCustomerLinks(list);
      return true;
    };
    await draw();
    const timer = setInterval(async () => { if (!(await draw())) clearInterval(timer); }, 10000);
    $("#qrBranch").addEventListener("change", (e) => { S.qrBranch = e.target.value; route(); });
    $("[data-dl]", main).addEventListener("click", () => { api.completeSetupStep("sign"); downloadSign(br, "sticker"); });
    $("#qrSign").addEventListener("click", () => openSign(br));
    $("#qrCopy").addEventListener("click", async () => { try { await navigator.clipboard.writeText(url); toast("Link copied"); } catch { toast("Copying isn't allowed here.", "error"); } });
    $$("[data-settings-tab]", main).forEach((a) => a.addEventListener("click", () => (S.settingsTab = a.dataset.settingsTab)));
    $("#qrShow").addEventListener("click", () => overlay({ kind: "dialog", wide: true, title: S.session.brand.name, desc: `${esc(b?.name || "")} branch. Keep this open on a phone or tablet at the till.`,
      body: `<div class="qr-full">${qrSvg(url, 420)}<p><b>Scan for your stamp</b><span>${esc(offerLine(L))}</span></p></div>` }));
  }

  /* ================================================================ INSIGHTS: what customers prefer */
  const RANGES = [["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"], ["custom", "Custom range"]];
  function rangeToolbar(from, to) {
    const A = S.analytics;
    return `<div class="toolbar" role="group" aria-label="Date range">
      <div class="seg">${RANGES.map(([v, l]) => `<button type="button" data-range="${v}" aria-pressed="${A.range === v}">${l}</button>`).join("")}</div>
      <form class="date-range" id="customRange" ${A.range === "custom" ? "" : "hidden"}>
        <label class="sr-only" for="rFrom">From</label><input class="input" type="date" id="rFrom" value="${isoDay(from)}" max="${isoDay(today0())}">
        <span class="muted">to</span><label class="sr-only" for="rTo">To</label><input class="input" type="date" id="rTo" value="${isoDay(to)}" max="${isoDay(today0())}">
        <button class="btn btn-primary btn-sm" type="submit">Apply</button></form></div>`;
  }
  function bindRangeToolbar(main) {
    const A = S.analytics;
    $$("[data-range]", main).forEach((b) => b.addEventListener("click", () => {
      A.range = b.dataset.range;
      if (A.range === "custom") { $$("[data-range]", main).forEach((x) => x.setAttribute("aria-pressed", x === b)); $("#customRange").hidden = false; $("#rFrom").focus(); return; }
      route();
    }));
    $("#customRange").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = $("#rFrom").value, t = $("#rTo").value;
      if (!f || !t) { toast("Pick both a start and an end date.", "error"); return; }
      if (f > t) { toast("The start date must be before the end date.", "error"); return; }
      A.range = "custom"; A.from = f + "T00:00"; A.to = t + "T00:00"; route();
    });
  }
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const pctTxt = (x) => `${Math.round(x * 100)}%`;
  const changeChip = (ch) => ch === null ? `<span class="delta flat">New</span>` : Math.abs(ch) < 0.05 ? `<span class="delta flat">Steady</span>` : `<span class="delta ${ch > 0 ? "up" : "down"}">${icon(ch > 0 ? "up" : "down")}${ch > 0 ? "+" : ""}${Math.round(ch * 100)}%</span>`;

  async function renderInsights(main, alive) {
    const { from, to } = rangeDates();
    const d = await api.getInsights({ branchId: S.branchId, from, to });
    if (!alive()) return;
    const span = Math.round((to - from) / DAY) + 1;
    let best = { v: -1 }, quiet = { v: Infinity };
    d.heat.forEach((row, r) => row.forEach((v, c) => { if (v > best.v) best = { v, r, c }; if (r < 5 && c >= 1 && c <= 12 && v < quiet.v) quiet = { v, r, c }; }));
    const hourTxt = (c) => `${String(8 + c).padStart(2, "0")}:00`;
    const top = d.top[0], rise = d.rising[0], fall = d.falling[0], lowRepeat = d.repeat.filter((r) => !r.food)[0];
    const oat = d.milks.find((m) => m.name === "Oat");
    const loved = [...d.repeat].sort((a, b) => b.rate - a.rate).slice(0, 3);
    const ideas = [
      rise && { art: "latte", t: `${rise.name} orders are up ${Math.round(rise.change * 100)}% on the previous ${span} days.`, a: "Make sure every branch has what it needs for it, and think about featuring it." },
      fall && { art: "milk", t: `${fall.name} is down ${Math.round(-fall.change * 100)}%.`, a: "If it's seasonal, you could pause it and free up space for a winter special." },
      lowRepeat && { art: "pourover", t: `Only ${pctTxt(lowRepeat.rate)} of the ${lowRepeat.triers} customers who tried ${lowRepeat.name} ordered it again.`, a: "Ask a few regulars what they thought, or rework the recipe." },
      oat && oat.share > 0.15 && { art: "milk", t: `${pctTxt(oat.share)} of milk drinks are made with oat milk${oat.share - oat.prevShare > 0.02 ? `, up from ${pctTxt(oat.prevShare)}` : ""}.`, a: "Keep enough in stock at every branch." },
      quiet.v !== Infinity && { art: "machine", t: `${DAYS[quiet.r]}s around ${hourTxt(quiet.c)} are your quietest weekday hour.`, a: "A good slot for a double-stamp hour to bring people in." },
    ].filter(Boolean).slice(0, 4);

    main.innerHTML = pageHead("Insights", `What customers order at ${esc(S.branchId ? branchLabel() : "all branches")}, ${fmtDate(from, { day: "numeric", month: "short" })} – ${fmtDate(to)}. Based on the items your team taps when they scan a customer.`) +
      rangeToolbar(from, to) + (d.visits ? `
      <div class="kpis">
        <div class="kpi"><div class="kpi-label">Most ordered drink</div><div class="kpi-value kpi-text">${esc(top?.name || "–")}</div><span class="delta flat">${top ? `${pctTxt(top.share)} of drinks` : ""}</span></div>
        <div class="kpi"><div class="kpi-label">Fastest growing</div><div class="kpi-value kpi-text">${esc(rise?.name || "Nothing yet")}</div>${rise ? changeChip(rise.change) : `<span class="delta flat">Needs more data</span>`}</div>
        <div class="kpi"><div class="kpi-label">Biggest drop</div><div class="kpi-value kpi-text">${esc(fall?.name || "None")}</div>${fall ? changeChip(fall.change) : `<span class="delta flat">Nothing fell</span>`}</div>
        <div class="kpi"><div class="kpi-label">Busiest hour</div><div class="kpi-value kpi-text">${best.v > 0 ? `${DAYS[best.r].slice(0, 3)} ${hourTxt(best.c)}` : "–"}</div><span class="delta flat">${best.v > 0 ? plural(best.v, "visit") : ""}</span></div>
      </div>
      <div class="grid">
        <section class="panel span-12 ideas" aria-labelledby="ideasT">
          <div class="panel-head"><div><h2 id="ideasT">Ideas to try</h2><p>Spotted in the data. Talk them through with your team before acting on them.</p></div></div>
          <div class="ideas-grid">${ideas.map((i) => `<div class="idea">${illus(i.art)}<div><strong>${esc(i.t)}</strong><p>${esc(i.a)}</p></div></div>`).join("")}</div>
        </section>
        <section class="panel span-7" aria-labelledby="topT">
          <div class="panel-head"><div><h3 id="topT">What customers order</h3><p>Share of ${fmt(d.drinkTotal)} drinks, compared with the previous ${span} days</p></div></div>
          <div class="rank">${d.top.map((i, n) => `<div class="rank-row"><span class="rank-n">${n + 1}</span><span class="rank-name">${esc(i.name)}</span><span class="hbar-track"><span class="hbar-fill" style="width:${(i.share / d.top[0].share) * 100}%;background:var(--wine)"></span></span><span class="rank-val">${pctTxt(i.share)}</span>${changeChip(i.change)}</div>`).join("")}</div>
        </section>
        <section class="panel span-5" aria-labelledby="mvT">
          <div class="panel-head"><div><h3 id="mvT">Rising and falling</h3><p>Biggest changes in orders</p></div></div>
          <div class="movers">
            <div><span class="label">More popular</span>${d.rising.length ? d.rising.map((i) => `<div class="mover"><span>${esc(i.name)}</span>${changeChip(i.change)}</div>`).join("") : `<p class="muted">No clear risers yet.</p>`}</div>
            <div><span class="label">Less popular</span>${d.falling.length ? d.falling.map((i) => `<div class="mover"><span>${esc(i.name)}</span>${changeChip(i.change)}</div>`).join("") : `<p class="muted">Nothing is falling.</p>`}</div>
          </div>
        </section>
        <section class="panel span-6" aria-labelledby="rpT">
          <div class="panel-head"><div><h3 id="rpT">Tried, but not ordered again</h3><p>Of the customers who tried an item, how many came back for it</p></div></div>
          <div class="rank">${d.repeat.slice(0, 5).map((r) => `<div class="rank-row rank-row-3"><span class="rank-name">${esc(r.name)}</span><span class="hbar-track"><span class="hbar-fill" style="width:${r.rate * 100}%;background:${r.rate < 0.4 ? "var(--crit)" : "var(--sky-deep)"}"></span></span><span class="rank-val">${pctTxt(r.rate)} <span class="muted">of ${r.triers}</span></span></div>`).join("")}</div>
          <p class="muted" style="font-size:13.5px;margin-top:12px">Most loved: ${loved.map((r) => `<b>${esc(r.name)}</b> (${pctTxt(r.rate)} reorder)`).join(", ")}.</p>
        </section>
        <section class="panel span-6" aria-labelledby="mkT">
          <div class="panel-head"><div><h3 id="mkT">Milk choices</h3><p>Across all milk drinks</p></div>${illus("milk", "panel-art")}</div>
          <div class="rank">${d.milks.map((m) => `<div class="rank-row rank-row-3"><span class="rank-name">${esc(m.name)}</span><span class="hbar-track"><span class="hbar-fill" style="width:${m.share * 100}%;background:var(--wine)"></span></span><span class="rank-val">${pctTxt(m.share)} <span class="muted">${m.share - m.prevShare >= 0.01 ? "▲" : m.share - m.prevShare <= -0.01 ? "▼" : ""}</span></span></div>`).join("")}</div>
          <p class="muted" style="font-size:13.5px;margin-top:12px">${pctTxt(d.foodAttach.cur)} of visits include food (${pctTxt(d.foodAttach.prev)} before). Top food: ${d.food.slice(0, 3).map((f) => `${esc(f.name)} (${fmt(f.count)})`).join(", ")}.</p>
        </section>
        <section class="panel span-12" aria-labelledby="hmT">
          <div class="panel-head"><div><h3 id="hmT">When customers come</h3><p>Recorded visits by day and hour</p></div><button class="btn btn-ghost btn-sm" data-table="heat" aria-pressed="false" aria-controls="tbl-heat">Show table</button></div>
          <div id="chart-heat"></div>
          <div id="tbl-heat" hidden><div class="table-wrap" style="max-height:300px;overflow:auto"><table><thead><tr><th>Day</th>${d.heat[0].map((_, c) => `<th class="n">${hourTxt(c)}</th>`).join("")}</tr></thead><tbody>${d.heat.map((row, r) => `<tr><td>${DAYS[r]}</td>${row.map((v) => `<td class="n">${v}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>
        </section>
        <section class="panel span-12" aria-labelledby="vpT">
          <div class="panel-head"><div><h3 id="vpT">VIPs compared with everyone</h3><p>Top drinks for your ${plural(d.vip.count, "VIP customer")} and for all customers</p></div><a class="btn btn-ghost btn-sm" href="#vip">VIP criteria</a></div>
          <div class="vs">${[["VIP customers", d.vip.top], ["Everyone", d.everyone]].map(([label, list]) => `<div><span class="label">${label}</span>${list.map((i, n) => `<div class="rank-row rank-row-3"><span class="rank-name">${n + 1}. ${esc(i.name)}</span><span class="hbar-track"><span class="hbar-fill" style="width:${i.share * 300}%;max-width:100%;background:var(--wine)"></span></span><span class="rank-val">${pctTxt(i.share)}</span></div>`).join("")}</div>`).join("")}</div>
        </section>
      </div>` : `<div class="panel empty">${illus("croissant")}<strong>No orders recorded in this period</strong><p>Insights fill in as your team scans customers and taps what they ordered.</p></div>`);
    bindRangeToolbar(main);
    if (!d.visits) return;
    Charts.heatmap($("#chart-heat", main), { values: d.heat, rows: DAYS.map((x) => x.slice(0, 3)), rowsLong: DAYS, cols: d.heat[0].map((_, c) => hourTxt(c)), name: "Visits" });
    $$("[data-table]", main).forEach((b) => b.addEventListener("click", () => {
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", on); b.textContent = on ? "Show chart" : "Show table";
      $(`#tbl-${b.dataset.table}`).hidden = !on; $(`#chart-${b.dataset.table}`).hidden = on;
    }));
  }

  /* ================================================================ CUSTOMERS */
  const STATUS = {
    new: { label: "New", cls: "info", icon: "sparkle", hint: "Joined in the last 14 days" },
    active: { label: "Active", cls: "good", icon: "check", hint: "Visited in the last 30 days" },
    "at-risk": { label: "At risk", cls: "warn", icon: "clock", hint: "Last visit 31 to 60 days ago" },
    inactive: { label: "Inactive", cls: "neutral", icon: "pause", hint: "No visit for over 60 days" },
  };
  const statusBadge = (s) => `<span class="badge ${STATUS[s].cls}" title="${STATUS[s].hint}">${icon(STATUS[s].icon)}${STATUS[s].label}</span>`;
  const miniStamps = (bal, per) => `<span class="mini-stamps" aria-hidden="true">${Array.from({ length: per }, (_, i) => `<i class="${i < bal ? "on" : ""}"></i>`).join("")}</span>`;

  async function renderCustomers(main, alive) {
    const all = await api.listCustomers({ branchId: S.branchId });
    if (!alive()) return;
    const C = S.cust, per = S.settings.loyalty.stampsPerReward;
    main.innerHTML = pageHead("All customers", `Everyone in the ${esc(S.session.brand.name)} loyalty program${S.branchId ? ` who has visited ${esc(branchLabel())}` : ""}. Contact details stay private to each customer.`,
      `<button class="btn btn-secondary" id="exportCsv">${icon("download")}Export CSV</button>`) + `
      <div class="toolbar">
        <label class="search"><span class="sr-only">Search customers</span>${icon("search")}<input class="input" id="custSearch" type="search" placeholder="Search by name or ID" value="${esc(C.q)}" autocomplete="off"></label>
        <label class="sr-only" for="statusFilter">Status</label>
        <select class="input" id="statusFilter" style="width:auto">
          <option value="all">All statuses</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${C.status === k ? "selected" : ""}>${v.label}</option>`).join("")}
        </select>
        <span class="spacer"></span><span class="muted" id="custCount" aria-live="polite"></span>
      </div>
      <div id="custTable"></div>`;
    const cols = [
      { key: "displayName", label: "Customer" }, { key: "registeredAt", label: "Registered" }, { key: "stampBalance", label: "Stamp balance", n: true },
      { key: "totalVisits", label: "Visits", n: true }, { key: "rewardsRedeemed", label: "Rewards", n: true }, { key: "lastActivityAt", label: "Last activity" }, { key: "status", label: "Status" },
    ];
    const filtered = () => {
      const q = C.q.trim().toLowerCase();
      let rows = all.filter((c) => (C.status === "all" || c.status === C.status) && (!q || c.displayName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)));
      const { key, dir } = C.sort, m = dir === "asc" ? 1 : -1;
      rows.sort((a, b) => (a[key] > b[key] ? m : a[key] < b[key] ? -m : 0));
      return rows;
    };
    const PAGE = 12;
    const draw = () => {
      const rows = filtered(), pages = Math.max(1, Math.ceil(rows.length / PAGE));
      C.page = Math.min(C.page, pages);
      const slice = rows.slice((C.page - 1) * PAGE, C.page * PAGE);
      $("#custCount").textContent = `${plural(rows.length, "customer")}`;
      $("#custTable").innerHTML = rows.length ? `<div class="table-wrap"><table><caption class="sr-only">Loyalty customers, sortable</caption><thead><tr>
        ${cols.map((c) => `<th class="${c.n ? "n" : ""}" ${C.sort.key === c.key ? `aria-sort="${C.sort.dir === "asc" ? "ascending" : "descending"}"` : ""}><button class="sort-btn" data-sort="${c.key}">${c.label}${icon(C.sort.key === c.key ? "up" : "sort")}</button></th>`).join("")}
        </tr></thead><tbody>${slice.map((c) => `<tr class="clickable" tabindex="0" data-open="${c.id}" aria-label="Open ${esc(c.displayName)}">
          <td class="cust-cell"><strong>${esc(c.displayName)}</strong><span>${c.id} · ${esc(c.homeBranch)}</span></td>
          <td>${fmtDate(c.registeredAt)}</td>
          <td class="n">${c.stampBalance >= per ? `<span class="badge dark">${icon("gift")}Reward ready</span>` : `${c.stampBalance}/${per}${miniStamps(c.stampBalance, per)}`}</td>
          <td class="n">${fmt(c.totalVisits)}</td><td class="n">${fmt(c.rewardsRedeemed)}</td>
          <td title="${fmtDateTime(c.lastActivityAt)}">${rel(c.lastActivityAt)}</td><td>${statusBadge(c.status)}</td></tr>`).join("")}</tbody></table></div>
        <div class="pager"><span>Showing ${(C.page - 1) * PAGE + 1}–${(C.page - 1) * PAGE + slice.length} of ${fmt(rows.length)}</span>
          <div><button class="btn btn-secondary btn-sm" data-page="-1" ${C.page === 1 ? "disabled" : ""}>Previous</button><button class="btn btn-secondary btn-sm" data-page="1" ${C.page === pages ? "disabled" : ""}>Next</button></div></div>`
        : !all.length ? `<div class="panel empty">${illus("latte")}<strong>No customers yet</strong><p>Customers appear here after their first scan at the till.</p><a class="btn btn-primary" style="margin-top:14px" href="#counter">${icon("qr")}Scan a customer</a></div>`
        : `<div class="panel empty">${illus("latte")}<strong>No customers match</strong><p>Try another name or ID, or set the status filter to All statuses.</p><button class="btn btn-secondary" style="margin-top:14px" id="clearFilters">Clear filters</button></div>`;
      $$("[data-sort]").forEach((b) => b.addEventListener("click", () => {
        const k = b.dataset.sort;
        C.sort = { key: k, dir: C.sort.key === k && C.sort.dir === "desc" ? "asc" : "desc" };
        draw(); $(`[data-sort="${k}"]`)?.focus();
      }));
      $$("[data-page]").forEach((b) => b.addEventListener("click", () => { C.page += Number(b.dataset.page); draw(); }));
      $$("[data-open]").forEach((r) => { r.addEventListener("click", () => openCustomer(r.dataset.open)); r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCustomer(r.dataset.open); } }); });
      $("#clearFilters")?.addEventListener("click", () => { C.q = ""; C.status = "all"; $("#custSearch").value = ""; $("#statusFilter").value = "all"; draw(); });
    };
    let t;
    $("#custSearch").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { C.q = e.target.value; C.page = 1; draw(); }, 120); });
    $("#statusFilter").addEventListener("change", (e) => { C.status = e.target.value; C.page = 1; draw(); });
    $("#exportCsv").addEventListener("click", () => {
      const rows = filtered();
      saveFile(`cupcoff-customers-${isoDay(new Date())}.csv`, csv([["Customer ID", "Display name", "Home branch", "Registered", "Stamp balance", "Visits", "Rewards redeemed", "Last activity", "Status"],
        ...rows.map((c) => [c.id, c.displayName, c.homeBranch, isoDay(c.registeredAt), c.stampBalance, c.totalVisits, c.rewardsRedeemed, c.lastActivityAt, STATUS[c.status].label])]), "text/csv");
    });
    draw();
  }

  async function openCustomer(id) {
    const c = await api.getCustomer(id);
    const per = S.settings.loyalty.stampsPerReward;
    drawer({
      title: esc(c.displayName), desc: `${c.id} · Home branch: ${esc(c.homeBranch)}`,
      body: `<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px">${statusBadge(c.status)}<span class="muted" style="font-size:14px">Member since ${fmtDate(c.registeredAt)}</span></div>
        <div class="stampcard" style="margin-bottom:16px;border:1px solid var(--line)"><div class="stampcard-top"><strong>Current card</strong><span>${Math.min(c.stampBalance, per)} of ${per} stamps</span></div>${stampRow(per, Math.min(c.stampBalance, per))}</div>
        <div class="kv">
          <div><span>Stamp balance</span><b>${fmt(c.stampBalance)}</b></div><div><span>Total visits</span><b>${fmt(c.totalVisits)}</b></div>
          <div><span>Rewards redeemed</span><b>${fmt(c.rewardsRedeemed)}</b></div><div><span>Last activity</span><b style="font-size:16px">${rel(c.lastActivityAt)}</b></div>
        </div>
        ${c.favorites.items.length ? `<h3 style="margin:22px 0 8px">Usually orders</h3><div class="usual-row">${c.favorites.items.map((i) => `<span class="chip static">${esc(i.name)} <span class="muted">×${i.count}</span></span>`).join("")}</div>
          <p class="muted" style="font-size:13.5px;margin-top:8px">${[c.favorites.milk && `Prefers ${c.favorites.milk.toLowerCase()} milk`, c.favorites.timeOfDay && `usually comes ${c.favorites.timeOfDay.toLowerCase()}`].filter(Boolean).join(", ")}.</p>` : ""}
        <div class="note" style="margin-top:16px">${icon("shield")}<span>Phone numbers and emails aren't shown. Customers manage their own contact details in the CupCoff app.</span></div>
        ${c.specialRewards.length ? `<h3 style="margin:22px 0 8px">Special rewards</h3><ul class="timeline">${c.specialRewards.map((s) => `<li>${icon("sparkle")}<span><b>${esc(s.name)}</b>${s.expiresAt ? ` <span class="muted">valid until ${fmtDate(s.expiresAt)}</span>` : ""}</span><time>${fmtDate(s.createdAt)}</time></li>`).join("")}</ul>` : ""}
        <h3 style="margin:22px 0 8px">Loyalty history</h3>
        <ul class="timeline">${c.history.map((e) => `<li>${icon((ACT[e.type] || ACT.stamp).icon)}<span>${(ACT[e.type] || ACT.stamp).label}${e.type === "stamp" ? ` <b>+${e.qty}</b>` : e.type === "special" ? `: ${esc(e.label)}` : ""} <span class="muted">at ${esc(e.branch)}</span>${e.itemNames?.length ? `<br><span class="muted" style="font-size:13px">${esc(e.itemNames.join(", "))}</span>` : ""}</span><time datetime="${e.at}">${fmtDateTime(e.at)}</time></li>`).join("")}</ul>`,
    });
  }

  /* ================================================================ VIP */
  async function renderVip(main, alive) {
    const crit = { ...S.settings.vipCriteria, ...(S.vipCriteria || {}) };
    const [list, specials] = await Promise.all([api.getVipCustomers({ branchId: S.branchId, ...crit }), api.listSpecialRewards()]);
    if (!alive()) return;
    S.vipSelected = new Set([...S.vipSelected].filter((id) => list.some((c) => c.id === id)));
    const numIn = (id, v, min, max) => `<input class="input num" style="width:76px;display:inline-block;min-height:38px;padding:6px 10px" type="number" id="${id}" value="${v}" min="${min}" max="${max}" inputmode="numeric">`;
    main.innerHTML = pageHead("VIP customers", "Your most frequent loyalty customers. Set what counts as VIP, then thank them with a special reward.", `<span class="demo-tag">${icon("flask")}Demo feature</span>`) + `
      <div class="note info" style="margin-bottom:20px">${icon("info")}<span>The backend doesn't have VIP segments yet, so this list is worked out in the browser from recorded visits. Special rewards are saved for this session only, and customers aren't notified.</span></div>
      <section class="panel" aria-labelledby="critTitle" style="margin-bottom:20px">
        <div class="panel-head"><div><h2 id="critTitle">VIP criteria</h2><p>Customers who match appear below</p></div></div>
        <form id="critForm" class="vip-sentence">
          <span>A customer is VIP if they made at least</span>
          <label class="sr-only" for="cVisits">Minimum visits</label>${numIn("cVisits", crit.minVisits, 1, 60)}
          <span>visits in the last</span>
          <label class="sr-only" for="cPeriod">Period</label><select class="input" id="cPeriod" style="width:auto;display:inline-block;min-height:38px;padding:6px 10px">${[30, 60, 90].map((d) => `<option value="${d}" ${crit.periodDays === d ? "selected" : ""}>${d} days</option>`).join("")}</select>
          <label class="sr-only" for="cMatch">Combine with</label><select class="input" id="cMatch" style="width:auto;display:inline-block;min-height:38px;padding:6px 10px"><option value="all" ${crit.match === "all" ? "selected" : ""}>and</option><option value="any" ${crit.match === "any" ? "selected" : ""}>or</option></select>
          <span>redeemed at least</span>
          <label class="sr-only" for="cRewards">Minimum rewards redeemed</label>${numIn("cRewards", crit.minRewards, 0, 50)}
          <span>rewards in total.</span>
          <span class="vip-actions"><button class="btn btn-primary btn-sm" type="submit">Apply</button>${isOwner() ? `<button class="btn btn-ghost btn-sm" type="button" id="saveCrit">Save as default</button>` : ""}</span>
        </form>
      </section>
      <section class="panel" aria-labelledby="vipList">
        <div class="panel-head"><div><h2 id="vipList">${plural(list.length, "VIP customer")}</h2><p>${S.branchId ? `Who visited ${esc(branchLabel())}` : "Across all branches"}, sorted by visits in the period</p></div>
          <button class="btn btn-primary" id="assignBtn" ${S.vipSelected.size ? "" : "disabled"}>${icon("gift")}Assign special reward${S.vipSelected.size ? ` (${S.vipSelected.size})` : ""}</button></div>
        ${list.length ? `<div class="table-wrap"><table><caption class="sr-only">VIP customers</caption><thead><tr>
          <th style="width:44px"><input type="checkbox" id="selAll" aria-label="Select all VIP customers" ${S.vipSelected.size === list.length ? "checked" : ""}></th>
          <th>Customer</th><th class="n">Visits (${crit.periodDays} days)</th><th class="n">Rewards</th><th class="n hide-sm">Stamp balance</th><th class="hide-sm">Last activity</th><th></th></tr></thead>
          <tbody>${list.map((c) => `<tr><td><input type="checkbox" data-sel="${c.id}" aria-label="Select ${esc(c.displayName)}" ${S.vipSelected.has(c.id) ? "checked" : ""}></td>
            <td class="cust-cell"><strong>${esc(c.displayName)}</strong><span>${c.id} · ${esc(c.homeBranch)}</span></td>
            <td class="n">${fmt(c.periodVisits)}</td><td class="n">${fmt(c.rewardsRedeemed)}</td><td class="n hide-sm">${c.stampBalance}</td><td class="hide-sm">${rel(c.lastActivityAt)}</td>
            <td><button class="btn btn-ghost btn-sm" data-customer="${c.id}">History</button></td></tr>`).join("")}</tbody></table></div>`
          : `<div class="empty">${illus("takeaway")}<strong>No one matches yet</strong><p>Lower the number of visits or rewards, or switch "and" to "or".</p></div>`}
      </section>
      ${specials.length ? `<section class="panel" style="margin-top:20px" aria-labelledby="spTitle"><div class="panel-head"><div><h2 id="spTitle">Special rewards assigned</h2><p>This session</p></div></div>
        <div class="list-rows">${specials.slice().reverse().map((s) => `<div><span class="act-icon special">${icon("sparkle")}</span><div style="flex:1"><strong>${esc(s.name)}</strong><div class="muted" style="font-size:14px">${plural(s.customerIds.length, "customer")}${s.expiresAt ? `, valid until ${fmtDate(s.expiresAt)}` : ""}${s.note ? `. ${esc(s.note)}` : ""}</div></div><span class="muted" style="font-size:13px">${fmtDateTime(s.createdAt)}</span></div>`).join("")}</div></section>` : ""}`;
    const readCrit = () => ({ minVisits: Math.max(1, parseInt($("#cVisits").value, 10) || 1), periodDays: Number($("#cPeriod").value), minRewards: Math.max(0, parseInt($("#cRewards").value, 10) || 0), match: $("#cMatch").value });
    $("#critForm").addEventListener("submit", (e) => { e.preventDefault(); S.vipCriteria = readCrit(); route(); });
    $("#saveCrit")?.addEventListener("click", async () => { S.settings.vipCriteria = await api.saveVipCriteria(readCrit()); S.vipCriteria = null; toast("VIP criteria saved as the default"); route(); });
    const updateBtn = () => { const b = $("#assignBtn"); b.disabled = !S.vipSelected.size; b.innerHTML = `${icon("gift")}Assign special reward${S.vipSelected.size ? ` (${S.vipSelected.size})` : ""}`; };
    $$("[data-sel]", main).forEach((cb) => cb.addEventListener("change", () => { cb.checked ? S.vipSelected.add(cb.dataset.sel) : S.vipSelected.delete(cb.dataset.sel); $("#selAll").checked = S.vipSelected.size === list.length; updateBtn(); }));
    $("#selAll")?.addEventListener("change", (e) => { list.forEach((c) => e.target.checked ? S.vipSelected.add(c.id) : S.vipSelected.delete(c.id)); $$("[data-sel]", main).forEach((cb) => (cb.checked = e.target.checked)); updateBtn(); });
    $("#assignBtn").addEventListener("click", () => openAssignReward(list.filter((c) => S.vipSelected.has(c.id))));
    bindCustomerLinks(main);
  }
  function openAssignReward(customers) {
    const presets = ["Free pastry with any drink", "Double stamps for a week", "Free drink of choice", "Free size upgrade"];
    const in30 = isoDay(new Date(Date.now() + 30 * DAY));
    dialog({
      title: "Assign a special reward",
      desc: `For ${customers.length === 1 ? esc(customers[0].displayName) : plural(customers.length, "VIP customer")}. In the live product it appears in their CupCoff app.`,
      body: `<form id="srForm" novalidate><div class="form-grid">
        <div class="field full"><label for="srName">Reward</label><input class="input" id="srName" name="name" list="srPresets" required maxlength="60" placeholder="e.g. Free pastry with any drink"><datalist id="srPresets">${presets.map((p) => `<option value="${p}">`).join("")}</datalist>
          <span class="hint">Pick a suggestion or type your own.</span></div>
        <div class="field"><label for="srExp">Valid until</label><input class="input" type="date" id="srExp" name="expiresAt" value="${in30}" min="${isoDay(new Date())}"></div>
        <div class="field"><label for="srNote">Note for staff <span class="muted" style="font-weight:400">(optional)</span></label><input class="input" id="srNote" name="note" maxlength="80" placeholder="e.g. Thanks for a great year"></div>
      </div>
      <div class="note info" style="margin-top:16px">${icon("flask")}<span>Demo feature: the reward is recorded in this session only and no message is sent.</span></div>
      <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" type="submit">${icon("gift")}Assign reward</button></div></form>`,
      onOpen: ({ el, close }) => {
        const f = $("#srForm", el);
        f.addEventListener("submit", async (e) => {
          e.preventDefault();
          try {
            await busy(f.querySelector("[type=submit]"), () => api.assignSpecialReward({ customerIds: customers.map((c) => c.id), name: f.name.value, note: f.note.value, expiresAt: f.expiresAt.value ? f.expiresAt.value + "T23:59" : null }));
            close(); S.vipSelected.clear(); toast(`Special reward assigned to ${plural(customers.length, "customer")}`); route();
          } catch (err) { f.name.setAttribute("aria-invalid", "true"); formError(f, err.message); }
        });
      },
    });
  }

  /* ================================================================ SUBSCRIPTION */
  async function renderSubscription(main, alive) {
    const sub = await api.getSubscription();
    if (!alive()) return;
    const P_ = sub.pricing;
    const daysLeft = Math.max(0, Math.ceil((new Date(sub.renewsAt) - Date.now()) / DAY));
    main.innerHTML = pageHead("Subscription", "One fixed monthly price with every feature included. Branches after the first are discounted.", `<span class="demo-tag">${icon("flask")}Simulated billing</span>`) + `
      <div class="grid">
        <section class="panel span-7" aria-labelledby="curPlan">
          <div class="panel-head"><div><h2 id="curPlan">Current plan</h2><p>Charged automatically each month, in advance</p></div>${subBadge(sub)}</div>
          <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><span class="plan-price">${money(sub.monthlyTotal)}</span><span class="muted">per month for ${plural(sub.branchCount, "branch", "branches")}</span></div>
          <div class="table-wrap" style="margin-top:18px"><table><thead><tr><th>Item</th><th class="n">Qty</th><th class="n">Price per month</th><th class="n">Total</th></tr></thead><tbody>
            ${sub.lines.map((l) => `<tr><td>${l.label}</td><td class="n">${l.qty}</td><td class="n">${money(l.unit)}</td><td class="n">${money(l.qty * l.unit)}</td></tr>`).join("")}
            <tr><td><b>Monthly total</b></td><td></td><td></td><td class="n"><b>${money(sub.monthlyTotal)}</b></td></tr></tbody></table></div>
          <dl class="sub-dl">
            <div><dt>Billing period</dt><dd>Monthly</dd></div>
            <div><dt>Current period</dt><dd>${fmtDate(sub.currentPeriodStart, { day: "numeric", month: "short" })} – ${fmtDate(sub.renewsAt, { day: "numeric", month: "short" })}</dd></div>
            <div><dt>${sub.cancelAtPeriodEnd ? "Access ends" : sub.status === "trial" ? "First payment" : "Next payment"}</dt><dd>${fmtDate(sub.renewsAt)} <span class="muted">(${plural(daysLeft, "day")})</span></dd></div>
            <div><dt>Payment method</dt><dd>${sub.paymentMethod ? `${sub.paymentMethod.label} ending ${sub.paymentMethod.last4}` : "Not added yet"}</dd></div>
          </dl>
          <div class="form-actions" style="justify-content:flex-start">
            <button class="btn btn-secondary" id="cardBtn" ${isOwner() ? "" : "disabled"}>${icon("card")}${sub.paymentMethod ? "Change payment card" : "Add a payment card"}</button>
            ${isOwner() ? `<button class="btn ${sub.cancelAtPeriodEnd ? "btn-primary" : "btn-danger"}" id="cancelBtn">${sub.cancelAtPeriodEnd ? "Keep my subscription" : "Cancel at end of period"}</button>` : ""}
          </div>
          ${isOwner() ? "" : `<p class="muted" style="font-size:14px;margin-top:10px">Only the owner can change billing.</p>`}
        </section>
        <section class="panel span-5" aria-labelledby="trialT">
          <div class="panel-head"><div><h2 id="trialT">Free trial</h2><p>Every new café starts with ${P_.trialDays} days free</p></div>${sub.status === "trial" ? `<span class="badge info">${icon("clock")}${plural(sub.trialDaysLeft, "day")} left</span>` : `<span class="badge neutral">${icon("check")}Completed</span>`}</div>
          <ol class="steps">
            <li><div><strong>Trial started</strong><span>${fmtDate(sub.trialStartedAt)}</span></div></li>
            <li><div><strong>${sub.status === "trial" ? "Trial ends, first payment" : "Trial ended, first payment"}</strong><span>${fmtDate(sub.trialEndedAt || sub.trialEndsAt)}${sub.status === "trial" ? `, ${money(sub.monthlyTotal)}. Add a card before then.` : ""}</span></div></li>
            <li><div><strong>Next automatic payment</strong><span>${sub.cancelAtPeriodEnd ? "None. Your subscription ends on " + fmtDate(sub.renewsAt) : fmtDate(sub.renewsAt) + ", " + money(sub.monthlyTotal)}</span></div></li>
          </ol>
          <div class="note" style="margin-top:18px">${icon("shield")}<span>Payments run through Armenian banks and payment systems. CupCoff never sees or stores full card numbers. If a payment fails we notify you, retry, and our team gets in touch.</span></div>
        </section>
        <section class="span-12" aria-labelledby="plansT">
          <h2 id="plansT" style="margin:8px 0 14px">Available plans</h2>
          <div class="plans">
            <div class="plan current"><div style="display:flex;justify-content:space-between;align-items:center"><h3>CupCoff monthly</h3><span class="badge dark">Your plan</span></div>
              <div class="plan-price">${money(P_.firstBranch)} <small>per month, first branch</small></div>
              <ul>${P_.included.map((f) => `<li>${icon("check")}<span>${f}</span></li>`).join("")}</ul></div>
            <div class="plan"><h3>Additional branches</h3>
              <div class="plan-price">${money(P_.additionalBranch)} <small>per branch, per month</small></div>
              <ul><li>${icon("check")}<span>Same features as the first branch</span></li><li>${icon("check")}<span>Its own QR poster and branch analytics</span></li><li>${icon("check")}<span>Customers' cards work at every branch</span></li></ul>
              ${isOwner() ? `<button class="btn btn-secondary" id="planAddBranch">${icon("plus")}Add a branch</button>` : ""}</div>
            <div class="plan"><h3>Custom features</h3>
              <div class="plan-price" style="font-size:24px">One-time fee <small>quoted for you</small></div>
              <ul><li>${icon("check")}<span>Built only for your shop, such as a loyal-customer display</span></li><li>${icon("check")}<span>Price agreed with you before work starts</span></li><li>${icon("check")}<span>No extra monthly cost once it's live</span></li></ul>
              <a class="btn btn-secondary" href="#support" id="quoteBtn">${icon("mail")}Request a quote</a></div>
          </div>
        </section>
      </div>`;
    $("#planAddBranch")?.addEventListener("click", openAddBranch);
    $("#quoteBtn").addEventListener("click", () => { S.supportPrefill = { topic: "custom", subject: "Custom feature quote" }; });
    $("#cardBtn").addEventListener("click", () => dialog({
      title: "Change payment card",
      desc: "In the live product you'll be sent to your bank's secure page to link a new card.",
      body: `<div class="note info">${icon("shield")}<span>This is a demo, so no card details are collected and nothing is charged. Real payments will run through a certified Armenian payment provider.</span></div><div class="form-actions"><button class="btn btn-primary" data-close>Got it</button></div>`,
    }));
    $("#cancelBtn")?.addEventListener("click", async () => {
      if (sub.cancelAtPeriodEnd) { await api.setCancelAtPeriodEnd(false); toast("Your subscription will renew as usual"); route(); return; }
      dialog({
        title: "Cancel at the end of this period?",
        desc: `Everything keeps working until ${fmtDate(sub.renewsAt)}. After that customers can't collect stamps at your branches.`,
        body: `<div class="form-actions"><button class="btn btn-ghost" data-close>Keep subscription</button><button class="btn btn-danger" id="confirmCancel">Cancel at end of period</button></div>`,
        onOpen: ({ el, close }) => $("#confirmCancel", el).addEventListener("click", async () => { await api.setCancelAtPeriodEnd(true); close(); toast(`Subscription ends on ${fmtDate(sub.renewsAt)}`); route(); }),
      });
    });
  }

  /* ================================================================ PAYMENTS */
  const PAY = { paid: ["good", "check", "Paid"], failed: ["crit", "alert", "Failed"], upcoming: ["info", "clock", "Upcoming"], refunded: ["neutral", "receipt", "Refunded"] };
  const payBadge = (s) => `<span class="badge ${PAY[s][0]}">${icon(PAY[s][1])}${PAY[s][2]}</span>`;
  async function renderPayments(main, alive) {
    const [list, sub] = await Promise.all([api.getPayments(), api.getSubscription()]);
    if (!alive()) return;
    const year = new Date().getFullYear();
    const paidYear = list.filter((p) => p.status === "paid" && new Date(p.date).getFullYear() === year).reduce((a, p) => a + p.amount, 0);
    const failed = list.filter((p) => p.status === "failed");
    main.innerHTML = pageHead("Payment history", "Every subscription charge, including failed attempts and retries.", `<span class="demo-tag">${icon("flask")}Simulated data</span><button class="btn btn-secondary" id="payCsv">${icon("download")}Export CSV</button>`) + `
      <div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">
        <div class="kpi"><div class="kpi-label">Paid in ${year}</div><div class="kpi-value">${money(paidYear)}</div></div>
        <div class="kpi"><div class="kpi-label">Next payment</div><div class="kpi-value">${sub.cancelAtPeriodEnd ? "None" : money(sub.monthlyTotal)}</div><span class="delta flat">${sub.cancelAtPeriodEnd ? "Subscription ends " : ""}${fmtDate(sub.renewsAt)}</span></div>
        <div class="kpi"><div class="kpi-label">Failed payments</div><div class="kpi-value">${failed.length}</div><span class="delta flat">${failed.length ? "All settled on retry" : "None"}</span></div>
      </div>
      <div class="table-wrap"><table><caption class="sr-only">Payment history</caption><thead><tr><th>Date</th><th>Description</th><th class="n">Amount</th><th>Status</th><th>Invoice</th><th></th></tr></thead><tbody>
        ${list.map((p) => `<tr><td>${fmtDate(p.date)}</td><td>${esc(p.description)}${p.note ? `<div class="muted" style="font-size:13px;white-space:normal;max-width:360px">${esc(p.note)}</div>` : ""}</td><td class="n">${money(p.amount)}</td><td>${payBadge(p.status)}</td><td class="num">${esc(p.invoice)}</td>
          <td>${p.status !== "upcoming" ? `<button class="btn btn-ghost btn-sm" data-inv="${p.id}">View</button>` : ""}</td></tr>`).join("")}
      </tbody></table></div>
      <p class="muted" style="font-size:14px;margin-top:14px">Amounts are in Armenian dram. Questions about a charge? <a href="#support">Contact support</a>.</p>`;
    $$("[data-inv]", main).forEach((b) => b.addEventListener("click", () => {
      const p = list.find((x) => x.id === b.dataset.inv);
      dialog({
        title: `Invoice ${esc(p.invoice)}`, desc: `${fmtDate(p.date)} · ${PAY[p.status][2]}`,
        body: `<div class="kv"><div><span>Billed to</span><b style="font-size:16px">${esc(S.session.brand.name)}</b></div><div><span>Amount</span><b>${money(p.amount)}</b></div></div>
          <div class="table-wrap" style="margin-top:14px"><table><tbody><tr><td>${esc(p.description)}</td><td class="n">${money(p.amount)}</td></tr><tr><td><b>Total</b></td><td class="n"><b>${money(p.amount)}</b></td></tr></tbody></table></div>
          ${p.note ? `<div class="note" style="margin-top:14px">${icon("info")}<span>${esc(p.note)}</span></div>` : ""}
          <div class="note info" style="margin-top:14px">${icon("flask")}<span>Simulated invoice. Real invoices will come from the payment provider.</span></div>
          <div class="form-actions"><button class="btn btn-primary" data-close>Close</button></div>`,
      });
    }));
    $("#payCsv").addEventListener("click", () => saveFile(`cupcoff-payments-${isoDay(new Date())}.csv`, csv([["Date", "Description", "Amount (AMD)", "Status", "Invoice"], ...list.map((p) => [isoDay(p.date), p.description, p.amount, PAY[p.status][2], p.invoice])]), "text/csv"));
  }

  /* ================================================================ SUPPORT */
  async function renderSupport(main, alive) {
    const reqs = await api.listSupportRequests();
    if (!alive()) return;
    const L = S.settings.loyalty, pre = S.supportPrefill || {};
    S.supportPrefill = null;
    const topics = [["qr", "QR codes and posters"], ["stamps", "Stamps and rewards"], ["billing", "Billing and payments"], ["team", "Account and team"], ["custom", "Custom feature quote"], ["other", "Something else"]];
    const faq = (q, a) => `<details><summary>${q}${icon("plus")}</summary>${a}</details>`;
    main.innerHTML = pageHead("Support", "Answers to common questions, setup help, and a direct line to the CupCoff team.") + `
      <div class="grid">
        <section class="panel span-7" aria-labelledby="contactT" id="contactPanel">
          <div class="panel-head"><div><h2 id="contactT">Contact support</h2><p>We usually reply within one working day</p></div></div>
          <form id="supportForm" novalidate><div class="form-grid">
            <div class="field"><label for="sTopic">Topic</label><select class="input" id="sTopic" name="topic">${topics.map(([v, l]) => `<option value="${v}" ${pre.topic === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
            <div class="field"><label for="sBranch">Branch</label><select class="input" id="sBranch" name="branch"><option value="All branches">All branches</option>${S.branches.map((b) => `<option ${b.id === S.branchId ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select></div>
            <div class="field full"><label for="sSubject">Subject</label><input class="input" id="sSubject" name="subject" maxlength="90" value="${esc(pre.subject || "")}" placeholder="e.g. Poster doesn't scan on some phones"></div>
            <div class="field full"><label for="sMsg">Message</label><textarea class="input" id="sMsg" name="message" maxlength="2000" placeholder="What happened, and what did you expect?"></textarea></div>
            <div class="field full"><label for="sEmail">Reply to</label><input class="input" id="sEmail" name="replyEmail" type="email" value="${esc(S.session.user.email)}"></div>
          </div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">${icon("mail")}Send request</button></div></form>
        </section>
        <section class="panel span-5" aria-labelledby="startT">
          <div class="panel-head"><div><h2 id="startT">Getting started</h2><p>Most cafés are set up in about 10 minutes</p></div></div>
          <ol class="steps">
            <li><div><strong>Set your reward</strong><span>Choose how many stamps earn a reward and what it is. <a href="#shop-settings" data-settings-tab="loyalty">Loyalty settings</a></span></div></li>
            <li><div><strong>Add your branches</strong><span>Each branch gets its own counter code and analytics.</span></div></li>
            <li><div><strong>Invite your team</strong><span>Branch managers and baristas get their own sign-in.</span></div></li>
            <li><div><strong>Put your QR code on the counter</strong><span>Print the round sticker or the A4 sign from Café QR code. Nothing else to buy, and your team doesn't need to scan anything.</span></div></li>
            <li><div><strong>Tell customers</strong><span>Mention it when they pay. The first stamp is the hardest one to give out.</span></div></li>
          </ol>
        </section>
        ${reqs.length ? `<section class="panel span-12" aria-labelledby="myReq"><div class="panel-head"><div><h2 id="myReq">Your requests</h2><p>Saved in this session only</p></div></div>
          <div class="list-rows">${reqs.map((r) => `<div><span class="act-icon">${icon("mail")}</span><div style="flex:1;min-width:0"><strong>${esc(r.subject)}</strong><div class="muted" style="font-size:14px">${r.id}, ${esc(topics.find((t) => t[0] === r.topic)?.[1] || r.topic)}, ${esc(r.branch)}</div></div><span class="badge info">${icon("clock")}${r.status}</span></div>`).join("")}</div></section>` : ""}
        <section class="panel span-4 faq" aria-labelledby="faq1"><h2 id="faq1" style="margin-bottom:6px">Common questions</h2>
          ${faq("Is the app free for my customers?", "<p>Yes. Customers download CupCoff for free and keep cards from every participating café in one app. Only cafés pay a subscription.</p>")}
          ${faq("Do I need special equipment?", "<p>No. Customers scan your printed QR code with their own phones. You only print the sticker or sign once.</p>")}
          ${faq("Can customers use their card at every branch?", "<p>Yes. A card belongs to your brand, so stamps collected at one branch count at all of them.</p>")}
          ${faq("Who can see my customer data?", "<p>Only your team, and only for your brand. Other cafés on CupCoff never see your customers, and you only see what's needed to run the program: display name, ID, visits, stamps and rewards.</p>")}
          ${faq("How does billing work?", "<p>One fixed monthly price, charged automatically in advance from your linked card. Additional branches are discounted. You can cancel at the end of any period.</p>")}
        </section>
        <section class="panel span-4 faq" aria-labelledby="faq2"><h2 id="faq2" style="margin-bottom:6px">Your café QR code</h2>
          ${faq("A customer's camera doesn't open", "<ul><li>Any phone camera app reads the code: point it at the sticker and tap the link that appears.</li><li>In the CupCoff app, allow camera access when the phone asks. If they said no, it can be turned on in the browser's site settings.</li><li>They can also take a photo of the code and choose Scan from a photo.</li></ul>")}
          ${faq("The code won't scan", "<ul><li>Print it at least 4 cm wide and keep it clean, flat and out of strong glare.</li><li>Don't laminate it with glossy film under bright lights.</li><li>If it's damaged, download and print a new one from Café QR code.</li></ul>")}
          ${faq("Can someone scan without buying?", `<p>A customer gets 1 stamp per scan, and a second scan within ${L.scanCooldownMinutes} minutes doesn't add another. Keep the sticker where you can see it, next to the till. You can change the waiting time in Settings, Loyalty program.</p>`)}
          ${faq("A customer says a stamp is missing", `<p>Open Café QR code to see today's scans, or find the customer in All Customers. A scan within ${L.scanCooldownMinutes} minutes of their last stamp is blocked on purpose.</p>`)}
        </section>
        <section class="panel span-4 faq" aria-labelledby="faq3"><h2 id="faq3" style="margin-bottom:6px">Configuring rewards</h2>
          ${faq("Change how many stamps earn a reward", `<p>Go to Settings, Loyalty program. You're currently at <b>${L.stampsPerReward} stamps</b> for a <b>${esc(L.rewardName.toLowerCase())}</b>. Customers' existing stamps are kept.</p>`)}
          ${faq("Limit repeat scans", `<p>Each scan adds 1 stamp. The waiting time between a customer's scans is now ${L.scanCooldownMinutes} minutes. Set it to 0 for no limit.</p>`)}
          ${faq("Reward your regulars", "<p>Open VIP Customers, set what counts as VIP, select customers and assign a special reward such as a free pastry.</p>")}
          ${faq("Update the sticker after changes", "<p>The sticker and sign show your current offer. Download them again after changing the number of stamps or the reward. Old stickers keep working.</p>")}
        </section>
      </div>`;
    $$("[data-settings-tab]", main).forEach((a) => a.addEventListener("click", () => (S.settingsTab = a.dataset.settingsTab)));
    const f = $("#supportForm");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      $$("[aria-invalid]", f).forEach((x) => x.removeAttribute("aria-invalid"));
      const data = Object.fromEntries(new FormData(f));
      const bad = ["subject", "message", "replyEmail"].filter((k) => !String(data[k]).trim() || (k === "replyEmail" && !/^\S+@\S+\.\S+$/.test(data[k])));
      if (bad.length) { bad.forEach((k) => f[k].setAttribute("aria-invalid", "true")); f[bad[0]].focus(); formError(f, bad.includes("replyEmail") && String(data.replyEmail).trim() ? "Enter a valid email address to reply to." : "Add a subject and a message so we know how to help."); return; }
      try {
        const r = await busy(f.querySelector("[type=submit]"), () => api.submitSupportRequest(data));
        $("#contactPanel").innerHTML = `<div class="empty" style="padding:30px 10px"><span class="act-icon join" style="margin:0 auto 14px;width:52px;height:52px">${icon("check")}</span><strong>Request ${r.id} received</strong>
          <p>We'll reply to ${esc(r.replyEmail)}.</p><div class="note info" style="margin:16px auto 0;max-width:440px;text-align:left">${icon("flask")}<span>Demo mode: the request is saved in this session only and wasn't sent to a support team.</span></div>
          <button class="btn btn-secondary" style="margin-top:16px" id="another">Send another request</button></div>`;
        $("#another").addEventListener("click", () => route());
        toast(`Request ${r.id} received`);
      } catch (err) { formError(f, err.message); }
    });
    if (pre.topic) $("#sSubject").focus();
  }

  /* ================================================================ SETTINGS */
  async function renderSettings(main, alive) {
    const team = await api.listTeam();
    if (!alive()) return;
    const tabs = [["profile", "Café profile", "store"], ["branches", "Branches", "store"], ["loyalty", "Loyalty program", "stamp"], ["menu", "Counter menu", "cup"], ["team", "Team and access", "team"], ["notifications", "Notifications", "bell"], ["demo", "Demo controls", "flask"]];
    if (!tabs.some((t) => t[0] === S.settingsTab)) S.settingsTab = "profile";
    main.innerHTML = pageHead("Settings", `Manage ${esc(S.session.brand.name)}, its branches, rewards and team.`) + `
      <div class="settings-layout"><nav class="subnav" aria-label="Settings sections">${tabs.map(([k, l, ic]) => `<button data-stab="${k}" aria-current="${S.settingsTab === k}">${icon(ic)}${l}</button>`).join("")}</nav>
      <div id="settingsBody"></div></div>`;
    const body = $("#settingsBody");
    const draw = () => {
      $$("[data-stab]", main).forEach((b) => b.setAttribute("aria-current", b.dataset.stab === S.settingsTab));
      const fn = { profile: settingsProfile, branches: settingsBranches, loyalty: settingsLoyalty, menu: settingsMenu, team: (b) => settingsTeam(b, team), notifications: settingsNotifications, demo: settingsDemo }[S.settingsTab];
      body.innerHTML = ""; fn(body);
    };
    $$("[data-stab]", main).forEach((b) => b.addEventListener("click", () => { S.settingsTab = b.dataset.stab; draw(); body.querySelector("h2")?.focus?.(); }));
    draw();
  }
  const readonlyNote = () => isOwner() ? "" : `<div class="note" style="margin-bottom:16px">${icon("shield")}<span>You're viewing as a branch manager. Only the owner can change these settings.</span></div>`;
  const dis = () => (isOwner() ? "" : "disabled");
  function settingsProfile(body) {
    const p = S.settings.profile;
    body.innerHTML = `<section class="panel"><div class="panel-head"><div><h2 tabindex="-1">Café profile</h2><p>Shown to customers in the CupCoff app and on your posters</p></div></div>${readonlyNote()}
      <form id="profForm" novalidate><div class="form-grid">
        <div class="field full"><label for="pBrand">Coffee brand name</label><input class="input" id="pBrand" name="brandName" value="${esc(p.brandName)}" maxlength="40" required ${dis()}></div>
        <div class="field"><label for="pEmail">Contact email</label><input class="input" id="pEmail" name="contactEmail" type="email" value="${esc(p.contactEmail)}" ${dis()}></div>
        <div class="field"><label for="pPhone">Phone</label><input class="input" id="pPhone" name="phone" value="${esc(p.phone)}" ${dis()}></div>
        <div class="field"><label for="pWeb">Website or Instagram</label><input class="input" id="pWeb" name="website" value="${esc(p.website)}" ${dis()}></div>
        <div class="field"><label for="pTz">Time zone</label><select class="input" id="pTz" name="timezone" ${dis()}>${["Asia/Yerevan", "Asia/Tbilisi", "Europe/Moscow", "Europe/London", "UTC"].map((z) => `<option ${p.timezone === z ? "selected" : ""}>${z}</option>`).join("")}</select></div>
      </div>${isOwner() ? `<div class="form-actions"><button class="btn btn-primary" type="submit">Save changes</button></div>` : ""}</form></section>`;
    $("#profForm", body).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, data = Object.fromEntries(new FormData(f));
      if (!data.brandName.trim()) { f.brandName.setAttribute("aria-invalid", "true"); formError(f, "Enter your coffee brand name."); return; }
      if (data.contactEmail && !/^\S+@\S+\.\S+$/.test(data.contactEmail)) { f.contactEmail.setAttribute("aria-invalid", "true"); formError(f, "Enter a valid contact email."); return; }
      S.settings.profile = await busy(f.querySelector("[type=submit]"), () => api.updateSettings("profile", data));
      S.session.brand.name = S.settings.profile.brandName; $("#brandName").textContent = S.session.brand.name;
      f.querySelector(".form-error")?.remove(); toast("Café profile saved");
    });
  }
  function settingsBranches(body) {
    body.innerHTML = `<section class="panel"><div class="panel-head"><div><h2 tabindex="-1">Branches</h2><p>${plural(S.branches.length, "branch", "branches")} on your subscription</p></div>${isOwner() ? `<button class="btn btn-primary btn-sm" id="sAddBranch">${icon("plus")}Add branch</button>` : ""}</div>${readonlyNote()}
      <div class="list-rows">${S.branches.map((b) => `<div><span class="act-icon" style="background:${branchColor(b.id)};color:#fff">${icon("store")}</span>
        <div style="flex:1;min-width:0"><strong>${esc(b.name)}</strong><div class="muted" style="font-size:14px">${esc(b.address || "No address yet")}. Opened ${fmtDate(b.openedAt)}</div></div>
        <button class="btn btn-ghost btn-sm" data-poster="${b.id}">${icon("receipt")}Counter sign</button>${isOwner() ? `<button class="btn btn-ghost btn-sm" data-edit="${b.id}">${icon("edit")}Edit</button>` : ""}</div>`).join("")}</div></section>`;
    $("#sAddBranch", body)?.addEventListener("click", openAddBranch);
    $$("[data-poster]", body).forEach((b) => b.addEventListener("click", () => openSign(b.dataset.poster)));
    $$("[data-edit]", body).forEach((btn) => btn.addEventListener("click", () => {
      const b = S.branches.find((x) => x.id === btn.dataset.edit);
      dialog({ title: `Edit ${esc(b.name)}`, body: `<form id="ebForm" novalidate><div class="form-grid">
          <div class="field full"><label for="ebName">Branch name</label><input class="input" id="ebName" name="name" value="${esc(b.name)}" maxlength="40"></div>
          <div class="field full"><label for="ebAddr">Address</label><input class="input" id="ebAddr" name="address" value="${esc(b.address)}" maxlength="80"></div></div>
          <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" type="submit">Save branch</button></div></form>`,
        onOpen: ({ el, close }) => $("#ebForm", el).addEventListener("submit", async (e) => {
          e.preventDefault(); const f = e.target;
          if (!f.name.value.trim()) { formError(f, "Enter a branch name."); return; }
          await api.updateBranch(b.id, { name: f.name.value, address: f.address.value });
          S.branches = await api.getBranches(); fillBranchSelect(); close(); settingsBranches(body); toast("Branch saved");
        }) });
    }));
  }
  function settingsLoyalty(body) {
    const L = S.settings.loyalty, M = S.settings.customerMessages;
    body.innerHTML = `<section class="panel"><div class="panel-head"><div><h2 tabindex="-1">Loyalty program</h2><p>The rules behind every stamp card</p></div></div>${readonlyNote()}
      <div class="loyalty-layout">
      <form id="loyForm" novalidate>
        <div class="form-grid">
          <div class="field"><label for="lPer">Stamps per reward</label><input class="input num" id="lPer" name="stampsPerReward" type="number" min="4" max="20" value="${L.stampsPerReward}" ${dis()}><span class="hint" id="perHint"></span></div>
          <div class="field"><label for="lReward">Reward</label><input class="input" id="lReward" name="rewardName" value="${esc(L.rewardName)}" maxlength="40" ${dis()}></div>
          <div class="field full"><label for="lRule">When a stamp is given</label><input class="input" id="lRule" name="stampRule" value="${esc(L.stampRule)}" maxlength="60" ${dis()}><span class="hint">Shown to customers on their card.</span></div>
          <input type="hidden" name="maxStampsPerVisit" value="${L.maxStampsPerVisit}">
          <div class="field"><label for="lCool">Minutes between a customer's scans</label><input class="input num" id="lCool" name="scanCooldownMinutes" type="number" min="0" max="240" value="${L.scanCooldownMinutes}" ${dis()}><span class="hint">Each scan of your QR code adds 1 stamp. This stops repeat scans without a purchase. 0 = no limit.</span></div>
          <div class="field"><label for="lExp">Stamps expire after</label><select class="input" id="lExp" name="stampExpiryMonths" ${dis()}>${[[0, "Never"], [6, "6 months"], [12, "12 months"], [24, "24 months"]].map(([v, l]) => `<option value="${v}" ${Number(L.stampExpiryMonths) === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
          <div class="field" style="justify-content:flex-end"><label class="switch"><input type="checkbox" name="welcomeStamp" ${L.welcomeStamp ? "checked" : ""} ${dis()}><span class="track"></span><span>Give a welcome stamp on sign-up</span></label></div>
        </div>
        <h3 style="margin:26px 0 4px">Reminders to customers</h3><p class="muted" style="font-size:14px;margin-bottom:6px">Sent as push notifications from the CupCoff app</p>
        ${[["nearReward", "When they're one stamp away from a reward"], ["rewardReady", "When a reward is ready to redeem"], ["winBack", `When they haven't visited for ${M.winBackDays} days`]].map(([k, l]) => `<div class="setting-row"><span>${l}</span><label class="switch"><input type="checkbox" name="msg_${k}" ${M[k] ? "checked" : ""} ${dis()} aria-label="${l}"><span class="track"></span></label></div>`).join("")}
        ${isOwner() ? `<div class="form-actions"><button class="btn btn-primary" type="submit">Save loyalty settings</button></div>` : ""}
      </form>
      <div class="loyalty-preview" id="loyPreview" aria-live="polite"></div></div></section>`;
    const f = $("#loyForm", body);
    const preview = () => {
      const n = Math.min(20, Math.max(4, parseInt(f.stampsPerReward.value, 10) || L.stampsPerReward));
      $("#loyPreview", body).innerHTML = phonePreview({ brand: S.session.brand.name, n, filled: Math.max(1, n - 2), reward: f.rewardName.value.trim() || "reward", customerId: "CC-1001" }) + `<p class="hero-phone-cap" style="color:var(--ink-3)">Live preview of the customer's card</p>`;
    };
    const hint = () => {
      const n = parseInt(f.stampsPerReward.value, 10);
      $("#perHint", body).textContent = n >= 4 && n <= 20 ? `Customers buy ${n}, then get 1 free: 1 in ${n + 1} drinks (${Math.round(100 / (n + 1))}%) is on the house.` : "Choose a number from 4 to 20.";
    };
    f.addEventListener("input", () => { preview(); hint(); }); preview(); hint();
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(f));
      const loyalty = { stampsPerReward: data.stampsPerReward, rewardName: data.rewardName, stampRule: data.stampRule, maxStampsPerVisit: data.maxStampsPerVisit, scanCooldownMinutes: data.scanCooldownMinutes, stampExpiryMonths: Number(data.stampExpiryMonths), welcomeStamp: !!data.welcomeStamp };
      try {
        S.settings.loyalty = await busy(f.querySelector("[type=submit]"), () => api.updateSettings("loyalty", loyalty));
        S.settings.customerMessages = await api.updateSettings("customerMessages", { nearReward: !!data.msg_nearReward, rewardReady: !!data.msg_rewardReady, winBack: !!data.msg_winBack });
        f.querySelector(".form-error")?.remove(); toast("Loyalty settings saved. Customers see the new card right away.");
      } catch (err) { formError(f, err.message); }
    });
  }
  async function settingsMenu(body) {
    const menu = await api.getMenu();
    const groups = [...new Set(menu.map((m) => m.cat))];
    body.innerHTML = `<section class="panel"><div class="panel-head"><div><h2 tabindex="-1">Counter menu</h2><p>What your team can tap after scanning a customer. These items power Insights.</p></div></div>${readonlyNote()}
      ${groups.map((g) => `<h3 style="margin:16px 0 4px">${esc(g)}</h3>${menu.filter((m) => m.cat === g).map((m) => `<div class="setting-row"><div><strong>${esc(m.name)}</strong><p>${m.food ? "Food: recorded, no stamp" : m.milk ? "Drink, milk choice: 1 stamp" : "Drink: 1 stamp"}</p></div><label class="switch"><input type="checkbox" data-menu="${m.id}" ${m.enabled ? "checked" : ""} ${dis()} aria-label="Show ${esc(m.name)} at the counter"><span class="track"></span></label></div>`).join("")}`).join("")}
      <div class="note" style="margin-top:16px">${icon("info")}<span>Adding your own items and prices comes with the live menu endpoint (see docs/BACKEND-PLAN.md).</span></div></section>`;
    $$("[data-menu]", body).forEach((cb) => cb.addEventListener("change", async () => { await api.setMenuItem(cb.dataset.menu, { enabled: cb.checked }); toast(`${menu.find((m) => m.id === cb.dataset.menu).name} ${cb.checked ? "shown at" : "hidden from"} the counter`); }));
  }
  function settingsTeam(body, team) {
    const roles = { Owner: "Everything, including billing and branches", "Branch manager": "Customers, analytics and posters for their branch", Barista: "Sees today's scans and the café QR code" };
    body.innerHTML = `<section class="panel"><div class="panel-head"><div><h2 tabindex="-1">Team and access</h2><p>Who can use CupCoff at ${esc(S.session.brand.name)}</p></div>${isOwner() ? `<button class="btn btn-primary btn-sm" id="inviteBtn">${icon("userPlus")}Invite member</button>` : ""}</div>${readonlyNote()}
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th class="hide-sm">Branch</th><th>Status</th></tr></thead><tbody>
        ${team.map((m) => `<tr><td class="cust-cell"><strong>${esc(m.name)}</strong><span>${esc(m.email)}</span></td><td>${esc(m.role)}</td><td class="hide-sm">${esc(m.branch)}</td><td><span class="badge ${m.status === "Active" ? "good" : "info"}">${icon(m.status === "Active" ? "check" : "mail")}${m.status}</span></td></tr>`).join("")}
      </tbody></table></div>
      <h3 style="margin:22px 0 6px">What each role can do</h3>
      <div class="list-rows">${Object.entries(roles).map(([r, d]) => `<div><strong style="min-width:130px">${r}</strong><span class="muted" style="font-size:14px">${d}</span></div>`).join("")}</div></section>`;
    $("#inviteBtn", body)?.addEventListener("click", () => dialog({
      title: "Invite a team member", desc: "They'll get an email to set up their sign-in.",
      body: `<form id="invForm" novalidate><div class="form-grid">
        <div class="field"><label for="iName">Name</label><input class="input" id="iName" name="name" maxlength="50"></div>
        <div class="field"><label for="iEmail">Email</label><input class="input" id="iEmail" name="email" type="email"></div>
        <div class="field"><label for="iRole">Role</label><select class="input" id="iRole" name="role"><option>Branch manager</option><option selected>Barista</option></select></div>
        <div class="field"><label for="iBranch">Branch</label><select class="input" id="iBranch" name="branch">${S.branches.map((b) => `<option>${esc(b.name)}</option>`).join("")}</select></div></div>
        <div class="note info" style="margin-top:16px">${icon("flask")}<span>Demo: no email is sent.</span></div>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" type="submit">Send invite</button></div></form>`,
      onOpen: ({ el, close }) => $("#invForm", el).addEventListener("submit", async (e) => {
        e.preventDefault(); const f = e.target;
        try { const m = await api.inviteTeamMember(Object.fromEntries(new FormData(f))); team.push(m); close(); settingsTeam(body, await api.listTeam()); toast(`Invite sent to ${m.email}`); }
        catch (err) { formError(f, err.message); }
      }),
    }));
  }
  function settingsNotifications(body) {
    const N = S.settings.notifications;
    const rows = [["weeklySummary", "Weekly summary", "Every Monday: stamps, rewards and new members"], ["rewardRedeemed", "Each redeemed reward", "An email every time a customer redeems"], ["newVip", "New VIP customers", "When someone starts meeting your VIP criteria"], ["billing", "Billing", "Upcoming payments, failed payments and receipts"], ["productNews", "CupCoff news", "New features, a few times a year"]];
    body.innerHTML = `<section class="panel"><div class="panel-head"><div><h2 tabindex="-1">Notifications</h2><p>Emails to ${esc(S.session.user.email)}</p></div></div>
      ${rows.map(([k, t, d]) => `<div class="setting-row"><div><strong>${t}</strong><p>${d}</p></div><label class="switch"><input type="checkbox" data-n="${k}" ${N[k] ? "checked" : ""} aria-label="${t}"><span class="track"></span></label></div>`).join("")}</section>`;
    $$("[data-n]", body).forEach((cb) => cb.addEventListener("change", async () => { S.settings.notifications = await api.updateSettings("notifications", { [cb.dataset.n]: cb.checked }); toast(`${rows.find((r) => r[0] === cb.dataset.n)[1]} ${cb.checked ? "on" : "off"}`); }));
  }
  function settingsDemo(body) {
    const live = CONFIG.mode === "live";
    body.innerHTML = `<section class="panel"><div class="panel-head"><div><h2 tabindex="-1">Demo controls</h2><p>For presenting CupCoff to coffee shops</p></div><span class="demo-tag">${icon("flask")}Demo</span></div>
      <div class="setting-row"><div><strong>View as</strong><p>Switch roles to show what owners and branch managers can do</p></div>
        <div class="seg">${[["owner", "Owner"], ["branch_manager", "Branch manager"]].map(([r, l]) => `<button data-demorole="${r}" aria-pressed="${S.session.user.role === r}">${l}</button>`).join("")}</div></div>
      <div class="setting-row"><div><strong>Data source</strong><p>${live ? "Sign-in uses the CupCoff server. Everything else is sample data." : "All data is realistic sample data generated in the browser."}</p></div><span class="badge ${live ? "good" : "info"}">${live ? "Live sign-in" : "Sample data"}</span></div>
      <div class="setting-row"><div><strong>New café sign-up</strong><p>Show what a café owner sees when they register: sign-up and loyalty offer</p></div><button class="btn btn-secondary" id="newCafeDemo">Start as a new café</button></div>
      <div class="setting-row"><div><strong>Reset the demo</strong><p>Back to the sample café, undoing every change made in this session</p></div><button class="btn btn-secondary" id="resetDemo">Reset</button></div>
      <h3 style="margin:22px 0 8px">Connected to the backend</h3>
      <div class="table-wrap"><table><thead><tr><th>Feature</th><th>Status</th></tr></thead><tbody>
        <tr><td>Sign in (POST /api/auth/login)</td><td><span class="badge good">${icon("check")}In the backend</span></td></tr>
        ${["Café profile and branches", "Customers, stamps and rewards", "Analytics", "VIP segments and special rewards", "Subscription and payments", "Support requests", "Team and roles"].map((x) => `<tr><td>${x}</td><td><span class="badge info">${icon("flask")}Sample data until the API exists</span></td></tr>`).join("")}
      </tbody></table></div></section>`;
    $$("[data-demorole]", body).forEach((b) => b.addEventListener("click", async () => {
      S.session = await api.setDemoRole(b.dataset.demorole); S.branchId = S.session.user.branchId || ""; renderShell(); route();
    }));
    $("#resetDemo", body).addEventListener("click", () => location.reload());
    $("#newCafeDemo", body).addEventListener("click", () => { history.replaceState(null, "", location.pathname + location.search); renderSignUp(); });
  }

  /* ================================================================ sign-up: a new café joins */
  function renderSignUp() {
    const live = CONFIG.mode === "live";
    const draft = (S.signupDraft ||= { step: 1, stampsPerReward: 6, rewardName: "Free drink of choice" });
    document.title = "Create your café account · CupCoff";
    const offers = [5, 6, 8, 9];
    root.innerHTML = `${ILL_DEFS_HOST}<main class="signin"><div class="signin-card signup-card">
      <div class="signin-art" aria-hidden="true">${["pourover", "latte", "machine", "milk"].map((n) => illus(n)).join("")}</div>
      <a href="#" aria-label="CupCoff" id="toSignIn1">${wordmark("signin-word")}</a>
      <ol class="signup-steps" aria-label="Sign-up progress"><li ${draft.step === 1 ? 'aria-current="step"' : ""} class="${draft.step > 1 ? "done" : ""}">Your café</li><li ${draft.step === 2 ? 'aria-current="step"' : ""}>Your loyalty offer</li></ol>
      ${draft.step === 1 ? `
      <h1 style="font-size:24px">Create your café account</h1>
      <p class="muted" style="margin:6px 0 18px">${S.session?.brand ? "" : ""}30 days free. No card needed to start.</p>
      <form id="suForm" novalidate class="stack">
        <div class="field"><label for="suBrand">Café or brand name</label><input class="input" id="suBrand" name="brandName" maxlength="40" value="${esc(draft.brandName || "")}" autocomplete="organization" required></div>
        <div class="field"><label for="suName">Your name</label><input class="input" id="suName" name="ownerName" maxlength="50" value="${esc(draft.ownerName || "")}" autocomplete="name" required></div>
        <div class="field"><label for="suEmail">Work email</label><input class="input" id="suEmail" name="email" type="email" value="${esc(draft.email || "")}" autocomplete="email" required></div>
        <div class="field"><label for="suPass">Password</label><input class="input" id="suPass" name="password" type="password" minlength="6" autocomplete="new-password" required><span class="hint">At least 6 characters.</span></div>
        <div class="form-grid">
          <div class="field"><label for="suBranch">First branch</label><input class="input" id="suBranch" name="branchName" maxlength="40" value="${esc(draft.branchName || "")}" placeholder="e.g. Teryan" required></div>
          <div class="field"><label for="suAddr">Address <span class="muted" style="font-weight:400">(optional)</span></label><input class="input" id="suAddr" name="branchAddress" maxlength="80" value="${esc(draft.branchAddress || "")}" placeholder="Street, Yerevan"></div>
        </div>
        <div class="form-actions" style="justify-content:stretch"><button class="btn btn-primary" type="submit" style="width:100%">Continue</button></div>
      </form>` : `
      <h1 style="font-size:24px">Choose your loyalty offer</h1>
      <p class="muted" style="margin:6px 0 18px">You can change it any time in Settings.</p>
      <form id="suForm2" novalidate class="stack">
        <fieldset class="offer-pick"><legend class="label">How many coffees before a free one?</legend>
          ${offers.map((n) => `<label class="offer"><input type="radio" name="stampsPerReward" value="${n}" ${Number(draft.stampsPerReward) === n ? "checked" : ""}><span><b>Buy ${n}, get the ${ordinal(n + 1)} free</b><small>${Math.round(100 / (n + 1))}% of drinks on the house${n === 6 ? ". Most popular" : ""}</small></span></label>`).join("")}
        </fieldset>
        <div class="field"><label for="suReward">The reward</label><input class="input" id="suReward" name="rewardName" maxlength="40" value="${esc(draft.rewardName)}"></div>
        <div class="form-actions" style="justify-content:space-between"><button type="button" class="btn btn-ghost" id="suBack">Back</button><button class="btn btn-primary" type="submit">Create my café</button></div>
      </form>`}
      <p class="muted" style="font-size:13.5px;margin-top:16px">Already have an account? <a href="#" id="toSignIn">Sign in</a>${live ? "" : `. Demo mode: nothing is saved after you reload.`}</p>
    </div></main>`;
    const back = (e) => { e.preventDefault(); S.signupDraft = null; renderSignIn(); };
    $("#toSignIn").addEventListener("click", back); $("#toSignIn1").addEventListener("click", back);
    const f1 = $("#suForm"), f2 = $("#suForm2");
    if (f1) {
      f1.addEventListener("submit", (e) => {
        e.preventDefault();
        $$("[aria-invalid]", f1).forEach((x) => x.removeAttribute("aria-invalid"));
        const d = Object.fromEntries(new FormData(f1));
        const bad = [];
        if (!d.brandName.trim()) bad.push(["brandName", "your café's name"]);
        if (!d.ownerName.trim()) bad.push(["ownerName", "your name"]);
        if (!/^\S+@\S+\.\S+$/.test(d.email)) bad.push(["email", "a valid email"]);
        if (d.password.length < 6) bad.push(["password", "a password of at least 6 characters"]);
        if (!d.branchName.trim()) bad.push(["branchName", "your first branch's name"]);
        if (bad.length) { bad.forEach(([k]) => f1[k].setAttribute("aria-invalid", "true")); f1[bad[0][0]].focus(); formError(f1, "Add " + bad.map((b) => b[1]).join(", ") + "."); return; }
        Object.assign(draft, d, { step: 2 }); renderSignUp();
      });
      setTimeout(() => f1.brandName.focus(), 30);
    } else {
      $("#suBack").addEventListener("click", () => { draft.step = 1; renderSignUp(); });
      f2.addEventListener("submit", async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(f2));
        if (!d.rewardName.trim()) { f2.rewardName.setAttribute("aria-invalid", "true"); formError(f2, "Name the reward, for example Free drink of choice."); return; }
        Object.assign(draft, d);
        try {
          S.session = await busy(f2.querySelector("[type=submit]"), () => api.registerCafe(draft));
          S.signupDraft = null; S.counter = null; S.branchId = ""; S.vip = null;
          history.replaceState(null, "", location.pathname + location.search + "#overview");
          await boot(true);
          toast(`Welcome to CupCoff. Your 30-day free trial has started.`);
        } catch (err) { formError(f2, err.message); }
      });
      setTimeout(() => f2.querySelector("input:checked")?.focus(), 30);
    }
  }

  /* ================================================================ OVERVIEW for a café that just joined */
  async function renderWelcome(main, alive) {
    const [setup, sub] = await Promise.all([api.getSetup(), api.getSubscription()]);
    if (!alive()) return;
    const L = S.settings.loyalty, now = new Date();
    const steps = [
      { key: "offer", art: "takeaway", title: "Choose your loyalty offer", done: `${offerLine(L)}, reward: ${L.rewardName.toLowerCase()}.`, todo: "Decide how many coffees earn a free one.", action: ["Change offer", "offer"] },
      { key: "branch", art: "machine", title: "Add your branches", done: `${plural(S.branches.length, "branch", "branches")}: ${S.branches.map((b) => esc(b.name)).join(", ")}.`, todo: "Each branch gets its own analytics.", action: ["Add another branch", "branch"] },
      { key: "sign", art: "pourover", title: "Put up your QR code", done: "Downloaded. Customers can scan it when they pay.", todo: "Print the sticker or A4 sign with your café's QR code and put it by the till.", action: ["Get the sign", "sign"] },
      { key: "team", art: "milk", title: "Invite your team", done: "Your team has been invited.", todo: "Baristas get their own sign-in to see today's scans. Optional for a one-person café.", action: ["Invite a barista", "team"] },
      { key: "firstScan", art: "latte", title: "Get your first scan", done: "First stamp given. You're live.", todo: "Scan your café's QR code with your own phone to see what customers see.", action: ["Open your QR code", "scan"] },
    ];
    const doneN = steps.filter((s) => setup[s.key]).length;
    const nextKey = steps.find((s) => !setup[s.key])?.key;
    const dl = sub.trialDaysLeft, td = sub.trialDays;
    main.innerHTML = `
      <div class="ov-head"><div><p class="ov-date">${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 class="squiggle">Welcome to CupCoff, ${esc(S.session.user.firstName)}</h1></div></div>
      <section class="trial-band" aria-labelledby="trialT">
        <div class="trial-copy"><h2 id="trialT">${plural(dl, "day")} left in your free trial</h2>
          <p>Everything is included. No payment until ${fmtDate(sub.trialEndsAt, { day: "numeric", month: "long" })}, then ${money(sub.monthlyTotal)} a month for ${plural(sub.branchCount, "branch", "branches")}.</p>
          <div class="daybar" aria-hidden="true">${Array.from({ length: td }, (_, i) => `<i class="${i < td - dl ? "used" : i === td - dl ? "today" : ""}"></i>`).join("")}</div></div>
        <div class="trial-art" aria-hidden="true">${illus("croissant")}${illus("moka")}</div>
      </section>
      <div class="grid">
        <section class="panel span-8 setup" aria-labelledby="setupT">
          <div class="panel-head"><div><h2 id="setupT">Get ${esc(S.session.brand.name)} ready</h2><p>About 10 minutes. ${doneN} of ${steps.length} done.</p></div>
            <div class="ring" role="img" aria-label="${doneN} of ${steps.length} steps done" style="--p:${(doneN / steps.length) * 100}"><span>${doneN}/${steps.length}</span></div></div>
          <ol class="setup-list">${steps.map((s) => `<li class="${setup[s.key] ? "done" : ""} ${s.key === nextKey ? "next" : ""}">
            <span class="setup-art">${illus(s.art)}${setup[s.key] ? `<span class="setup-check">${icon("check")}</span>` : ""}</span>
            <div class="setup-text"><strong>${s.title}</strong><p>${setup[s.key] ? s.done : s.todo}</p>
</div>
            <button class="btn ${s.key === nextKey ? "btn-primary" : "btn-secondary"} btn-sm" data-step="${s.action[1]}">${s.action[0]}</button></li>`).join("")}</ol>
        </section>
        <section class="panel span-4 welcome-phone" aria-labelledby="custT">
          <div class="panel-head"><div><h2 id="custT">What customers see</h2><p>Their ${esc(S.session.brand.name)} card in the free CupCoff app</p></div></div>
          ${phonePreview({ brand: S.session.brand.name, n: L.stampsPerReward, filled: Math.max(1, L.stampsPerReward - 2), reward: L.rewardName, customerId: "CC-1001" })}
        </section>
        <section class="panel span-12 coming" aria-labelledby="comingT">
          <div class="panel-head"><div><h2 id="comingT">Filling in after your first scans</h2><p>These pages come alive as customers collect stamps</p></div></div>
          <div class="coming-grid">
            ${[["#analytics", "analytics", "Analytics", "Visits, stamps and rewards by day and by branch"], ["#insights", "sparkle", "Insights", "What customers order, busy hours, and what's trending"],
              ["#customers", "users", "All Customers", "Every member, their card and their history"], ["#vip", "star", "VIP Customers", "Your regulars, and special rewards for them"]].map(([h, ic, t, d]) => `<a class="coming-card" href="${h}">${icon(ic)}<strong>${t}</strong><span>${d}</span></a>`).join("")}
          </div>
        </section>
      </div>`;
    $$("[data-step]", main).forEach((b) => b.addEventListener("click", async () => {
      const k = b.dataset.step;
      if (k === "offer") { S.settingsTab = "loyalty"; location.hash = "shop-settings"; }
      if (k === "branch") openAddBranch();
      if (k === "sign") openSign(S.branches[0].id);
      if (k === "team") { S.settingsTab = "team"; location.hash = "shop-settings"; }
      if (k === "scan") location.hash = "counter";
    }));
  }

  /* ================================================================ sign-in */
  function renderSignIn(notice = "") {
    const live = CONFIG.mode === "live";
    document.title = "Sign in · CupCoff";
    root.innerHTML = `${ILL_DEFS_HOST}<main class="signin"><div class="signin-card">
      <div class="signin-art" aria-hidden="true">${["pourover", "latte", "machine", "milk"].map((n) => illus(n)).join("")}</div>
      <a href="#" aria-label="CupCoff">${wordmark("signin-word")}</a>
      <h1 style="font-size:26px">Sign in to your café</h1>
      <p class="muted" style="margin:6px 0 22px">Manage stamps, rewards and customers for every branch.</p>
      ${notice ? `<div class="note" style="margin-bottom:16px">${icon("check")}<span>${esc(notice)}</span></div>` : ""}
      <form id="signinForm" novalidate class="stack">
        <div class="field"><label for="siEmail">Work email</label><input class="input" id="siEmail" name="email" type="email" autocomplete="username" value="${live ? "" : "anna@amberhill.coffee"}" required></div>
        <div class="field"><label for="siPass">Password</label><input class="input" id="siPass" name="password" type="password" autocomplete="current-password" ${live ? "" : 'value="demo-password"'} required></div>
        <div class="form-actions" style="justify-content:stretch"><button class="btn btn-primary" type="submit" style="width:100%">Sign in</button></div>
      </form>
      <p class="muted" style="font-size:13.5px;margin-top:16px">${live ? "Uses your CupCoff account." : "Demo mode: any email and password work."}</p>
      <p style="font-size:14px;margin-top:10px"><button class="linkbtn" id="toCustomer">I'm a coffee lover, not a café</button></p>
      <div class="signup-cta">${illus("takeaway")}<div><strong>New to CupCoff?</strong><span>Set up your café in a few minutes. 30 days free.</span></div><button class="btn btn-secondary btn-sm" id="toSignUp">Create an account</button></div>
    </div></main>`;
    const f = $("#signinForm");
    $("#toSignUp").addEventListener("click", () => renderSignUp());
    $("#toCustomer").addEventListener("click", () => startAs("customer"));
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = f.email.value.trim(), password = f.password.value;
      if (!/^\S+@\S+\.\S+$/.test(email)) { f.email.setAttribute("aria-invalid", "true"); formError(f, "Enter a valid email address."); f.email.focus(); return; }
      if (!password) { f.password.setAttribute("aria-invalid", "true"); formError(f, "Enter your password."); f.password.focus(); return; }
      try {
        S.session = await busy(f.querySelector("[type=submit]"), () => api.login({ email, password }));
        await boot(true);
      } catch (err) { formError(f, err.message); }
    });
    setTimeout(() => (live ? f.email : f.querySelector("button")).focus(), 30);
  }

  /* ================================================================ ONE APP, TWO SIDES */
  const MODE_KEY = "cupcoff.mode";
  const readMode = () => { try { return localStorage.getItem(MODE_KEY); } catch { return null; } };
  const saveMode = (m) => { S.mode = m; try { m ? localStorage.setItem(MODE_KEY, m) : localStorage.removeItem(MODE_KEY); } catch { /* storage unavailable */ } };
  const switchTo = (m, hash) => { saveMode(m); history.replaceState(null, "", location.pathname + location.search + (hash ? "#" + hash : "")); boot(); };

  function renderRolePicker() {
    document.title = "CupCoff";
    root.innerHTML = `${ILL_DEFS_HOST}<main class="signin role-pick"><div class="signin-card role-card">
      ${wordmark("signin-word")}
      <h1>How will you use CupCoff?</h1>
      <p class="muted" style="margin:6px 0 20px">One app for coffee lovers and the cafés they love.</p>
      <div class="roles">
        <button class="role" data-role="customer"><span class="role-art">${illus("takeaway")}${illus("latte")}</span>
          <strong>I'm here for coffee</strong><span>Collect stamps and free drinks at your favourite cafés.</span></button>
        <button class="role" data-role="owner"><span class="role-art">${illus("machine")}${illus("pourover")}</span>
          <strong>I run a café</strong><span>Loyalty program, customer insights, and a scanner for your team.</span></button>
      </div>
      <p class="muted" style="font-size:13.5px;margin-top:18px;text-align:center">You can switch any time.</p>
    </div></main>`;
    $$("[data-role]").forEach((b) => b.addEventListener("click", () => startAs(b.dataset.role)));
    setTimeout(() => $(".role")?.focus(), 30);
  }

  // Entry from the role picker: always lead to that side's registration form.
  // (A previous demo session on this device is signed out; its account can still sign in.)
  async function startAs(role) {
    saveMode(role);
    if (role === "customer") {
      await api.customerLogout();
      history.replaceState(null, "", location.pathname + location.search + "#c-cards");
      await bootCustomer();
      return;
    }
    await api.logout();
    S.session = await api.getSession();
    S.signupDraft = null;
    history.replaceState(null, "", location.pathname + location.search);
    renderSignUp();
  }

  /* ---------------- customer side ---------------- */
  const C_TABS = [["c-cards", "My cards", "card"], ["c-scan", "Scan", "qr"], ["c-rewards", "Rewards", "gift"], ["c-discover", "Discover", "pin"], ["c-profile", "Profile", "team"]];
  let CS = null, codeTimer = null;
  const cardTheme = (i) => ["t-wine", "t-sky", "t-paper"][i % 3];

  async function bootCustomer() {
    if (!S.settings) [S.branches, S.settings] = await Promise.all([api.getBranches(), api.getSettings()]);
    if (!S.session) S.session = await api.getSession();
    CS = await api.getCustomerSession();
    // Opened from a café's QR code: remember the scan, so it's added right after sign-up
    if (location.hash.startsWith("#c-scan?")) { S.pendingScan = api.parseCafeCode(location.hash) || S.pendingScan; history.replaceState(null, "", location.pathname + location.search + "#c-scan"); }
    if (!CS.signedIn) { renderCustomerSignIn(); return; }
    renderCustomerShell();
    if (!location.hash.startsWith("#c-")) history.replaceState(null, "", location.pathname + location.search + "#c-cards");
    routeCustomer();
  }
  function renderCustomerSignIn(mode = "signup") {
    document.title = (mode === "signup" ? "Create your account" : "Sign in") + " · CupCoff";
    const up = mode === "signup";
    root.innerHTML = `${ILL_DEFS_HOST}<main class="signin"><div class="signin-card">
      <div class="signin-art" aria-hidden="true">${["latte", "croissant", "takeaway", "moka"].map((n) => illus(n)).join("")}</div>
      ${wordmark("signin-word")}
      ${S.pendingScan ? `<div class="note" style="margin:0 0 14px;text-align:left">${icon("stamp")}<span>${up ? "Create your free account" : "Sign in"} to collect your stamp at <b>${esc(S.pendingScan.n || "this café")}</b>. It's added right after.</span></div>` : ""}
      <h1 style="font-size:25px">${up ? "Collect free coffee" : "Welcome back"}</h1>
      <p class="muted" style="margin:6px 0 20px">${up ? "Free for coffee lovers. Scan the QR code at any CupCoff café when you pay." : "Sign in with the email you used before."}</p>
      <form id="cForm" novalidate class="stack">
        ${up ? `<div class="field"><label for="cName">Your name</label><input class="input" id="cName" name="name" autocomplete="name" maxlength="50" placeholder="e.g. Elen Muradyan"><span class="hint">Cafés see only your first name and last initial.</span></div>` : ""}
        <div class="field"><label for="cEmail">Email</label><input class="input" id="cEmail" name="email" type="email" autocomplete="email" placeholder="you@example.am"></div>
        <div class="form-actions" style="justify-content:stretch"><button class="btn btn-primary" type="submit" style="width:100%">${up ? "Create my account" : "Sign in"}</button></div>
      </form>
      <p style="font-size:14px;margin-top:14px">${up ? `Already have an account? <button class="linkbtn" id="cMode">Sign in</button>` : `New here? <button class="linkbtn" id="cMode">Create an account</button>`}</p>
      <div class="signup-cta">${illus("latte")}<div><strong>Just looking?</strong><span>Explore with a sample customer who already has cards and history.</span></div><button class="btn btn-secondary btn-sm" id="cSample">Explore</button></div>
      <p class="muted" style="font-size:13px;margin-top:14px">Demo: your account is saved on this device only, until the CupCoff server is connected. <button class="linkbtn" id="toOwner">I run a café instead</button></p>
    </div></main>`;
    $("#toOwner").addEventListener("click", () => startAs("owner"));
    $("#cMode").addEventListener("click", () => renderCustomerSignIn(up ? "signin" : "signup"));
    $("#cSample").addEventListener("click", async (e) => {
      try { await busy(e.currentTarget, () => api.customerLogin({ sample: true })); history.replaceState(null, "", location.pathname + location.search + (S.pendingScan ? "#c-scan" : "#c-cards")); bootCustomer(); }
      catch (err) { toast(err.message, "error"); }
    });
    const f = $("#cForm");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      $$("[aria-invalid]", f).forEach((x) => x.removeAttribute("aria-invalid"));
      const d = Object.fromEntries(new FormData(f));
      if (up && !d.name.trim()) { f.name.setAttribute("aria-invalid", "true"); f.name.focus(); formError(f, "Enter your name."); return; }
      if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) { f.email.setAttribute("aria-invalid", "true"); f.email.focus(); formError(f, "Enter a valid email address."); return; }
      try {
        await busy(f.querySelector("[type=submit]"), () => (up ? api.customerSignUp(d) : api.customerLogin({ email: d.email })));
        const scanning = !!S.pendingScan;
        history.replaceState(null, "", location.pathname + location.search + (scanning ? "#c-scan" : "#c-cards"));
        await bootCustomer();
        if (up && !scanning) toast("Your account is ready");
      } catch (err) { formError(f, err.message); }
    });
    setTimeout(() => (up ? f.name : f.email).focus(), 30);
  }
  function renderCustomerShell() {
    const c = CS.customer;
    document.title = "CupCoff";
    root.innerHTML = `${ILL_DEFS_HOST}<div class="capp-bg"><div class="capp">
      <header class="c-top"><a href="#c-cards" aria-label="CupCoff, my cards">${wordmark("c-word")}</a>
        <a class="c-avatar" href="#c-profile" aria-label="Profile">${esc(c.displayName.split(" ").map((x) => x[0]).join("").slice(0, 2))}</a></header>
      <div class="awning" aria-hidden="true"></div>
      <main id="cmain" class="c-main" tabindex="-1"></main>
      <nav class="c-nav" aria-label="App sections">${C_TABS.map(([h, l, ic]) => `<a href="#${h}" data-ctab="${h}">${icon(ic)}<span>${l}</span></a>`).join("")}</nav>
    </div></div>`;
    // Tapping the tab you're already on (e.g. Scan, after a scan result) starts that tab again
    $$("[data-ctab]").forEach((a) => a.addEventListener("click", (e) => { if (location.hash === "#" + a.dataset.ctab) { e.preventDefault(); routeCustomer(true); } }));
  }
  let cToken = 0;
  async function routeCustomer(fromHash) {
    clearInterval(codeTimer); stopCamera();
    const main = $("#cmain");
    if (!main) return;
    if (location.hash.startsWith("#c-scan?")) { S.pendingScan = api.parseCafeCode(location.hash); history.replaceState(null, "", location.pathname + location.search + "#c-scan"); }
    if (location.hash === "#c-code") history.replaceState(null, "", location.pathname + location.search + "#c-scan"); // old link
    const id = (location.hash || "#c-cards").slice(1);
    const tab = id.startsWith("c-card-") ? "c-cards" : C_TABS.some((t) => t[0] === id) ? id : "c-cards";
    $$("[data-ctab]").forEach((a) => (a.dataset.ctab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    const tk = ++cToken, alive = () => tk === cToken;
    main.innerHTML = `<div class="skel" style="height:28px;width:60%;margin:8px 0 18px"></div><div class="skel" style="height:180px"></div>`;
    try {
      if (id.startsWith("c-card-")) await renderCCard(main, alive, id.slice(7));
      else await ({ "c-scan": renderCScan, "c-rewards": renderCRewards, "c-discover": renderCDiscover, "c-profile": renderCProfile }[id] || renderCCards)(main, alive);
      if (fromHash) { main.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }
    } catch (err) {
      if (/sign in/i.test(err.message)) { bootCustomer(); return; }
      main.innerHTML = `<div class="empty">${illus("milk")}<strong>This screen didn't load</strong><p>${esc(err.message)}</p></div>`;
    }
  }
  const walletCard = (w, i, big) => {
    const left = Math.max(0, w.per - w.balance), ready = w.balance >= w.per;
    return `<${big ? "div" : "a"} class="wcard ${cardTheme(i)} ${big ? "big" : ""}" ${big ? "" : `href="#c-card-${w.id}"`}>
      <span class="wcard-art">${illus(w.art)}</span>
      <span class="wcard-top"><b>${esc(w.name)}</b><span>${w.balance >= w.per ? "Reward ready" : `${Math.min(w.balance, w.per)}/${w.per}`}</span></span>
      ${stampRow(w.per, Math.min(w.balance, w.per), { cols: w.per <= 8 ? w.per : 5 })}
      <span class="wcard-foot">${ready ? `Your ${esc(w.reward.toLowerCase())} is waiting` : `${left} more to a ${esc(w.reward.toLowerCase())}`}</span>
    </${big ? "div" : "a"}>`;
  };

  async function renderCCards(main, alive) {
    const wallet = await api.getWallet();
    const home = wallet.some((w) => w.home) ? await api.getCafeForCustomer("home") : { history: [], name: "" };
    if (!alive()) return;
    const now = new Date();
    const fresh = home.history.find((h) => (Date.now() - new Date(h.at)) / 60000 < 30 && (h.type === "stamp" || h.type === "reward"));
    main.innerHTML = `
      <section class="c-hello"><p class="c-date">${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p><h1 class="squiggle">Hi, ${esc(CS.customer.firstName)}</h1></section>
      ${fresh ? `<div class="c-fresh" role="status">${icon(fresh.type === "reward" ? "gift" : "stamp")}<span>${fresh.type === "reward" ? "Reward redeemed" : fresh.label === "Welcome stamp" ? "Welcome stamp added" : `${plural(fresh.qty, "stamp")} added`} at ${esc(home.name)}, ${esc(fresh.branch)}. ${rel(fresh.at)}.</span></div>` : ""}
      <a class="c-codebtn" href="#c-scan">${icon("qr")}<span><b>Scan for a stamp</b><small>Paid? Scan the café's QR code on the counter</small></span>${icon("chevron", "c-chev")}</a>
      <div class="c-section-head"><h2>My cards</h2>${wallet.length ? `<span class="muted">${plural(wallet.length, "café")}</span>` : ""}</div>
      ${wallet.length ? `<div class="wallet">${wallet.map((w, i) => walletCard(w, i)).join("")}</div>
      <a class="c-add" href="#c-discover">${icon("plus")}Add a café</a>`
      : `<div class="c-empty">${illus("takeaway")}<strong>No cards yet</strong><p>Scan the QR code on the counter when you pay at any CupCoff café. Your card appears here after the first scan.</p>
          <div class="c-empty-actions"><a class="btn btn-primary btn-sm" href="#c-scan">${icon("qr")}Scan for a stamp</a><a class="btn btn-secondary btn-sm" href="#c-discover">${icon("pin")}Find cafés</a></div></div>`}`;
  }

  async function renderCCard(main, alive, cafeId) {
    const [d, wallet] = await Promise.all([api.getCafeForCustomer(cafeId), api.getWallet()]);
    if (!alive()) return;
    const i = Math.max(0, wallet.findIndex((w) => w.id === cafeId));
    const ready = d.balance >= d.per;
    main.innerHTML = `<a class="c-back" href="#c-cards">${icon("chevron", "c-chev-l")}My cards</a>
      ${walletCard({ ...d, area: "" }, i, true)}
      <a class="btn btn-primary c-wide" href="#c-scan">${icon("qr")}${ready ? "Scan the café's code to use it" : "Scan for a stamp"}</a>
      <div class="c-facts"><div><b>${fmt(d.visits)}</b><span>visits</span></div><div><b>${fmt(d.rewards || 0)}</b><span>free drinks so far</span></div><div><b>${d.per}</b><span>stamps per reward</span></div></div>
      ${d.specials?.length ? `<div class="c-section-head"><h2>Just for you</h2></div>${d.specials.map((s) => `<div class="c-special">${illus("croissant")}<div><b>${esc(s.name)}</b><span>${s.expiresAt ? `Valid until ${fmtDate(s.expiresAt, { day: "numeric", month: "long" })}. ` : ""}Tell the barista when you order.</span></div></div>`).join("")}` : ""}
      ${d.favorites?.items?.length ? `<div class="c-section-head"><h2>Your usual</h2></div><div class="usual-row">${d.favorites.items.slice(0, 4).map((x) => `<span class="chip static">${esc(x.name)}</span>`).join("")}</div>` : ""}
      <div class="c-section-head"><h2>Branches</h2></div>
      <ul class="c-list">${d.branchesList.map((b) => `<li>${icon("pin")}<span><b>${esc(b.name)}</b><small>${esc(b.address || "")}</small></span></li>`).join("")}</ul>
      ${d.history?.length ? `<div class="c-section-head"><h2>History</h2></div>
        <ul class="c-list">${d.history.map((h) => `<li>${icon(h.type === "reward" ? "gift" : h.type === "join" ? "userPlus" : h.type === "special" ? "sparkle" : "stamp")}<span><b>${h.type === "stamp" ? (h.label ? esc(h.label) : `+${plural(h.qty, "stamp")}`) : h.type === "reward" ? "Free drink" : h.type === "join" ? "Joined" : esc(h.label || "Special reward")}</b><small>${esc(h.branch)}${h.items?.length ? `, ${esc(h.items.join(", "))}` : ""}</small></span><time>${rel(h.at)}</time></li>`).join("")}</ul>` : `<p class="muted" style="margin-top:16px">${d.home ? "" : "Demo café: history appears after your first visit."}</p>`}`;
  }

  // Scan tab: the customer scans the café's QR code. Also reached straight from the phone camera via /#c-scan?cafe=…
  async function renderCScan(main, alive) {
    const q = S.pendingScan; S.pendingScan = null;
    if (q) return handleCafeScan(main, alive, q);
    const cafes = await api.getDiscover();
    if (!alive()) return;
    main.innerHTML = `<section class="c-hello"><h1 class="squiggle">Scan for a stamp</h1><p class="muted" style="margin-top:6px">Paid at a CupCoff café? Scan the QR code on the counter. 1 stamp per visit.</p></section>
      <div class="c-codecard c-scanner">
        <div class="scanbox" id="scanbox"><video id="cVideo" playsinline muted hidden></video>
          <div class="scan-idle" id="scanIdle">${illus("takeaway", "scan-art")}<button class="btn btn-primary" id="camBtn">${icon("qr")}Open camera</button></div>
          <div class="scan-frame" aria-hidden="true" hidden id="scanFrame"></div></div>
        <p class="muted" id="camMsg" role="status" style="font-size:13.5px;margin-top:10px">Point the camera at the café's QR code.</p>
        <label class="btn btn-ghost btn-sm photo-btn">${icon("download")}Scan from a photo<input type="file" accept="image/*" capture="environment" id="photoIn" class="sr-only"></label>
      </div>
      <div class="note" style="margin-top:16px">${icon("sparkle")}<span>Your phone's normal camera works too: point it at the code and tap the link.</span></div>
      <div class="c-section-head"><h2>No sticker nearby?</h2><span class="demo-tag">${icon("flask")}Demo</span></div>
      <p class="muted" style="font-size:14px;margin-bottom:10px">Pretend you just scanned the code at:</p>
      <div class="usual-row">${cafes.slice(0, 5).map((x) => `<button class="chip" data-demo-cafe="${x.id}">${esc(x.name)}</button>`).join("")}</div>`;
    const msg = (t, err) => { const m = $("#camMsg"); if (m) { m.textContent = t; m.style.color = err ? "var(--crit)" : ""; } };
    const go = (raw) => {
      const p = api.parseCafeCode(raw);
      if (!p) { msg("That isn't a CupCoff café code. Look for the CupCoff sticker by the till.", true); return; }
      stopCamera(); handleCafeScan(main, alive, p);
    };
    $$("[data-demo-cafe]", main).forEach((btn) => btn.addEventListener("click", () => {
      const x = cafes.find((c) => c.id === btn.dataset.demoCafe);
      const p = x.id === "home" ? api.cafeScanParams(S.branches[0]?.id) : { cafe: x.id, b: "", n: x.name, p: x.per, r: x.reward };
      handleCafeScan(main, alive, p);
    }));
    $("#photoIn").addEventListener("change", async (e) => {
      const file = e.target.files[0]; e.target.value = "";
      if (!file) return;
      msg("Reading the photo…");
      try {
        const decode = await getDecoder();
        if (!decode) { msg("The scanner couldn't load. Use your phone's camera app instead.", true); return; }
        const text = await decode(await createImageBitmap(file));
        text ? go(text) : msg("No code found in that photo. Try again closer.", true);
      } catch { msg("That photo couldn't be read. Try again, or use your phone's camera app.", true); }
    });
    $("#camBtn").addEventListener("click", async () => {
      if (!navigator.mediaDevices?.getUserMedia) { msg("This browser can't open the camera here. Use your phone's camera app, or scan from a photo.", true); return; }
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }); }
      catch { msg("The camera isn't available. Allow camera access in the browser settings, or scan from a photo.", true); return; }
      const decode = await getDecoder();
      if (!decode) { stream.getTracks().forEach((t) => t.stop()); msg("The scanner couldn't load. Use your phone's camera app instead.", true); return; }
      const v = $("#cVideo"); v.srcObject = stream; v.hidden = false; $("#scanIdle").hidden = true; $("#scanFrame").hidden = false;
      await v.play().catch(() => {});
      msg("Scanning… hold the phone steady over the code.");
      let busyScan = false;
      camera = { stream, timer: setInterval(async () => {
        if (busyScan || !document.contains(v)) return;
        busyScan = true;
        try { const text = await decode(v); if (text) go(text); } catch { /* keep trying */ }
        busyScan = false;
      }, 280) };
    });
  }

  async function handleCafeScan(main, alive, q) {
    main.innerHTML = `<div class="skel" style="height:220px"></div>`;
    let pv;
    try { pv = await api.previewCafeScan(q); } catch (err) { return scanProblem(main, err.message); }
    if (!alive()) return;
    if (pv.member && pv.balance >= pv.per) {
      main.innerHTML = `<section class="c-hello"><h1 class="squiggle">Your reward is ready</h1><p class="muted" style="margin-top:6px">${esc(pv.reward)} at ${esc(pv.name)}</p></section>
        <div class="c-done-art">${illus("takeaway")}</div>
        <button class="btn btn-primary c-wide" id="useNow">${icon("gift")}Use it now</button>
        <button class="btn btn-secondary c-wide" id="saveIt" style="margin-top:10px">${icon("stamp")}Save it, just add a stamp</button>
        <p class="muted" style="font-size:13.5px;margin-top:12px;text-align:center">"Use it now" shows a green screen to give the barista.</p>`;
      $("#useNow").addEventListener("click", async (e) => {
        try { const r = await busy(e.currentTarget, () => api.redeemAtCafe(q)); if (alive()) showRedeemed(main, r); }
        catch (err) { scanProblem(main, err.message); }
      });
      $("#saveIt").addEventListener("click", () => addStamp(main, alive, q));
      return;
    }
    return addStamp(main, alive, q);
  }

  async function addStamp(main, alive, q) {
    let r;
    try { r = await api.scanCafe(q); }
    catch (err) { return scanProblem(main, err.message, err.code === "too_soon"); }
    const wallet = await api.getWallet();
    if (!alive()) return;
    const i = Math.max(0, wallet.findIndex((w) => w.id === r.cardId)), w = wallet[i] || { id: r.cardId, name: r.name, per: r.per, reward: r.reward, balance: r.balance, art: "takeaway" };
    const drinks = r.cardId === "home" && r.eventId ? await api.getCafeDrinks() : [];
    main.innerHTML = `<div class="c-done" role="status"><span class="c-check">${icon("check")}</span><h1>Stamp added</h1>
        <p>${esc(r.name)}${r.branch ? `, ${esc(r.branch)}` : ""}${r.joined ? `. Welcome! Your card is ready${r.welcome ? ", with a welcome stamp" : ""}.` : ""}</p></div>
      ${walletCard({ ...w, area: "" }, i, true)}
      ${r.rewardReady ? `<p class="c-left">Scan again on your next visit to use it.</p>` : ""}
      ${drinks.length ? `<div class="c-panel c-had"><b>What did you have?</b><span class="muted" style="font-size:13px">Optional. It helps ${esc(r.name)} know your favourites.</span>
        <div class="usual-row" style="margin-top:10px">${drinks.map((d) => `<button class="chip" data-drink="${d.id}" aria-pressed="false">${esc(d.name)}</button>`).join("")}</div>
        <button class="btn btn-secondary btn-sm" id="saveHad" style="margin-top:12px" disabled>Save</button></div>` : ""}
      <a class="btn btn-primary c-wide" href="#c-cards" style="margin-top:16px">Done</a>`;
    const picked = new Set();
    $$("[data-drink]", main).forEach((bt) => bt.addEventListener("click", () => {
      picked.has(bt.dataset.drink) ? picked.delete(bt.dataset.drink) : picked.add(bt.dataset.drink);
      bt.setAttribute("aria-pressed", picked.has(bt.dataset.drink)); $("#saveHad").disabled = !picked.size;
    }));
    $("#saveHad")?.addEventListener("click", async () => { await api.tagScanItems(r.eventId, [...picked]); $(".c-had").innerHTML = `<b>Thanks!</b><span class="muted" style="font-size:13px">Saved.</span>`; });
  }

  function showRedeemed(main, r) {
    const tick = () => { const t = $("#liveClock"); if (!t) { clearInterval(codeTimer); return; } t.textContent = new Date().toLocaleTimeString("en-GB"); };
    main.innerHTML = `<div class="c-live" role="status"><span class="c-check">${icon("gift")}</span>
        <p class="c-live-k">Show this to the barista</p><h1>${esc(r.reward)}</h1><p>${esc(r.name)}${r.branch ? `, ${esc(r.branch)}` : ""}</p>
        <p class="c-live-time">Confirmed <time id="liveClock"></time></p><span class="c-live-pulse" aria-hidden="true"></span></div>
      <p class="muted" style="font-size:13.5px;margin-top:12px;text-align:center">The clock keeps running, so the barista can see it isn't a screenshot.</p>
      <a class="btn btn-primary c-wide" href="#c-cards" style="margin-top:14px">Done</a>`;
    tick(); clearInterval(codeTimer); codeTimer = setInterval(tick, 1000);
  }

  function scanProblem(main, message, soon = false) {
    main.innerHTML = `<div class="empty" style="padding-top:28px">${illus(soon ? "pourover" : "milk")}<strong>${soon ? "Already stamped" : "That didn't work"}</strong><p>${esc(message)}</p></div>
      <a class="btn btn-primary c-wide" href="#c-cards">My cards</a>`;
  }

  async function renderCRewards(main, alive) {
    const wallet = await api.getWallet();
    const home = wallet.some((w) => w.home) ? await api.getCafeForCustomer("home") : { specials: [], name: "" };
    if (!alive()) return;
    const ready = wallet.filter((w) => w.balance >= w.per), soon = wallet.filter((w) => w.balance < w.per).sort((a, b) => (b.balance / b.per) - (a.balance / a.per));
    main.innerHTML = `<section class="c-hello"><h1 class="squiggle">Rewards</h1></section>
      ${ready.length || home.specials.length ? `<div class="c-section-head"><h2>Ready to use</h2></div>
        ${ready.map((w) => `<div class="c-reward">${illus("takeaway")}<div><b>${esc(w.reward)}</b><span>at ${esc(w.name)}</span></div><a class="btn btn-primary btn-sm" href="#c-scan">Use</a></div>`).join("")}
        ${home.specials.map((s) => `<div class="c-reward special">${illus("croissant")}<div><b>${esc(s.name)}</b><span>A thank-you from ${esc(home.name)}${s.expiresAt ? `, until ${fmtDate(s.expiresAt, { day: "numeric", month: "short" })}` : ""}</span></div><span class="muted" style="font-size:13px">Tell the barista</span></div>`).join("")}`
        : `<div class="empty">${illus("takeaway")}<strong>No rewards ready yet</strong><p>Keep collecting. Your closest one is below.</p></div>`}
      <div class="c-section-head"><h2>On the way</h2></div>
      ${soon.length ? "" : `<p class="muted">Your cards will show up here after your first visit.</p>`}
      ${soon.map((w) => `<a class="c-progress" href="#c-card-${w.id}"><span><b>${esc(w.name)}</b><small>${w.per - w.balance} more to a ${esc(w.reward.toLowerCase())}</small></span><span class="pop-bar"><i style="width:${(w.balance / w.per) * 100}%"></i></span></a>`).join("")}`;
  }

  async function renderCDiscover(main, alive) {
    const list = await api.getDiscover();
    if (!alive()) return;
    main.innerHTML = `<section class="c-hello"><h1 class="squiggle">Cafés near you</h1><p class="muted" style="margin-top:6px">Scan the QR code on the counter at any of them. Distances are a demo.</p></section>
      <ul class="c-cafes">${list.map((x) => `<li><span class="c-cafe-art">${illus(x.art)}</span><div><b>${esc(x.name)}</b><small>${esc(x.area || "")}, ${x.distance.toString().replace(".", ".")} km${x.branches > 1 ? `, ${x.branches} branches` : ""}</small>
        <span class="c-offer">${esc(/free (drink|coffee)/i.test(x.reward) ? `Buy ${x.per}, get the ${ordinal(x.per + 1)} free` : `${x.per} stamps: ${x.reward.toLowerCase()}`)}</span></div>
        ${x.joined ? `<span class="badge good">${icon("check")}In wallet</span>` : `<button class="btn btn-secondary btn-sm" data-join="${x.id}">${icon("plus")}Add</button>`}</li>`).join("")}</ul>`;
    $$("[data-join]", main).forEach((b) => b.addEventListener("click", async () => { const r = await api.joinCafe(b.dataset.join); toast(`${r.name} added to your cards${r.welcome ? ", with a welcome stamp" : ""}`); routeCustomer(); }));
  }

  async function renderCProfile(main, alive) {
    CS = await api.getCustomerSession();
    if (!alive()) return;
    const c = CS.customer, N = CS.notifications;
    main.innerHTML = `<section class="c-hello c-me"><span class="c-avatar big">${esc(c.displayName.split(" ").map((x) => x[0]).join("").slice(0, 2))}</span><div><h1>${esc(c.displayName)}</h1><p class="muted">${esc(c.email)}, code ${esc(c.id)}</p></div></section>
      <div class="c-section-head"><h2>Notifications</h2></div>
      <div class="c-panel">${[["nearReward", "When I'm one stamp away"], ["rewardReady", "When a reward is ready"], ["news", "News and offers from my cafés"]].map(([k, l]) => `<div class="setting-row"><span>${l}</span><label class="switch"><input type="checkbox" data-cn="${k}" ${N[k] ? "checked" : ""} aria-label="${l}"><span class="track"></span></label></div>`).join("")}</div>
      <div class="note" style="margin-top:16px">${icon("shield")}<span>Cafés see your first name, last initial and what you order there. Never your email or phone number.</span></div>
      <div class="c-section-head"><h2>Switch</h2></div>
      <div class="c-panel c-switch">
        <button class="btn btn-secondary c-wide" id="toCafe">${icon("store")}Open the café dashboard</button>
        <p class="muted" style="font-size:13.5px">Own or manage a café? The same app runs your loyalty program.</p>
      </div>
      <button class="btn btn-ghost c-wide" id="cOut" style="margin-top:12px;color:var(--crit)">${icon("logout")}Sign out</button>`;
    $$("[data-cn]", main).forEach((cb) => cb.addEventListener("change", async () => { CS.notifications = await api.setCustomerNotifications({ [cb.dataset.cn]: cb.checked }); toast("Saved"); }));
    $("#toCafe").addEventListener("click", () => switchTo("owner", "overview"));
    $("#cOut").addEventListener("click", async () => { await api.customerLogout(); renderCustomerSignIn("signin"); });
  }

  /* ================================================================ boot */
  let hashBound = false;
  if (!document.getElementById("ill-style")) document.head.insertAdjacentHTML("beforeend", `<style id="ill-style">${ILL_STYLE}</style>`);
  let entryShown = false;
  async function boot(afterLogin = false) {
    const h = location.hash.slice(1);
    // A direct link decides the side (#c-… = customer, any other #screen = café); otherwise use the last side chosen.
    if (!S.mode && h) saveMode(h.startsWith("c-") ? "customer" : "owner");
    S.mode = S.mode || readMode();
    if (!hashBound) {
      window.addEventListener("hashchange", () => {
        const nh = location.hash.slice(1), want = nh.startsWith("c-") ? "customer" : nh && nh !== "main" ? "owner" : null;
        if (want && want !== S.mode) { saveMode(want); boot(); return; } // a link to the other side's screen
        if (S.mode === "customer") routeCustomer(true); else if (S.session?.signedIn) route(true);
      });
      hashBound = true;
    }
    if (CONFIG.pwa && !window.claude) registerServiceWorker();
    // Opening the plain link (no #screen) always starts with "How will you use CupCoff?".
    // Direct links such as /#overview or /#c-cards still go straight to that screen.
    const firstLoad = !entryShown; entryShown = true;
    if (!S.mode || (firstLoad && !afterLogin && !h)) { renderRolePicker(); return; }
    if (S.mode === "customer") { await bootCustomer(); return; }
    S.session = await api.getSession();
    if (!S.session.signedIn) { renderSignIn(); return; }
    [S.branches, S.settings] = await Promise.all([api.getBranches(), api.getSettings()]);
    S.branchId = S.session.user.branchId || "";
    renderShell();
    if (afterLogin && !location.hash) location.hash = "overview";
    route();
    getDownloads();
  }
  boot();
}
