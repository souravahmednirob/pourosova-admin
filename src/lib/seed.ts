/* Deterministic, clearly-fictional sample data for Kaliakair Pourashava. */
import { pad, rng } from "./utils";
import type {
  AuditEntry,
  Citizen,
  DistributionPoint,
  Notification,
  Order,
  OrderItem,
  Product,
  Settings,
  StockMovement,
  User,
  Ward,
} from "./types";

export const SEED_VERSION = 4;

const FIRST_F = ["রহিমা", "সালেহা", "ফাতেমা", "আয়েশা", "নাসরিন", "শাহনাজ", "রোকেয়া", "হাসিনা", "মর্জিনা", "জোসনা", "পারভীন", "রুমা", "শিউলি", "কুলসুম", "মনোয়ারা", "আনোয়ারা", "সুমি", "রেহানা"];
const FIRST_M = ["আব্দুল করিম", "রফিকুল", "জাহাঙ্গীর", "সোহেল", "মিজানুর", "আলমগীর", "শফিকুল", "কামাল", "জসিম", "হাফিজ", "নূর", "বাবুল", "সিদ্দিক", "আক্কাস", "মোস্তফা", "ইসমাইল", "সাইফুল", "দেলোয়ার"];
const LAST_F = ["খাতুন", "বেগম", "আক্তার", "পারভীন", "সুলতানা"];
const LAST_M = ["মিয়া", "হোসেন", "ইসলাম", "শেখ", "সরকার", "মোল্লা", "প্রামাণিক", "ভূঁইয়া"];
const FIRST_F_EN = ["Rahima", "Saleha", "Fatema", "Ayesha", "Nasrin", "Shahnaz", "Rokeya", "Hasina", "Morjina", "Josna", "Parvin", "Ruma", "Shiuli", "Kulsum", "Monowara", "Anowara", "Sumi", "Rehana"];
const FIRST_M_EN = ["Abdul Karim", "Rafiqul", "Jahangir", "Sohel", "Mizanur", "Alamgir", "Shafiqul", "Kamal", "Jasim", "Hafiz", "Nur", "Babul", "Siddique", "Akkas", "Mostafa", "Ismail", "Saiful", "Delwar"];
const LAST_F_EN = ["Khatun", "Begum", "Akter", "Parvin", "Sultana"];
const LAST_M_EN = ["Mia", "Hossain", "Islam", "Sheikh", "Sarkar", "Mollah", "Pramanik", "Bhuiyan"];

const MOHALLA = ["বাজার পাড়া", "সফিপুর", "চন্দ্রা", "মৌচাক", "বোর্ডঘর", "আন্ধারমানিক", "বড়ইবাড়ি", "পশ্চিমপাড়া", "দক্ষিণ পাড়া", "উত্তরপাড়া", "হিজলতলী", "সরকারবাড়ি", "রতনপুর", "গোয়ালবাথান"];
const STREETS = ["বাজার রোড, মসজিদের পাশে", "স্কুল রোড, পুকুর পাড়", "মেইন রোড, হাসপাতালের পেছনে", "স্টেশন রোড", "মন্দির রোড, কাঁচাবাজারের উত্তরে", "বাইপাস সংলগ্ন", "কলেজ গেটের পাশে"];

export const WARDS: Ward[] = Array.from({ length: 9 }, (_, i) => ({
  id: `w${i + 1}`,
  number: i + 1,
  name: `ওয়ার্ড ${i + 1}`,
}));

export const POINTS: DistributionPoint[] = [
  { id: "p1", name: "পৌরসভা কার্যালয় বিতরণ কেন্দ্র", wardId: "w3", address: "পৌরসভা ভবন, কালিয়াকৈর", openHours: "সকাল ৯টা – বিকাল ৪টা" },
  { id: "p2", name: "সফিপুর বিতরণ কেন্দ্র", wardId: "w7", address: "সফিপুর বাজার, কালিয়াকৈর", openHours: "সকাল ৯টা – বিকাল ৪টা" },
  { id: "p3", name: "মৌচাক বিতরণ কেন্দ্র", wardId: "w9", address: "মৌচাক, কালিয়াকৈর", openHours: "সকাল ১০টা – বিকাল ৫টা" },
];

