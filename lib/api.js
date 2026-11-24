/* CupCoff — dashboard data layer.
 *
 * EVERY screen reads and writes through `api` below. Nothing else touches data.
 *
 * CONFIG comes from lib/config.js (set through NEXT_PUBLIC_CUPCOFF_* env vars).
 * By default CONFIG.mode is "demo": calls are answered by an in-browser store of
 * realistic sample data (seeded, so every reload shows the same café).
 * When the backend is connected, set mode to "live" and fill in `live.*` with the
 * real endpoints. The endpoint names in the comments are PROPOSALS — they have
 * not been checked against the CupCoff repository yet.
 *
 * Brand scoping: every demo call is scoped to the signed-in manager's brand
 * (session.brand.id). The live backend must enforce this server-side too.
 */
import { CONFIG } from "./config";

const api = (() => {
  /* ---------------------------------------------------------------- utils */
  const DAY = 86400000;
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const TODAY = startOfDay(new Date());
  const NOW = new Date();
  const daysAgo = (n) => new Date(TODAY.getTime() - n * DAY);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const wait = (v) => new Promise((r) => setTimeout(() => r(clone(v)), CONFIG.demoLatencyMs));
  const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  function rng(seed) { // mulberry32
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const R = rng(20261120);
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* ------------------------------------------------------------ demo store */
  const store = {
    session: {
      user: { id: "u1", name: "Anna Petrosyan", firstName: "Anna", email: "anna@amberhill.coffee", role: "owner", branchId: null },
      brand: { id: "br_amber", name: "Amber Hill Coffee", slug: "amber-hill" },
      signedIn: CONFIG.mode !== "live",
    },
    branches: [
      { id: "b_cascade", name: "Cascade", address: "12 Tamanyan St, Yerevan", openedAt: daysAgo(330).toISOString(), weight: 0.37 },
      { id: "b_northern", name: "Northern Avenue", address: "5 Northern Ave, Yerevan", openedAt: daysAgo(300).toISOString(), weight: 0.31 },
      { id: "b_arabkir", name: "Arabkir", address: "48 Komitas Ave, Yerevan", openedAt: daysAgo(130).toISOString(), weight: 0.19 },
      { id: "b_davtashen", name: "Davtashen", address: "Davtashen district, Yerevan", openedAt: daysAgo(75).toISOString(), weight: 0.13 },
    ],
    settings: {
      profile: { brandName: "Amber Hill Coffee", contactEmail: "hello@amberhill.coffee", phone: "+374 10 555 012", timezone: "Asia/Yerevan", website: "amberhill.coffee" },
      loyalty: { stampsPerReward: 6, rewardName: "Free drink of choice", stampRule: "1 stamp per drink purchased", stampExpiryMonths: 12, welcomeStamp: true, maxStampsPerVisit: 3, scanCooldownMinutes: 30 },
      customerMessages: { nearReward: true, rewardReady: true, winBack: false, winBackDays: 30 },
      notifications: { weeklySummary: true, rewardRedeemed: false, newVip: true, billing: true, productNews: false },
      vipCriteria: { minVisits: 8, periodDays: 30, minRewards: 3, match: "all" },
    },
    team: [
      { id: "t1", name: "Anna Petrosyan", email: "anna@amberhill.coffee", role: "Owner", branch: "All branches", status: "Active" },
      { id: "t2", name: "Davit Grigoryan", email: "davit@amberhill.coffee", role: "Branch manager", branch: "Cascade", status: "Active" },
      { id: "t3", name: "Mariam Hakobyan", email: "mariam@amberhill.coffee", role: "Barista", branch: "Northern Avenue", status: "Active" },
      { id: "t4", name: "Narek Sargsyan", email: "narek@amberhill.coffee", role: "Barista", branch: "Arabkir", status: "Active" },
      { id: "t5", name: "Ani Hovhannisyan", email: "ani@amberhill.coffee", role: "Barista", branch: "Davtashen", status: "Invited" },
    ],
    customers: [],
    events: [],
    specialRewards: [],
    supportRequests: [],
    // Fixed pricing (business model doc): every café pays the same monthly price for the same features.
    // First branch at full price, each additional branch discounted. Figures are DEMO placeholders.
    pricing: {
      currency: "AMD", firstBranch: 9900, additionalBranch: 4900, trialDays: 30,
      included: ["CupCoff app for your customers (free for them)", "Owner dashboard and analytics", "Counter QR posters for every branch",
        "VIP segments and special rewards", "Team accounts and roles", "Support from the CupCoff team"],
      customFeatures: "Shop-specific features are quoted once, agreed with you before work starts, and then run with no extra monthly cost.",
    },
    subscription: null,
    payments: [],
  };

  /* Counter menu. Staff tap these when they scan a customer, which is what powers Insights.
   * pop = base popularity, like = chance a first-timer keeps ordering it, trend/season shape demo history. */
  store.menu = [
    { id: "cappuccino", name: "Cappuccino", cat: "Milk coffee", milk: true, pop: 1.0, like: 0.92 },
    { id: "latte", name: "Latte", cat: "Milk coffee", milk: true, pop: 0.8, like: 0.88 },
    { id: "flatwhite", name: "Flat white", cat: "Milk coffee", milk: true, pop: 0.45, like: 0.86 },
    { id: "raf", name: "Raf", cat: "Milk coffee", milk: true, pop: 0.38, like: 0.86, trend: 1.4 },
    { id: "americano", name: "Americano", cat: "Black coffee", pop: 0.75, like: 0.9 },
    { id: "espresso", name: "Espresso", cat: "Black coffee", pop: 0.42, like: 0.86 },
    { id: "armenian", name: "Armenian coffee", cat: "Black coffee", pop: 0.55, like: 0.94 },
    { id: "matcha", name: "Matcha latte", cat: "Other drinks", milk: true, pop: 0.22, like: 0.8, trend: 2.4 },
    { id: "cocoa", name: "Hot chocolate", cat: "Other drinks", milk: true, pop: 0.3, like: 0.82, season: "winter" },
    { id: "tea", name: "Tea", cat: "Other drinks", pop: 0.3, like: 0.85 },
    { id: "icedlatte", name: "Iced latte", cat: "Cold drinks", milk: true, pop: 0.45, like: 0.82, season: "summer" },
    { id: "tonic", name: "Espresso tonic", cat: "Cold drinks", pop: 0.28, like: 0.3, trend: -0.4 },
    { id: "croissant", name: "Croissant", cat: "Food", food: true, pop: 0.6, like: 0.86 },
    { id: "gata", name: "Gata", cat: "Food", food: true, pop: 0.35, like: 0.9 },
    { id: "cookie", name: "Cookie", cat: "Food", food: true, pop: 0.4, like: 0.6 },
  ];
  store.menu.forEach((m) => (m.enabled = true));
  const MILKS = ["Regular", "Oat", "Almond", "Lactose-free"];
  const MILK_BASE = [0.55, 0.26, 0.09, 0.1];

  /* customers + events (seeded simulation) */
  const FIRST = ["Lilit", "Aram", "Ani", "Tigran", "Mane", "Gor", "Nare", "Hayk", "Sona", "Arsen", "Mariam", "Levon", "Elen", "Karen", "Anush", "Vahe",
    "Emma", "Daniel", "Sofia", "Lucas", "Mila", "Leo", "Nina", "Alex", "Eva", "Mark", "Zara", "Robert", "Lusine", "Armen", "Diana", "Samvel", "Astghik", "Erik", "Inna", "Ruben"];
  const LAST_INITIAL = "ABDGHKMNPSTVZ";
  (function simulate() {
    const branchOpenDay = Object.fromEntries(store.branches.map((b) => [b.id, Math.round((TODAY - new Date(b.openedAt)) / DAY)]));
    const pickBranch = () => {
      let r = R(), acc = 0;
      for (const b of store.branches) { acc += b.weight; if (r <= acc) return b.id; }
      return store.branches[0].id;
    };
    const per = store.settings.loyalty.stampsPerReward;
    const usedIds = new Set();
    const drinks = store.menu.filter((m) => !m.food), foods = store.menu.filter((m) => m.food);
    const weighted = (list, wf) => { const tot = list.reduce((a, x) => a + wf(x), 0); let r = R() * tot; for (const x of list) { r -= wf(x); if (r <= 0) return x; } return list[list.length - 1]; };
    const seasonal = (m, date) => {
      const doy = (date - new Date(date.getFullYear(), 0, 0)) / DAY;
      if (m.season === "summer") return 0.15 + 1.6 * Math.max(0, Math.cos(((doy - 200) / 365) * 2 * Math.PI));
      if (m.season === "winter") return 0.3 + 1.3 * Math.max(0, Math.cos(((doy - 15) / 365) * 2 * Math.PI));
      return 1;
    };
    const trendF = (m, d) => Math.max(0.1, 1 + (m.trend || 0) * ((1 - d / 330) - 0.5));
    const pickMilk = (primary) => (R() < 0.85 ? primary : MILKS[Math.floor(R() * MILKS.length)]);
    let evSeq = 1;
    for (let n = 0; n < 186; n++) {
      let home = pickBranch();
      let regAgo = Math.floor(320 * Math.pow(R(), 1.35));
      if (regAgo > branchOpenDay[home] - 1) regAgo = Math.floor(R() * (branchOpenDay[home] - 1));
      let id; do { id = "CC-" + (1000 + Math.floor(R() * 9000)); } while (usedIds.has(id)); usedIds.add(id);
      const c = { id, displayName: `${pick(FIRST)} ${LAST_INITIAL[Math.floor(R() * LAST_INITIAL.length)]}.`, homeBranchId: home,
        registeredAt: null, stampBalance: 0, totalVisits: 0, totalStamps: 0, rewardsRedeemed: 0, lastActivityAt: null };
      const ratePerWeek = Math.min(6, Math.max(0.15, Math.exp(gauss() * 0.75 + Math.log(0.95))));
      const stopAgo = R() < 0.28 ? Math.floor(R() * regAgo) : -1; // churned customers
      // personal taste: favourite drinks, milk, food habit, time of day
      const taste = Object.fromEntries(drinks.map((m) => [m.id, m.pop * Math.exp(gauss() * 0.9)]));
      const tried = new Set(), disliked = new Set();
      const milkPrimary = weighted(MILKS.map((x, i) => ({ x, w: MILK_BASE[i] })), (o) => o.w).x;
      const foodHabit = R() * 0.45;
      const peak = weighted([{ h: 8.6, w: 0.48 }, { h: 13, w: 0.32 }, { h: 17.4, w: 0.2 }], (o) => o.w).h;
      for (let d = regAgo; d >= 0; d--) {
        if (d <= stopAgo) break;
        const date = daysAgo(d);
        const first = d === regAgo;
        const dow = date.getDay();
        const p = (ratePerWeek / 7) * (dow === 6 || dow === 0 ? 1.25 : 0.95);
        if (!first && R() > p) continue;
        const hour = Math.min(21, Math.max(8, Math.round(peak + gauss() * 1.6 + (dow === 6 || dow === 0 ? 1.2 : 0))));
        const ts = new Date(date.getTime() + hour * 3600000 + Math.floor(R() * 60) * 60000);
        if (d === 0 && ts > NOW) continue;
        let branch = home;
        if (R() < 0.14) { const others = store.branches.filter((b) => b.id !== home && branchOpenDay[b.id] > d); if (others.length) branch = pick(others).id; }
        if (first) {
          c.registeredAt = ts.toISOString();
          store.events.push({ id: "e" + evSeq++, customerId: id, branchId: branch, type: "join", qty: 0, at: ts.toISOString() });
        }
        const qty = R() < 0.1 ? 2 : 1;
        const sTs = new Date(ts.getTime() + 60000);
        const items = [];
        for (let k = 0; k < qty; k++) {
          const explore = R() < 0.1;
          const m = weighted(drinks.filter((x) => !disliked.has(x.id)), (x) => (explore ? x.pop : taste[x.id]) * seasonal(x, date) * trendF(x, d));
          if (!tried.has(m.id)) { tried.add(m.id); if (R() > m.like) disliked.add(m.id); }
          items.push(m.milk ? { id: m.id, milk: pickMilk(milkPrimary) } : { id: m.id });
        }
        if (R() < foodHabit) { const f = weighted(foods.filter((x) => !disliked.has(x.id)), (x) => x.pop); if (f) { if (!tried.has(f.id)) { tried.add(f.id); if (R() > f.like) disliked.add(f.id); } items.push({ id: f.id }); } }
        store.events.push({ id: "e" + evSeq++, customerId: id, branchId: branch, type: "stamp", qty, items, at: sTs.toISOString() });
        c.stampBalance += qty; c.totalStamps += qty; c.totalVisits++; c.lastActivityAt = sTs.toISOString();
        if (c.stampBalance >= per && R() < 0.8) {
          const rTs = new Date(sTs.getTime() + 120000);
          store.events.push({ id: "e" + evSeq++, customerId: id, branchId: branch, type: "reward", qty: per, at: rTs.toISOString() });
          c.stampBalance -= per; c.rewardsRedeemed++; c.lastActivityAt = rTs.toISOString();
        }
      }
      if (c.registeredAt) store.customers.push(c);
    }
    store.events.sort((a, b) => (a.at < b.at ? 1 : -1));
  })();

  /* subscription + payments */
  (function billing() {
    const P = store.pricing;
    const trialEnd = daysAgo(212);
    const renew = new Date(TODAY.getTime() + 9 * DAY);
    store.subscription = { status: "active", currency: P.currency, autoRenew: true,
      trialStartedAt: new Date(trialEnd.getTime() - P.trialDays * DAY).toISOString(), trialEndedAt: trialEnd.toISOString(), trialDays: P.trialDays,
      currentPeriodStart: new Date(renew.getTime() - 30 * DAY).toISOString(), renewsAt: renew.toISOString(), cancelAtPeriodEnd: false,
      paymentMethod: { label: "Linked bank card", last4: "4242", simulated: true } };
    const branchesOpenOn = (date) => store.branches.filter((b) => new Date(b.openedAt) <= date).length;
    const price = (n) => P.firstBranch + Math.max(0, n - 1) * P.additionalBranch;
    const desc = (n) => `Monthly subscription, ${n} branch${n === 1 ? "" : "es"}`;
    let n = 37;
    for (let i = 7; i >= 0; i--) {
      const date = new Date(renew.getTime() - (i + 1) * 30 * DAY);
      if (date < trialEnd) continue;
      const nb = Math.max(1, branchesOpenOn(date));
      const inv = (d) => `INV-${d.getFullYear()}-${String(n++).padStart(4, "0")}`;
      if (i === 4) store.payments.push({ id: "p" + n, date: date.toISOString(), amount: price(nb), currency: P.currency, status: "failed", invoice: inv(date), description: desc(nb), branches: nb,
        note: "The bank declined the charge. We notified you, retried two days later, and the CupCoff team followed up by phone." });
      const d2 = i === 4 ? new Date(date.getTime() + 2 * DAY) : date;
      store.payments.push({ id: "p" + n, date: d2.toISOString(), amount: price(nb), currency: P.currency, status: "paid", invoice: inv(d2), description: desc(nb), branches: nb });
    }
    store.payments.push({ id: "p_next", date: renew.toISOString(), amount: 0, currency: P.currency, status: "upcoming", invoice: "Issued on payment", description: "", branches: 0 });
    store.payments.reverse();
  })();

  /* ------------------------------------------------------------ a café registered in the demo (sign-up flow) */
  // Demo: the new café takes over the sample data (customers, stamps, activity), renamed to the café, owner and
  // branch that were entered, so the owner lands on a full dashboard. It starts on the 30-day free trial.
  function startNewCafe({ brandName, ownerName, email, branchName, branchAddress, stampsPerReward, rewardName }) {
    const trialEnd = new Date(TODAY.getTime() + store.pricing.trialDays * DAY);
    store.session.user = { id: "u_new", name: ownerName.trim(), firstName: ownerName.trim().split(/\s+/)[0], email: email.trim(), role: "owner", branchId: null };
    store.session.brand = { id: "br_new", name: brandName.trim(), slug: slug(brandName), isNew: false };
    store.session.signedIn = true;
    // All sample branches become the one branch that was registered; customers and activity move with them.
    const newId = "b_" + slug(branchName), oldIds = new Set(store.branches.map((b) => b.id));
    const firstOpened = store.branches.reduce((a, b) => (new Date(b.openedAt) < new Date(a) ? b.openedAt : a), NOW.toISOString());
    store.branches.splice(0, store.branches.length, { id: newId, name: branchName.trim(), address: (branchAddress || "").trim(), openedAt: firstOpened, weight: 1 });
    const moveBranch = (o) => { for (const k of ["branchId", "homeBranchId"]) if (o && oldIds.has(o[k])) o[k] = newId; };
    [store.customers, store.events, store.specialRewards, store.supportRequests].forEach((list) => list.forEach(moveBranch));
    store.team.splice(0, store.team.length, { id: "t1", name: ownerName.trim(), email: email.trim(), role: "Owner", branch: "All branches", status: "Active" },
      ...store.team.filter((t) => t.role !== "Owner").map((t) => ({ ...t, branch: branchName.trim() })));
    store.settings.profile = { ...store.settings.profile, brandName: brandName.trim(), contactEmail: email.trim(), phone: "", website: "" };
    store.settings.loyalty = { ...store.settings.loyalty, stampsPerReward: Number(stampsPerReward) || 6, rewardName: (rewardName || "Free drink of choice").trim() };
    store.subscription = { status: "trial", currency: store.pricing.currency, autoRenew: true, trialStartedAt: TODAY.toISOString(), trialEndsAt: trialEnd.toISOString(), trialEndedAt: null,
      trialDays: store.pricing.trialDays, currentPeriodStart: TODAY.toISOString(), renewsAt: trialEnd.toISOString(), cancelAtPeriodEnd: false, paymentMethod: null };
    store.payments.splice(0, store.payments.length, { id: "p_next", date: trialEnd.toISOString(), amount: 0, currency: store.pricing.currency, status: "upcoming", invoice: "Issued on payment", description: "", branches: 0 });
    store.setup = null; // straight to the full Overview, no setup checklist
    testSeq = 0;
    return clone(store.session);
  }
  let testSeq = 0;

  /* ------------------------------------------------------------ the customer side (CupCoff app) */
  // Other cafés on CupCoff, invented for the demo. The customer's card at the owner's café is real demo data.
  const OTHER_CAFES = [
    { id: "blue-door", name: "Blue Door Coffee", area: "Kentron", distance: 0.6, branches: 1, per: 8, reward: "Free drink of choice", art: "pourover", balance: 5, visits: 13 },
    { id: "slow-pour", name: "Slow Pour", area: "Arabkir", distance: 2.1, branches: 2, per: 6, reward: "Free filter coffee", art: "moka", balance: 2, visits: 4 },
    { id: "honey-oven", name: "Honey & Oven", area: "Kentron", distance: 0.9, branches: 1, per: 7, reward: "Free pastry with any drink", art: "croissant", balance: 0, visits: 0 },
    { id: "north-steam", name: "North Steam", area: "Komitas", distance: 3.4, branches: 3, per: 10, reward: "Free drink of choice", art: "machine", balance: 0, visits: 0 },
  ];
  store.customerSession = { signedIn: false, customerId: null, email: null, joinedOther: new Set(), notifications: { nearReward: true, rewardReady: true, news: false } };
  const SAMPLE_JOINED = ["blue-door", "slow-pour"];

  // A customer who signed up on this device is remembered in this browser (demo only; live data lives on the server).
  const ME_KEY = "cupcoff.me";
  const hasLS = () => { try { return typeof localStorage !== "undefined" && !!localStorage; } catch { return false; } };
  function persistMe() {
    if (!hasLS()) return;
    try {
      const cs = store.customerSession, c = store.customers.find((x) => x.id === cs.customerId && x.self);
      const mine = store.customers.filter((x) => x.self);
      localStorage.setItem(ME_KEY, JSON.stringify({
        session: { signedIn: cs.signedIn, customerId: cs.customerId, email: cs.email, joinedOther: [...cs.joinedOther], notifications: cs.notifications, sample: !c },
        customers: mine, events: store.events.filter((e) => mine.some((m) => m.id === e.customerId)),
      }));
    } catch { /* storage full or blocked: the demo still works for this visit */ }
  }
  function restoreMe() {
    if (!hasLS()) return;
    try {
      const d = JSON.parse(localStorage.getItem(ME_KEY) || "null");
      if (!d) return;
      (d.customers || []).forEach((c) => { if (!store.customers.some((x) => x.id === c.id)) store.customers.unshift(c); });
      const known = new Set(store.events.map((e) => e.id));
      (d.events || []).forEach((e) => { if (!known.has(e.id)) store.events.push(e); });
      store.events.sort((a, b) => (a.at < b.at ? 1 : -1));
      Object.assign(store.customerSession, { ...d.session, joinedOther: new Set(d.session.joinedOther || []) });
      if (!store.customers.some((x) => x.id === store.customerSession.customerId)) store.customerSession.signedIn = false;
    } catch { /* ignore broken saved data */ }
  }
  const newCustomerId = () => { let id; do { id = "CC-" + (1000 + Math.floor(Math.random() * 9000)); } while (store.customers.some((c) => c.id === id)); return id; };
  // First time a customer is scanned at (or adds) the café: membership starts, plus the welcome stamp if the café gives one.
  function makeMember(c, branchId) {
    if (c.memberHome !== false) return;
    const at = new Date(), br = branchId || store.branches[0].id;
    c.memberHome = true; c.homeBranchId = br; c.registeredAt = at.toISOString(); c.lastActivityAt = at.toISOString();
    store.events.unshift({ id: "e_join_" + c.id + at.getTime(), customerId: c.id, branchId: br, type: "join", qty: 0, at: at.toISOString() });
    if (store.settings.loyalty.welcomeStamp) {
      store.events.unshift({ id: "e_welcome_" + c.id + at.getTime(), customerId: c.id, branchId: br, type: "stamp", qty: 1, items: [], label: "Welcome stamp", at: new Date(at.getTime() + 1000).toISOString() });
      c.stampBalance += 1; c.totalStamps += 1;
    }
  }
  const pickDemoCustomer = () => {
    const per = store.settings.loyalty.stampsPerReward;
    const ok = store.customers.filter((c) => !c.isTest && customerStatus(c) === "active" && c.stampBalance >= 2 && c.stampBalance <= per - 2 && c.totalVisits >= 8);
    return (ok.find((c) => favoritesOf(c.id).items.length >= 3) || ok[0] || store.customers[0])?.id || null;
  };

  /* ------------------------------------------------------------ helpers */
  const brandScoped = () => store.session.brand.id; // all demo data belongs to this brand
  const inBranch = (branchId) => (e) => !branchId || e.branchId === branchId;
  const customerStatus = (c) => {
    const last = (TODAY - startOfDay(c.lastActivityAt)) / DAY;
    const reg = (TODAY - startOfDay(c.registeredAt)) / DAY;
    if (reg <= 14) return "new";
    if (last <= 30) return "active";
    if (last <= 60) return "at-risk";
    return "inactive";
  };
  const branchName = (id) => store.branches.find((b) => b.id === id)?.name || "Unknown branch";
  const withStatus = (c) => ({ ...c, status: customerStatus(c), homeBranch: branchName(c.homeBranchId) });
  const menuItem = (id) => store.menu.find((m) => m.id === id);
  const lastStamp = (cid) => store.events.find((e) => e.customerId === cid && e.type === "stamp");
  function favoritesOf(cid) {
    const ev = store.events.filter((e) => e.customerId === cid && e.items);
    const n = {}, milk = {}, hours = [];
    ev.forEach((e) => { hours.push(new Date(e.at).getHours()); e.items.forEach((it) => { n[it.id] = (n[it.id] || 0) + 1; if (it.milk) milk[it.milk] = (milk[it.milk] || 0) + 1; }); });
    const items = Object.entries(n).sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ id, name: menuItem(id).name, food: !!menuItem(id).food, count }));
    const topMilk = Object.entries(milk).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const avgH = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null;
    const usualDrink = items.find((i) => !i.food) || null;
    return { items: items.slice(0, 5), milk: topMilk, timeOfDay: avgH === null ? null : avgH < 11.5 ? "Mornings" : avgH < 16 ? "Middays" : "Evenings",
      usual: usualDrink ? { id: usualDrink.id, milk: menuItem(usualDrink.id).milk ? topMilk || "Regular" : undefined } : null };
  }

  function customersForBranch(branchId) {
    if (!branchId) return store.customers.filter((c) => c.memberHome !== false);
    const ids = new Set(store.events.filter(inBranch(branchId)).map((e) => e.customerId));
    return store.customers.filter((c) => ids.has(c.id));
  }

  function bucketKey(date, bucket) {
    const d = startOfDay(date);
    if (bucket === "week") { const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); }
    if (bucket === "month") d.setDate(1);
    return d.getTime();
  }

  /* ------------------------------------------------------------ demo API */
  const demo = {
    // GET /api/auth/me
    getSession: () => wait(store.session),
    // POST /api/auth/logout
    logout: () => { store.session.signedIn = false; return wait({ ok: true }); },
    login: () => { store.session.signedIn = true; return wait(store.session); },
    // POST /api/auth/register + brand setup. Demo: starts an empty café.
    registerCafe: (d) => {
      const bad = [];
      if (!String(d.brandName || "").trim()) bad.push("your café's name");
      if (!String(d.ownerName || "").trim()) bad.push("your name");
      if (!/^\S+@\S+\.\S+$/.test(d.email || "")) bad.push("a valid email");
      if (String(d.password || "").length < 6) bad.push("a password of at least 6 characters");
      if (!String(d.branchName || "").trim()) bad.push("your first branch's name");
      if (bad.length) return Promise.reject(new Error("Add " + bad.join(", ") + "."));
      return wait(startNewCafe(d));
    },
    getSetup: () => wait(store.setup || null),
    completeSetupStep: (key) => { if (store.setup && key in store.setup) store.setup[key] = true; return wait(store.setup || null); },
    // (new café) a pretend customer so the owner can try a scan before real customers arrive
    createTestCustomer: () => {
      const id = "CC-" + String(1001 + testSeq++).padStart(4, "0");
      const c = { id, displayName: testSeq === 1 ? "Test customer" : `Test customer ${testSeq}`, homeBranchId: store.branches[0].id, registeredAt: new Date().toISOString(),
        stampBalance: 0, totalVisits: 0, totalStamps: 0, rewardsRedeemed: 0, lastActivityAt: new Date().toISOString(), isTest: true };
      store.customers.unshift(c);
      store.events.unshift({ id: "e_join_" + id, customerId: id, branchId: c.homeBranchId, type: "join", qty: 0, at: c.registeredAt });
      return wait({ ...withStatus(c) });
    },
    /* ---------------- customer app ---------------- */
    // POST /api/customers/login (planned). Demo: signs in as a real customer of the sample café.
    // POST /api/customers  (planned). Creates the customer's own account and code.
    customerSignUp: ({ name, email }) => {
      const n = String(name || "").trim().replace(/\s+/g, " "), e = String(email || "").trim().toLowerCase();
      if (!n) return Promise.reject(new Error("Enter your name."));
      if (!/^\S+@\S+\.\S+$/.test(e)) return Promise.reject(new Error("Enter a valid email address."));
      let c = store.customers.find((x) => x.self && x.email === e);
      if (!c) {
        const parts = n.split(" "), display = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
        c = { id: newCustomerId(), displayName: display, fullName: n, email: e, self: true, memberHome: false, homeBranchId: store.branches[0]?.id,
          registeredAt: new Date().toISOString(), stampBalance: 0, totalVisits: 0, totalStamps: 0, rewardsRedeemed: 0, lastActivityAt: new Date().toISOString() };
        store.customers.unshift(c);
      }
      Object.assign(store.customerSession, { signedIn: true, customerId: c.id, email: e, joinedOther: new Set() });
      persistMe();
      return demo.getCustomerSession();
    },
    // POST /api/customers/login (planned). Demo: an account created on this device, or the sample customer.
    customerLogin: ({ email, sample } = {}) => {
      if (sample) {
        const id = pickDemoCustomer();
        if (!id) return Promise.reject(new Error("No sample customers in this café yet."));
        Object.assign(store.customerSession, { signedIn: true, customerId: id, email: null, joinedOther: new Set(SAMPLE_JOINED) });
        persistMe();
        return demo.getCustomerSession();
      }
      const e = String(email || "").trim().toLowerCase();
      const c = store.customers.find((x) => x.self && x.email === e);
      if (!c) return Promise.reject(new Error("There's no account with that email on this phone yet. Create one with your name and email."));
      Object.assign(store.customerSession, { signedIn: true, customerId: c.id, email: e });
      persistMe();
      return demo.getCustomerSession();
    },
    customerLogout: () => { store.customerSession.signedIn = false; persistMe(); return wait({ ok: true }); },
    getCustomerSession: () => {
      const cs = store.customerSession, c = cs.customerId && store.customers.find((x) => x.id === cs.customerId);
      if (!cs.signedIn || !c) return wait({ signedIn: false });
      const first = (c.fullName || c.displayName).split(" ")[0];
      return wait({ signedIn: true, customer: { id: c.id, displayName: c.fullName || c.displayName, firstName: first, email: c.email || cs.email || `${first.toLowerCase()}@example.am`, isNew: !!c.self }, notifications: cs.notifications });
    },
    // GET /api/me/cards : every café card in the customer's wallet
    getWallet: () => {
      const cs = store.customerSession, c = store.customers.find((x) => x.id === cs.customerId);
      if (!c) return Promise.reject(new Error("Sign in again."));
      const L = store.settings.loyalty;
      const own = { id: "home", name: store.session.brand.name, area: store.branches.map((b) => b.name).slice(0, 3).join(", "), branches: store.branches.length,
        per: L.stampsPerReward, reward: L.rewardName, balance: c.stampBalance, visits: c.totalVisits, rewards: c.rewardsRedeemed, art: "latte", joined: true, home: true,
        lastAt: c.lastActivityAt, joinedAt: c.registeredAt };
      const others = OTHER_CAFES.filter((x) => cs.joinedOther.has(x.id)).map((x) => c.self ? { ...x, balance: 0, visits: 0, rewards: 0 } : { ...x, rewards: Math.floor(x.visits / x.per) });
      return wait([...(c.memberHome === false ? [] : [own]), ...others]);
    },
    getCafeForCustomer: (cafeId) => {
      const cs = store.customerSession, c = store.customers.find((x) => x.id === cs.customerId);
      if (cafeId !== "home") { const x = OTHER_CAFES.find((o) => o.id === cafeId); return x ? wait({ ...x, ...(c.self ? { balance: 0, visits: 0, rewards: 0 } : {}), history: [], branchesList: [{ name: x.area, address: `${x.area}, Yerevan` }] }) : Promise.reject(new Error("Café not found.")); }
      if (c.memberHome === false) return Promise.reject(new Error("You don't have a card here yet."));
      const L = store.settings.loyalty;
      const history = store.events.filter((e) => e.customerId === c.id).slice(0, 12).map((e) => ({ type: e.type, qty: e.qty, at: e.at, branch: branchName(e.branchId), label: e.label,
        items: (e.items || []).map((it) => menuItem(it.id)?.name + (it.milk && it.milk !== "Regular" ? ` (${it.milk.toLowerCase()})` : "")) }));
      const specials = store.specialRewards.filter((r) => r.customerIds.includes(c.id));
      return wait({ id: "home", name: store.session.brand.name, per: L.stampsPerReward, reward: L.rewardName, stampRule: L.stampRule, balance: c.stampBalance, visits: c.totalVisits,
        rewards: c.rewardsRedeemed, history, specials, favorites: favoritesOf(c.id), branchesList: store.branches.map((b) => ({ name: b.name, address: b.address })), joined: true, home: true, art: "latte" });
    },
    getDiscover: () => {
      const L = store.settings.loyalty;
      const cs = store.customerSession, me = store.customers.find((x) => x.id === cs.customerId);
      return wait([{ id: "home", name: store.session.brand.name, area: store.branches[0]?.name, distance: 0.4, branches: store.branches.length, per: L.stampsPerReward, reward: L.rewardName, art: "latte", joined: !!me && me.memberHome !== false },
        ...OTHER_CAFES.map(({ balance, visits, ...x }) => ({ ...x, joined: cs.joinedOther.has(x.id) }))].sort((a, b) => a.distance - b.distance));
    },
    joinCafe: (cafeId) => {
      const cs = store.customerSession, me = store.customers.find((x) => x.id === cs.customerId);
      if (cafeId === "home") { if (!me) return Promise.reject(new Error("Sign in again.")); makeMember(me); persistMe(); return wait({ ok: true, name: store.session.brand.name, welcome: store.settings.loyalty.welcomeStamp }); }
      const x = OTHER_CAFES.find((o) => o.id === cafeId); if (!x) return Promise.reject(new Error("Café not found."));
      cs.joinedOther.add(x.id); persistMe(); return wait({ ok: true, name: x.name });
    },
    setCustomerNotifications: (patch) => { Object.assign(store.customerSession.notifications, patch); persistMe(); return wait(store.customerSession.notifications); },
    // The code a customer shows. Live: a signed token that changes every minute. Demo: code + minute stamp.
    customerCode: () => `CUPCOFF:${store.customerSession.customerId}:${Math.floor(Date.now() / 60000).toString(36)}`,

    // (demo only) switch role to show permission-gated UI
    setDemoRole: (role) => {
      store.session.user.role = role;
      store.session.user.branchId = role === "branch_manager" ? "b_cascade" : null;
      store.session.user.name = role === "owner" ? "Anna Petrosyan" : "Davit Grigoryan";
      store.session.user.firstName = role === "owner" ? "Anna" : "Davit";
      return wait(store.session);
    },

    // GET /api/brands/:brandId/branches
    getBranches: () => wait(store.branches.map(({ weight, ...b }) => b)),
    // POST /api/brands/:brandId/branches   (owner only)
    createBranch: ({ name, address }) => {
      if (store.session.user.role !== "owner") return Promise.reject(new Error("Only owners can add branches."));
      if (!name?.trim()) return Promise.reject(new Error("Enter a branch name."));
      if (store.branches.some((b) => b.name.toLowerCase() === name.trim().toLowerCase())) return Promise.reject(new Error(`A branch called "${name.trim()}" already exists.`));
      const b = { id: "b_" + slug(name) + "_" + Date.now().toString(36), name: name.trim(), address: (address || "").trim(), openedAt: NOW.toISOString(), weight: 0 };
      store.branches.push(b);
      const { weight, ...out } = b;
      return wait(out);
    },
    // PATCH /api/branches/:id
    updateBranch: (id, patch) => {
      const b = store.branches.find((x) => x.id === id);
      if (!b) return Promise.reject(new Error("Branch not found."));
      Object.assign(b, { name: patch.name?.trim() || b.name, address: patch.address ?? b.address });
      const { weight, ...out } = b;
      return wait(out);
    },

    // GET /api/brands/:brandId/overview?branchId=
    getOverview: ({ branchId } = {}) => {
      const ev = store.events.filter(inBranch(branchId));
      const cust = customersForBranch(branchId);
      const since = (n) => daysAgo(n).toISOString();
      const active30 = new Set(ev.filter((e) => e.at >= since(30)).map((e) => e.customerId));
      const sum = (arr, f) => arr.reduce((a, e) => a + f(e), 0);
      const stamps = ev.filter((e) => e.type === "stamp");
      const rewards = ev.filter((e) => e.type === "reward");
      const todayStamps = sum(stamps.filter((e) => e.at >= TODAY.toISOString()), (e) => e.qty);
      return wait({
        brandId: brandScoped(),
        totalCustomers: cust.length,
        newCustomers7d: ev.filter((e) => e.type === "join" && e.at >= since(7)).length,
        totalStamps: sum(stamps, (e) => e.qty),
        stamps7d: sum(stamps.filter((e) => e.at >= since(7)), (e) => e.qty),
        rewardsRedeemed: rewards.length,
        rewards7d: rewards.filter((e) => e.at >= since(7)).length,
        activeCustomers: active30.size,
        activeShare: cust.length ? active30.size / cust.length : 0,
        today: (() => {
          const t0 = TODAY.toISOString(), lw0 = daysAgo(7).toISOString(), lwNow = new Date(Date.now() - 7 * DAY).toISOString();
          const tv = stamps.filter((e) => e.at >= t0);
          const items = {}; tv.forEach((e) => (e.items || []).forEach((it) => (items[it.id] = (items[it.id] || 0) + 1)));
          const byBranch = {}; tv.forEach((e) => (byBranch[e.branchId] = (byBranch[e.branchId] || 0) + 1));
          const topBranch = Object.entries(byBranch).sort((x, y) => y[1] - x[1])[0];
          return { stamps: todayStamps, visits: tv.length, rewards: rewards.filter((e) => e.at >= t0).length,
            joins: ev.filter((e) => e.type === "join" && e.at >= t0).length,
            sameTimeLastWeek: stamps.filter((e) => e.at >= lw0 && e.at <= lwNow).length,
            firstAt: tv.length ? tv[tv.length - 1].at : null, lastAt: tv.length ? tv[0].at : null,
            topItems: Object.entries(items).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([id, n]) => ({ name: menuItem(id)?.name || id, count: n })),
            topBranch: topBranch && !branchId ? { name: branchName(topBranch[0]), visits: topBranch[1] } : null };
        })(),
        // 30 daily points for the sparklines on the key figures
        trend: (() => {
          const days = Array.from({ length: 30 }, (_, i) => daysAgo(29 - i));
          const dayKey = (iso) => Math.round((startOfDay(iso) - days[0]) / DAY);
          const st = Array(30).fill(0), rw = Array(30).fill(0), jn = Array(30).fill(0);
          const first = days[0].toISOString();
          ev.forEach((e) => { if (e.at < first) return; const k = dayKey(e.at); if (k < 0 || k > 29) return;
            if (e.type === "stamp") st[k] += e.qty; else if (e.type === "reward") rw[k]++; else if (e.type === "join") jn[k]++; });
          let base = cust.filter((c) => c.registeredAt < first).length;
          const customers = jn.map((n) => (base += n));
          const active = days.map((d) => { const end = new Date(d.getTime() + DAY).toISOString(), start = new Date(d.getTime() - 29 * DAY).toISOString();
            return new Set(ev.filter((e) => e.at >= start && e.at < end).map((e) => e.customerId)).size; });
          return { customers, stamps: st, rewards: rw, active };
        })(),
      });
    },

    // GET /api/brands/:brandId/activity?branchId=&limit=
    getActivity: ({ branchId, limit = 12, customerId } = {}) => {
      let ev = store.events.filter(inBranch(branchId));
      if (customerId) ev = ev.filter((e) => e.customerId === customerId);
      const named = Object.fromEntries(store.customers.map((c) => [c.id, c.displayName]));
      return wait(ev.slice(0, limit).map((e) => ({ ...e, customerName: named[e.customerId], branch: branchName(e.branchId) })));
    },

    // GET /api/brands/:brandId/analytics?branchId=&from=&to=
    getAnalytics: ({ branchId, from, to }) => {
      const f = startOfDay(from), t = new Date(startOfDay(to).getTime() + DAY - 1);
      const spanDays = Math.round((t - f) / DAY) + 1;
      const bucket = spanDays <= 45 ? "day" : spanDays <= 200 ? "week" : "month";
      const fIso = f.toISOString(), tIso = t.toISOString();
      const inRange = (e) => e.at >= fIso && e.at <= tIso;
      const all = store.events.filter(inBranch(branchId));
      const ev = all.filter(inRange);

      // first visit per customer (for "repeat visit" = any visit after the first)
      const firstStamp = {};
      [...store.events].reverse().forEach((e) => { if (e.type === "stamp" && !firstStamp[e.customerId]) firstStamp[e.customerId] = e.id; });

      const keys = [];
      for (let d = new Date(f); d <= t; d = new Date(d.getTime() + DAY)) { const k = bucketKey(d, bucket); if (keys[keys.length - 1] !== k) keys.push(k); }
      const series = (filter, val = () => 1) => {
        const m = new Map(keys.map((k) => [k, 0]));
        ev.filter(filter).forEach((e) => { const k = bucketKey(e.at, bucket); if (m.has(k)) m.set(k, m.get(k) + val(e)); });
        return keys.map((k) => ({ t: k, v: m.get(k) }));
      };
      const registrations = series((e) => e.type === "join");
      const repeatVisits = series((e) => e.type === "stamp" && firstStamp[e.customerId] !== e.id);
      const stamps = series((e) => e.type === "stamp", (e) => e.qty);
      const rewards = series((e) => e.type === "reward");

      // previous period for comparison
      const pf = new Date(f.getTime() - spanDays * DAY).toISOString(), pt = new Date(f.getTime() - 1).toISOString();
      const prev = all.filter((e) => e.at >= pf && e.at <= pt);
      const total = (arr, type, val = () => 1, extra = () => true) => arr.filter((e) => e.type === type && extra(e)).reduce((a, e) => a + val(e), 0);
      const isRepeat = (e) => firstStamp[e.customerId] !== e.id;
      const totals = {
        registrations: [total(ev, "join"), total(prev, "join")],
        repeatVisits: [total(ev, "stamp", () => 1, isRepeat), total(prev, "stamp", () => 1, isRepeat)],
        stamps: [total(ev, "stamp", (e) => e.qty), total(prev, "stamp", (e) => e.qty)],
        rewards: [total(ev, "reward"), total(prev, "reward")],
      };

      const byBranch = store.branches.filter((b) => !branchId || b.id === branchId).map((b) => {
        const bev = ev.filter((e) => e.branchId === b.id);
        return { id: b.id, name: b.name, visits: total(bev, "stamp"), stamps: total(bev, "stamp", (e) => e.qty), rewards: total(bev, "reward"), registrations: total(bev, "join") };
      });

      const counts = {};
      ev.filter((e) => e.type === "stamp").forEach((e) => { counts[e.customerId] = (counts[e.customerId] || 0) + 1; });
      const topCustomers = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, visits]) => {
        const c = store.customers.find((x) => x.id === id);
        return { id, displayName: c.displayName, visits, rewards: ev.filter((e) => e.customerId === id && e.type === "reward").length, homeBranch: branchName(c.homeBranchId) };
      });

      return wait({ bucket, from: fIso, to: tIso, registrations, repeatVisits, stamps, rewards, totals, byBranch, topCustomers });
    },

    // GET /api/brands/:brandId/customers?branchId=   (returns only this brand's customers, no contact details)
    listCustomers: ({ branchId } = {}) => wait(customersForBranch(branchId).map(withStatus)),
    // GET /api/customers/:id
    getCustomer: (id) => {
      const c = store.customers.find((x) => x.id === id);
      if (!c) return Promise.reject(new Error("Customer not found."));
      const history = store.events.filter((e) => e.customerId === id).slice(0, 40).map((e) => ({ ...e, branch: branchName(e.branchId) }));
      const special = store.specialRewards.filter((s) => s.customerIds.includes(id));
      return wait({ ...withStatus(c), history: history.map((e) => ({ ...e, itemNames: (e.items || []).map((it) => menuItem(it.id).name + (it.milk && it.milk !== "Regular" ? ` (${it.milk.toLowerCase()} milk)` : "")) })), specialRewards: special, favorites: favoritesOf(id) });
    },

    // DEMO FEATURE — VIP segmentation computed client-side until the backend supports it.
    getVipCustomers: ({ branchId, minVisits, periodDays, minRewards, match }) => {
      const since = daysAgo(periodDays).toISOString();
      const visits = {};
      store.events.filter((e) => e.type === "stamp" && e.at >= since).filter(inBranch(branchId)).forEach((e) => { visits[e.customerId] = (visits[e.customerId] || 0) + 1; });
      const res = customersForBranch(branchId).map((c) => ({ ...withStatus(c), periodVisits: visits[c.id] || 0 })).filter((c) => {
        const a = c.periodVisits >= minVisits, b = c.rewardsRedeemed >= minRewards;
        return match === "all" ? a && b : a || b;
      }).sort((a, b) => b.periodVisits - a.periodVisits || b.rewardsRedeemed - a.rewardsRedeemed);
      return wait(res);
    },
    saveVipCriteria: (criteria) => { store.settings.vipCriteria = { ...criteria }; return wait(store.settings.vipCriteria); },
    // DEMO FEATURE — POST /api/brands/:brandId/special-rewards
    assignSpecialReward: ({ customerIds, name, note, expiresAt }) => {
      if (!customerIds?.length) return Promise.reject(new Error("Select at least one customer."));
      if (!name?.trim()) return Promise.reject(new Error("Give the reward a name."));
      const sr = { id: "sr" + (store.specialRewards.length + 1), name: name.trim(), note: note || "", expiresAt, customerIds: [...customerIds], createdAt: new Date().toISOString(), createdBy: store.session.user.name };
      store.specialRewards.push(sr);
      customerIds.forEach((cid) => {
        const c = store.customers.find((x) => x.id === cid);
        store.events.unshift({ id: "e_sr_" + sr.id + cid, customerId: cid, branchId: c.homeBranchId, type: "special", qty: 0, label: sr.name, at: sr.createdAt });
      });
      return wait(sr);
    },
    listSpecialRewards: () => wait(store.specialRewards),

    /* ---------------- counter: customer shows their app code, staff scan it ---------------- */
    // The customer app shows a QR containing "CUPCOFF:<customer code>". Live version: a short-lived signed token.
    customerQrPayload: (customerId) => `CUPCOFF:${customerId}`,
    // GET /api/counter/customers/:code  (code from the scanned QR, or typed by staff)
    findCustomer: (raw) => {
      const m = String(raw || "").toUpperCase().match(/CC-?\s*(\d{4})/);
      if (!m) return Promise.reject(new Error("That isn't a CupCoff customer code. Codes look like CC-4821."));
      const c = store.customers.find((x) => x.id === "CC-" + m[1]);
      if (!c) return Promise.reject(new Error(`No customer with code CC-${m[1]} in ${store.session.brand.name}. Ask them to open the code for this café in the app.`));
      return wait({ ...withStatus(c), favorites: favoritesOf(c.id), lastStampAt: lastStamp(c.id)?.at || null });
    },
    // POST /api/counter/visits  { customerId, branchId, items:[{id, milk?}] } -> adds stamps (1 per drink, capped)
    recordVisit: ({ customerId, branchId, items }) => {
      const c = store.customers.find((x) => x.id === customerId);
      const L = store.settings.loyalty;
      if (!c) return Promise.reject(new Error("Customer not found."));
      if (!branchId) return Promise.reject(new Error("Choose the branch you're working at."));
      if (!items?.length) return Promise.reject(new Error("Tap what the customer ordered first."));
      const last = lastStamp(customerId);
      const mins = last ? (Date.now() - new Date(last.at)) / 60000 : Infinity;
      if (mins < L.scanCooldownMinutes) return Promise.reject(new Error(`${c.displayName} got a stamp ${Math.max(1, Math.round(mins))} min ago. Repeat scans within ${L.scanCooldownMinutes} minutes are blocked to prevent double stamping.`));
      makeMember(c, branchId);
      const drinksN = items.filter((it) => !menuItem(it.id)?.food).length;
      const qty = Math.min(drinksN, L.maxStampsPerVisit);
      const ev = { id: "e_live_" + Date.now(), customerId, branchId, type: "stamp", qty, items, at: new Date().toISOString(), byStaff: store.session.user.name };
      store.events.unshift(ev);
      c.stampBalance += qty; c.totalStamps += qty; c.totalVisits++; c.lastActivityAt = ev.at;
      if (store.setup) store.setup.firstScan = true;
      if (c.self) persistMe();
      return wait({ customer: { ...withStatus(c), favorites: favoritesOf(c.id) }, stampsAdded: qty, capped: drinksN > qty, rewardReady: c.stampBalance >= L.stampsPerReward });
    },
    // POST /api/counter/rewards  { customerId, branchId }
    redeemReward: ({ customerId, branchId }) => {
      const c = store.customers.find((x) => x.id === customerId);
      const per = store.settings.loyalty.stampsPerReward;
      if (!c) return Promise.reject(new Error("Customer not found."));
      if (c.stampBalance < per) return Promise.reject(new Error(`${c.displayName} needs ${per - c.stampBalance} more stamps for a reward.`));
      const ev = { id: "e_live_r" + Date.now(), customerId, branchId, type: "reward", qty: per, at: new Date().toISOString(), byStaff: store.session.user.name };
      store.events.unshift(ev);
      c.stampBalance -= per; c.rewardsRedeemed++; c.lastActivityAt = ev.at;
      if (c.self) persistMe();
      return wait({ customer: { ...withStatus(c), favorites: favoritesOf(c.id) } });
    },
    // GET/PATCH /api/menu
    getMenu: () => wait(store.menu.map(({ pop, like, trend, season, ...m }) => m)),
    setMenuItem: (id, patch) => { const m = menuItem(id); if (!m) return Promise.reject(new Error("Item not found.")); if ("enabled" in patch) m.enabled = !!patch.enabled; return wait({ id: m.id, enabled: m.enabled }); },

    /* ---------------- Insights: what customers prefer, from items tapped at the counter ---------------- */
    // GET /api/brands/:brandId/insights?branchId=&from=&to=
    getInsights: ({ branchId, from, to }) => {
      const f = startOfDay(from), t = new Date(startOfDay(to).getTime() + DAY - 1);
      const span = Math.round((t - f) / DAY) + 1;
      const fI = f.toISOString(), tI = t.toISOString();
      const pf = new Date(f.getTime() - span * DAY).toISOString(), pt = new Date(f.getTime() - 1).toISOString();
      const visits = store.events.filter((e) => e.type === "stamp" && e.items && (!branchId || e.branchId === branchId));
      const cur = visits.filter((e) => e.at >= fI && e.at <= tI), prev = visits.filter((e) => e.at >= pf && e.at <= pt);
      const countItems = (list) => { const m = {}; list.forEach((e) => e.items.forEach((it) => (m[it.id] = (m[it.id] || 0) + 1))); return m; };
      const cc = countItems(cur), pc = countItems(prev);
      const drinkTotal = store.menu.filter((m) => !m.food).reduce((a, m) => a + (cc[m.id] || 0), 0);
      const items = store.menu.map((m) => {
        const n = cc[m.id] || 0, p = pc[m.id] || 0;
        return { id: m.id, name: m.name, cat: m.cat, food: !!m.food, count: n, prev: p, change: p >= 8 ? (n - p) / p : null,
          share: m.food ? (cur.length ? n / cur.length : 0) : (drinkTotal ? n / drinkTotal : 0) };
      });
      const drinksSorted = items.filter((i) => !i.food).sort((a, b) => b.count - a.count);
      const movers = items.filter((i) => i.change !== null && i.count + i.prev >= 20);
      const rising = movers.filter((i) => i.change > 0.05).sort((a, b) => b.change - a.change).slice(0, 4);
      const falling = movers.filter((i) => i.change < -0.05).sort((a, b) => a.change - b.change).slice(0, 4);
      // repeat rate up to the end of the period: of customers who tried an item, how many ordered it again
      const upto = visits.filter((e) => e.at <= tI);
      const per = {};
      upto.forEach((e) => new Set(e.items.map((it) => it.id)).forEach((id) => { (per[id] ||= {}); per[id][e.customerId] = (per[id][e.customerId] || 0) + 1; }));
      const repeat = store.menu.map((m) => {
        const tried = Object.values(per[m.id] || {});
        return { id: m.id, name: m.name, food: !!m.food, triers: tried.length, rate: tried.length ? tried.filter((x) => x >= 2).length / tried.length : 0 };
      }).filter((r) => r.triers >= 10).sort((a, b) => a.rate - b.rate);
      // milk choices among milk drinks
      const milk = {}; cur.forEach((e) => e.items.forEach((it) => { if (it.milk) milk[it.milk] = (milk[it.milk] || 0) + 1; }));
      const pmilk = {}; prev.forEach((e) => e.items.forEach((it) => { if (it.milk) pmilk[it.milk] = (pmilk[it.milk] || 0) + 1; }));
      const milkTotal = Object.values(milk).reduce((a, b) => a + b, 0) || 1, pmilkTotal = Object.values(pmilk).reduce((a, b) => a + b, 0) || 1;
      const milks = MILKS.map((name) => ({ name, count: milk[name] || 0, share: (milk[name] || 0) / milkTotal, prevShare: (pmilk[name] || 0) / pmilkTotal }));
      // busy times: weekday (Mon..Sun) x hour 8..21
      const heat = Array.from({ length: 7 }, () => Array(14).fill(0));
      cur.forEach((e) => { const d = new Date(e.at); const h = d.getHours(); if (h >= 8 && h <= 21) heat[(d.getDay() + 6) % 7][h - 8]++; });
      // VIP vs everyone
      const vc = store.settings.vipCriteria, vSince = daysAgo(vc.periodDays).toISOString();
      const vVisits = {}; store.events.forEach((e) => { if (e.type === "stamp" && e.at >= vSince) vVisits[e.customerId] = (vVisits[e.customerId] || 0) + 1; });
      const isVip = (c) => { const a = (vVisits[c.id] || 0) >= vc.minVisits, b = c.rewardsRedeemed >= vc.minRewards; return vc.match === "all" ? a && b : a || b; };
      const vipIds = new Set(store.customers.filter(isVip).map((c) => c.id));
      const topFor = (list) => { const m = countItems(list); const tot = list.reduce((a, e) => a + e.items.filter((it) => !menuItem(it.id).food).length, 0) || 1;
        return Object.entries(m).filter(([id]) => !menuItem(id).food).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id, n]) => ({ id, name: menuItem(id).name, share: n / tot })); };
      const foodAttach = { cur: cur.length ? cur.filter((e) => e.items.some((it) => menuItem(it.id).food)).length / cur.length : 0,
        prev: prev.length ? prev.filter((e) => e.items.some((it) => menuItem(it.id).food)).length / prev.length : 0 };
      return wait({ from: fI, to: tI, visits: cur.length, drinkTotal, items, top: drinksSorted.slice(0, 8), rising, falling, repeat, milks, heat,
        vip: { count: vipIds.size, top: topFor(cur.filter((e) => vipIds.has(e.customerId))) }, everyone: topFor(cur), foodAttach,
        food: items.filter((i) => i.food).sort((a, b) => b.count - a.count) });
    },

    // GET /api/brands/:brandId/subscription  (SIMULATED — no payment provider connected)
    getSubscription: () => {
      const P = store.pricing, nb = store.branches.length;
      const monthly = P.firstBranch + Math.max(0, nb - 1) * P.additionalBranch;
      return wait({ ...store.subscription, pricing: P, branchCount: nb, monthlyTotal: monthly, trialDaysLeft: store.subscription.status === "trial" ? Math.max(0, Math.ceil((new Date(store.subscription.trialEndsAt) - Date.now()) / DAY)) : 0,
        lines: [{ label: "First branch", qty: 1, unit: P.firstBranch }, ...(nb > 1 ? [{ label: "Additional branches", qty: nb - 1, unit: P.additionalBranch }] : [])] });
    },
    // SIMULATED — never charges, never collects card details
    setCancelAtPeriodEnd: (flag) => { store.subscription.cancelAtPeriodEnd = !!flag; return demo.getSubscription(); },
    // GET /api/brands/:brandId/payments  (SIMULATED)
    getPayments: () => {
      const P = store.pricing, nb = store.branches.length;
      const up = store.payments.find((p) => p.status === "upcoming");
      if (up) { up.branches = nb; up.amount = P.firstBranch + Math.max(0, nb - 1) * P.additionalBranch; up.description = `Monthly subscription, ${nb} branch${nb === 1 ? "" : "es"}`; }
      return wait(store.payments);
    },
    getPricing: () => wait(store.pricing),

    // POST /api/support/requests  (SIMULATED — not sent to anyone yet)
    submitSupportRequest: (req) => {
      const missing = ["topic", "subject", "message", "replyEmail"].filter((k) => !String(req[k] || "").trim());
      if (missing.length) return Promise.reject(new Error("Fill in: " + missing.join(", ")));
      const r = { ...req, id: "CS-" + (10480 + store.supportRequests.length + 1), status: "Received", createdAt: new Date().toISOString(), simulated: true };
      store.supportRequests.unshift(r);
      return wait(r);
    },
    listSupportRequests: () => wait(store.supportRequests),

    // GET/PATCH /api/brands/:brandId/settings
    getSettings: () => wait(store.settings),
    updateSettings: (section, patch) => {
      if (section === "loyalty") {
        const n = Number(patch.stampsPerReward);
        if (!Number.isInteger(n) || n < 4 || n > 20) return Promise.reject(new Error("Stamps per reward must be a whole number from 4 to 20."));
        if (!String(patch.rewardName || "").trim()) return Promise.reject(new Error("Name the reward customers get."));
        patch.stampsPerReward = n;
        patch.maxStampsPerVisit = Math.min(10, Math.max(1, parseInt(patch.maxStampsPerVisit, 10) || 1));
        patch.scanCooldownMinutes = Math.min(240, Math.max(0, parseInt(patch.scanCooldownMinutes, 10) || 0));
      }
      store.settings[section] = { ...store.settings[section], ...patch };
      if (section === "profile" && patch.brandName) store.session.brand.name = patch.brandName;
      return wait(store.settings[section]);
    },
    // GET/POST /api/brands/:brandId/team
    listTeam: () => wait(store.team),
    inviteTeamMember: ({ name, email, role, branch }) => {
      if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || "")) return Promise.reject(new Error("Enter a name and a valid email address."));
      const m = { id: "t" + (store.team.length + 1), name: name.trim(), email: email.trim(), role, branch, status: "Invited" };
      store.team.push(m);
      if (store.setup) store.setup.team = true;
      return wait(m);
    },

    joinUrl: (branchId) => {
      const b = store.branches.find((x) => x.id === branchId);
      return `${CONFIG.joinBaseUrl}/${store.session.brand.slug}` + (b ? `?branch=${slug(b.name)}` : "");
    },
  };

  /* ------------------------------------------------------------ live API (to be wired after repo review) */
  /* Verified against the CupCoff repo (Express 5, src/routes/auth.route.js):
   *   POST /api/auth/register  { email, password }  -> 201 { id, email }
   *   POST /api/auth/login     { email, password }  -> 200 { token }  (JWT: { id, role }, 24h)
   * Nothing else exists yet, so every other call falls back to the demo store.
   */
  const TOKEN_KEY = "cupcoff.token";
  const tokenStore = {
    get() { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } },
    set(t) { try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } },
    getEmail() { try { return sessionStorage.getItem(TOKEN_KEY + ".email"); } catch { return null; } },
    setEmail(e) { try { e ? sessionStorage.setItem(TOKEN_KEY + ".email", e) : sessionStorage.removeItem(TOKEN_KEY + ".email"); } catch { /* storage unavailable */ } },
  };
  async function http(method, path, body) {
    const token = tokenStore.get();
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = "Bearer " + token;
    let res;
    try {
      res = await fetch(CONFIG.apiBaseUrl + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch {
      throw new Error("Can't reach the CupCoff server. Check that it is running and try again.");
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // backend sends { error } or zod's { errors: [{ message }] }
      const msg = json.error || json.message || json.errors?.map((e) => e.message).join(" ") || `Request failed (${res.status}).`;
      const err = new Error(msg); err.status = res.status; throw err;
    }
    return json;
  }
  const decodeJwt = (t) => { try { return JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); } catch { return {}; } };

  const live = {
    registerCafe: async (d) => {
      await http("POST", "/auth/register", { email: d.email, password: d.password });
      await live.login({ email: d.email, password: d.password });
      // No brand endpoints yet: the café's details live in the browser until POST /api/brands exists.
      return startNewCafe(d);
    },
    login: async ({ email, password }) => {
      const { token } = await http("POST", "/auth/login", { email, password });
      tokenStore.set(token);
      tokenStore.setEmail(email);
      return live.getSession();
    },
    logout: async () => { tokenStore.set(null); tokenStore.setEmail(null); store.session.signedIn = false; return { ok: true }; }, // JWT is stateless: drop it client-side
    getSession: async () => {
      const t = tokenStore.get();
      const claims = t ? decodeJwt(t) : null;
      const valid = claims && claims.id && (!claims.exp || claims.exp * 1000 > Date.now());
      if (!valid) { tokenStore.set(null); store.session.signedIn = false; return clone(store.session); }
      // No profile/brand endpoint yet (GET /api/auth/me is proposed): keep the demo café, use the real account.
      const email = tokenStore.getEmail() || "";
      const local = (email.split("@")[0] || "there").replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      Object.assign(store.session.user, { id: claims.id, email, name: local, firstName: local.split(" ")[0], role: claims.role || "owner" });
      store.session.signedIn = true;
      store.session.liveAuth = true;
      return clone(store.session);
    },
  };

  restoreMe();
  demo.MILKS = MILKS;
  return new Proxy(demo, {
    get(target, key) {
      if (CONFIG.mode === "live" && key in live) return live[key];
      return target[key];
    },
  });
})();

export default api;
export { api };