export const USERS: User[] = [
  { id: "u1", name: "মোঃ আরিফুল ইসলাম", email: "super@kaliakair.gov.bd", password: "admin123", role: "SUPER_ADMIN", active: true },
  { id: "u2", name: "ফারহানা ইয়াসমিন", email: "admin@kaliakair.gov.bd", password: "admin123", role: "ADMIN", active: true },
  { id: "u3", name: "মোঃ শাহাদাত হোসেন", email: "officer@kaliakair.gov.bd", password: "admin123", role: "DIST_OFFICER", active: true, pointId: "p1" },
  { id: "u4", name: "তানিয়া সুলতানা", email: "viewer@kaliakair.gov.bd", password: "admin123", role: "REPORT_VIEWER", active: true },
  { id: "a1", name: "মোঃ রাসেল মাহমুদ", email: "agent1@kaliakair.gov.bd", password: "agent123", role: "FIELD_AGENT", active: true },
  { id: "a2", name: "সাবরিনা আক্তার", email: "agent2@kaliakair.gov.bd", password: "agent123", role: "FIELD_AGENT", active: true },
  { id: "a3", name: "মোঃ জুয়েল রানা", email: "agent3@kaliakair.gov.bd", password: "agent123", role: "FIELD_AGENT", active: true },
];

export const DEFAULT_SETTINGS: Settings = {
  pickupDeadlineDays: 3,
  limitPeriod: "CALENDAR_MONTH",
  lowStockPct: 25,
  sessionTimeoutMin: 30,
};

const DAY = 86_400_000;

function makeProducts(now: number): Product[] {
  const created = new Date(now - 400 * DAY).toISOString();
  return [
    { id: "pr1", name: "চাল (মোটা)", category: "RICE_FLOUR", unit: "KG", marketPrice: 55, municipalPrice: 40, stock: 3250, capacity: 5000, perFamilyLimit: 10, active: true, createdAt: created },
    { id: "pr2", name: "আটা", category: "RICE_FLOUR", unit: "KG", marketPrice: 50, municipalPrice: 38, stock: 1420, capacity: 3000, perFamilyLimit: 5, active: true, createdAt: created },
    { id: "pr3", name: "মসুর ডাল", category: "LENTIL", unit: "KG", marketPrice: 140, municipalPrice: 100, stock: 380, capacity: 2000, perFamilyLimit: 2, active: true, createdAt: created },
    { id: "pr4", name: "ছোলা", category: "LENTIL", unit: "KG", marketPrice: 120, municipalPrice: 90, stock: 0, capacity: 1500, perFamilyLimit: 2, active: true, createdAt: created },
    { id: "pr5", name: "সয়াবিন তেল", category: "OIL_SPICE", unit: "L", marketPrice: 180, municipalPrice: 135, stock: 910, capacity: 2000, perFamilyLimit: 2, active: true, createdAt: created },
    { id: "pr6", name: "চিনি", category: "GROCERY", unit: "KG", marketPrice: 125, municipalPrice: 95, stock: 1180, capacity: 2000, perFamilyLimit: 2, active: true, createdAt: created },
    { id: "pr7", name: "লবণ", category: "GROCERY", unit: "KG", marketPrice: 45, municipalPrice: 32, stock: 640, capacity: 1500, perFamilyLimit: 1, active: true, createdAt: created },
    { id: "pr8", name: "পেঁয়াজ", category: "VEG", unit: "KG", marketPrice: 90, municipalPrice: 65, stock: 260, capacity: 2500, perFamilyLimit: 3, active: true, createdAt: created },
  ];
}

export interface SeedData {
  users: User[];
  wards: Ward[];
  points: DistributionPoint[];
  products: Product[];
  citizens: Citizen[];
  orders: Order[];
  movements: StockMovement[];
  audit: AuditEntry[];
  notifications: Notification[];
  settings: Settings;
  counters: { rc: number; order: number };
}

export function buildSeed(nowMs = Date.now()): SeedData {
  const r = rng(20261116);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const products = makeProducts(nowMs);
  const agents = USERS.filter((u) => u.role === "FIELD_AGENT");
  const admins = USERS.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN");

  const usedNid = new Set<string>();
  const usedMobile = new Set<string>();

  // ── citizens ───────────────────────────────────────────────
  const citizens: Citizen[] = [];
  const total = 124;
  for (let i = 0; i < total; i++) {
    const female = r() < 0.55;
    const fi = int(0, (female ? FIRST_F : FIRST_M).length - 1);
    const li = int(0, (female ? LAST_F : LAST_M).length - 1);
    const nameBn = female ? `মোছাঃ ${FIRST_F[fi]} ${LAST_F[li]}` : `মোঃ ${FIRST_M[fi]} ${LAST_M[li]}`;
    const nameEn = female ? `Mst. ${FIRST_F_EN[fi]} ${LAST_F_EN[li]}` : `Md. ${FIRST_M_EN[fi]} ${LAST_M_EN[li]}`;

    let nid = "";
    do {
      nid = r() < 0.6 ? `${int(1960, 2002)}${pad(int(0, 999999999), 9)}` : `${pad(int(1000000000, 9999999999), 10)}`;
    } while (usedNid.has(nid));
    usedNid.add(nid);
    let mobile = "";
    do {
      mobile = `01${pick([3, 5, 6, 7, 8, 9])}${pad(int(0, 99999999), 8)}`;
    } while (usedMobile.has(mobile));
    usedMobile.add(mobile);

    // registration spread over last 12 months, denser recently
    const ageDays = Math.floor(Math.pow(r(), 1.6) * 360);
    const registeredAt = new Date(nowMs - ageDays * DAY - int(0, 8) * 3_600_000 - int(0, 59) * 60_000);
    registeredAt.setHours(int(9, 17), int(0, 59), 0, 0);
    const byOffice = r() < 0.3;
    const agent = pick(agents);

    let status: Citizen["status"] = "APPROVED";
    if (ageDays < 20 && !byOffice && r() < 0.55) status = "PENDING";
    else if (r() < 0.09) status = "REJECTED";
    if (byOffice) status = "APPROVED";

    const wardN = int(1, 9);
    const c: Citizen = {
      id: `c${i + 1}`,
      nameBn,
      nameEn,
      nationalId: nid,
      mobile,
      wardId: `w${wardN}`,
      mohalla: pick(MOHALLA),
      holding: `${int(1, 240)}${r() < 0.3 ? "/" + pick(["এ", "বি", "সি"]) : ""}`,
      address: `কালিয়াকৈর ${pick(STREETS)}`,
      familySize: int(2, 8),
      status,
      registeredBy: byOffice ? "OFFICE" : agent.id,
      registeredByName: byOffice ? "পৌরসভা অফিস" : agent.name,
      registeredAt: registeredAt.toISOString(),
      father: `মোঃ ${pick(FIRST_M)} ${pick(LAST_M)}`,
      mother: `মোছাঃ ${pick(FIRST_F)} ${pick(LAST_F)}`,
      dob: `${pad(int(1, 28), 2)}/${pad(int(1, 12), 2)}/${int(1962, 2001)}`,
      bloodGroup: pick(["A+", "B+", "O+", "AB+", "O−", "A−"]),
    };
    if (status !== "PENDING") {
      const approvedAt = new Date(registeredAt.getTime() + (byOffice ? 0 : int(1, 5) * DAY + int(0, 6) * 3_600_000));
      c.approvedAt = approvedAt.toISOString();
      c.approvedBy = pick(admins).id;
      if (status === "REJECTED") {
        c.rejectReason = pick(["পরিচয়পত্রের ছবি অস্পষ্ট", "একই পরিবারের অন্য সদস্য ইতিমধ্যে নিবন্ধিত", "ঠিকানা পৌর এলাকার বাইরে", "মোবাইল নম্বর যাচাই করা যায়নি"]);
      }
    }
    citizens.push(c);
  }

  // ration card numbers: sequential by approval time, never reused
  const approvedSorted = citizens.filter((c) => c.status === "APPROVED").sort((a, b) => a.approvedAt!.localeCompare(b.approvedAt!));
  let rc = 0;
  for (const c of approvedSorted) {
    rc += 1;
    c.rationCardNo = `RC-${pad(rc)}`;
  }

  // ── orders: 11 months of history + ~40 recent in all statuses ──
  const orders: Order[] = [];
  const movements: StockMovement[] = [];
  const approved = citizens.filter((c) => c.status === "APPROVED");
  const start = new Date(nowMs);
  start.setMonth(start.getMonth() - 10, 1);
  start.setHours(0, 0, 0, 0);

  const monthsSpan = 11;
  const tmp: Omit<Order, "orderNo">[] = [];
  const seasonal = [0.72, 0.8, 0.86, 0.95, 1.0, 0.9, 0.98, 1.05, 1.1, 1.18, 1.0];
  for (let m = 0; m < monthsSpan; m++) {
    const monthStart = new Date(start);
    monthStart.setMonth(start.getMonth() + m);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthStart.getMonth() + 1);
    const isCurrent = m === monthsSpan - 1;
    const countInMonth = Math.round(34 * seasonal[m]);
    for (let k = 0; k < countInMonth; k++) {
      const cit = pick(approved);
      const regTime = new Date(cit.approvedAt!).getTime();
      const spanStart = Math.max(monthStart.getTime(), regTime);
      const spanEnd = Math.min(monthEnd.getTime(), nowMs - 2 * 3_600_000);
      if (spanStart >= spanEnd) continue;
      const applied = new Date(spanStart + r() * (spanEnd - spanStart));
      applied.setHours(int(8, 18), int(0, 59), int(0, 59), 0);
      if (applied.getTime() > nowMs) continue;

      const nItems = int(1, 4);
      const chosen = new Set<string>();
      const items: OrderItem[] = [];
      for (let j = 0; j < nItems; j++) {
        const p = pick(products);
        if (chosen.has(p.id)) continue;
        chosen.add(p.id);
        items.push({ productId: p.id, quantity: int(1, p.perFamilyLimit), unitPriceSnapshot: p.municipalPrice, marketPriceSnapshot: p.marketPrice });
      }

      const ageH = (nowMs - applied.getTime()) / 3_600_000;
      let status: Order["status"] = "COLLECTED";
      if (isCurrent && ageH < 96) {
        const x = r();
        status = x < 0.42 ? "PENDING" : x < 0.78 ? "AWAITING_PICKUP" : x < 0.9 ? "COLLECTED" : "CANCELLED";
      } else if (r() < 0.07) status = "CANCELLED";

      const o: Omit<Order, "orderNo"> = {
        id: `o${tmp.length + 1}`,
        citizenId: cit.id,
        status,
        items,
        appliedAt: applied.toISOString(),
        pickupPointId: pick(POINTS).id,
      };
      if (status !== "PENDING") {
        let appr = new Date(applied.getTime() + int(1, 30) * 3_600_000);
        // orders still awaiting pickup were approved recently, so their deadline is in the future
        if (status === "AWAITING_PICKUP") appr = new Date(Math.max(appr.getTime(), nowMs - int(2, 40) * 3_600_000));
        o.approvedAt = appr.toISOString();
        o.approvedBy = pick(admins).id;
        if (status === "CANCELLED") {
          o.cancelledAt = appr.toISOString();
          o.rejectReason = pick(["মাসিক সীমা অতিক্রম", "মজুত শেষ", "নাগরিকের অনুরোধে বাতিল", "সময়সীমার মধ্যে সংগ্রহ হয়নি"]);
        } else {
          const code = pad(int(0, 999999));
          o.pickupCode = code;
          o.pickupCodeHash = `h_${code}`;
          o.pickupDeadline = new Date(appr.getTime() + 3 * DAY).toISOString();
          if (status === "COLLECTED") {
            const col = new Date(appr.getTime() + int(2, 60) * 3_600_000);
            col.setHours(int(9, 16), int(0, 59), 0, 0);
            o.collectedAt = col.toISOString();
            o.collectedVia = r() < 0.7 ? "APP_CODE" : "APP_QR";
          }
        }
      }
      tmp.push(o);
    }
  }
  tmp.sort((a, b) => a.appliedAt.localeCompare(b.appliedAt));
  tmp.forEach((o, i) => orders.push({ ...o, orderNo: `ORD-${pad(i + 1)}` }));

  // stock movements for the recent live orders (history is already deducted from stock figures)
  for (const o of orders) {
    if (o.status === "AWAITING_PICKUP") {
      for (const it of o.items) movements.push({ id: `m_${o.id}_${it.productId}`, productId: it.productId, type: "RESERVE", quantity: it.quantity, orderId: o.id, actor: o.approvedBy!, at: o.approvedAt! });
    }
    if (o.status === "COLLECTED" && nowMs - new Date(o.collectedAt!).getTime() < 30 * DAY) {
      for (const it of o.items) movements.push({ id: `m_${o.id}_${it.productId}`, productId: it.productId, type: "SALE", quantity: it.quantity, orderId: o.id, actor: o.citizenId, at: o.collectedAt! });
    }
  }
  for (const p of products) {
    movements.push({ id: `m_restock_${p.id}`, productId: p.id, type: "RESTOCK", quantity: Math.round(p.capacity * 0.6), actor: "u2", at: new Date(nowMs - 21 * DAY).toISOString() });
  }
  movements.sort((a, b) => a.at.localeCompare(b.at));

  // audit
  const audit: AuditEntry[] = [];
  for (const c of citizens.filter((c) => c.status !== "PENDING").slice(-30)) {
    audit.push({ id: `au_c_${c.id}`, actor: c.approvedBy!, actorName: USERS.find((u) => u.id === c.approvedBy)?.name ?? "", action: c.status === "APPROVED" ? "নিবন্ধন অনুমোদন" : "নিবন্ধন বাতিল", entity: "citizen", entityId: c.id, at: c.approvedAt! });
  }
  for (const o of orders.slice(-30)) {
    if (o.approvedAt) audit.push({ id: `au_o_${o.id}`, actor: o.approvedBy!, actorName: USERS.find((u) => u.id === o.approvedBy)?.name ?? "", action: o.status === "CANCELLED" ? "অর্ডার বাতিল" : "অর্ডার অনুমোদন", entity: "order", entityId: o.id, at: o.approvedAt });
  }
  audit.sort((a, b) => a.at.localeCompare(b.at));

  // notifications for staff
  const notifications: Notification[] = [];
  for (const c of citizens.filter((c) => c.status === "PENDING").slice(-6)) {
    notifications.push({ id: `n_c_${c.id}`, target: "STAFF", type: "NEW_REG", text: `${c.nameBn} — নতুন নিবন্ধন এসেছে`, read: false, at: c.registeredAt, link: `/admin?citizen=${c.id}` });
  }
  for (const o of orders.filter((o) => o.status === "PENDING").slice(-6)) {
    const cz = citizens.find((c) => c.id === o.citizenId)!;
    notifications.push({ id: `n_o_${o.id}`, target: "STAFF", type: "NEW_ORDER", text: `${cz.nameBn} — নতুন অর্ডার অনুরোধ`, read: false, at: o.appliedAt, link: `/admin/orders?order=${o.id}` });
  }
  for (const p of products.filter((p) => p.stock / p.capacity < 0.25)) {
    notifications.push({ id: `n_p_${p.id}`, target: "STAFF", type: "LOW_STOCK", text: `${p.name} — মজুত ${p.stock === 0 ? "শেষ" : "কম"}`, read: false, at: new Date(nowMs - 5 * 3_600_000).toISOString(), link: `/admin/products?product=${p.id}` });
  }
  notifications.sort((a, b) => b.at.localeCompare(a.at));

  return {
    users: USERS,
    wards: WARDS,
    points: POINTS,
    products,
    citizens,
    orders,
    movements,
    audit,
    notifications,
    settings: DEFAULT_SETTINGS,
    counters: { rc, order: orders.length },
  };
}
