export type Role = "SUPER_ADMIN" | "ADMIN" | "DIST_OFFICER" | "REPORT_VIEWER" | "FIELD_AGENT" | "CITIZEN";

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "সুপার অ্যাডমিন",
  ADMIN: "পৌর প্রশাসক",
  DIST_OFFICER: "বিতরণ কর্মকর্তা",
  REPORT_VIEWER: "রিপোর্ট দর্শক",
  FIELD_AGENT: "ফিল্ড এজেন্ট",
  CITIZEN: "নাগরিক",
};

export interface User {
  id: string;
  name: string;
  email: string;
  /** mock only — plain text password for demo */
  password: string;
  role: Role;
  active: boolean;
  lastLogin?: string;
  pointId?: string;
}

export interface Ward {
  id: string;
  number: number;
  name: string;
}

export interface DistributionPoint {
  id: string;
  name: string;
  wardId: string;
  address: string;
  openHours: string;
}

export type CitizenStatus = "PENDING" | "APPROVED" | "REJECTED";

export const CITIZEN_STATUS_LABEL: Record<CitizenStatus, string> = {
  PENDING: "অপেক্ষায়",
  APPROVED: "অনুমোদিত",
  REJECTED: "বাতিল",
};

export interface Citizen {
  id: string;
  nameBn: string;
  nameEn: string;
  nationalId: string;
  mobile: string;
  wardId: string;
  mohalla: string;
  holding: string;
  address: string;
  familySize: number;
  photoUrl?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  status: CitizenStatus;
  rationCardNo?: string;
  /** user id of agent/admin, or "OFFICE" when registered at the municipal office */
  registeredBy: string;
  registeredByName: string;
  /** application number given to field-agent submissions, e.g. KP-2026-000124 */
  applicationNo?: string;
  /** citizen app sign-in PIN (stored hashed; set on first activation) */
  pinHash?: string;
  registeredAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
  /** sample-data flag: extra fields shown on the sample ID card */
  father?: string;
  mother?: string;
  dob?: string;
  bloodGroup?: string;
}

export type ProductCategory = "RICE_FLOUR" | "LENTIL" | "OIL_SPICE" | "GROCERY" | "VEG";

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  RICE_FLOUR: "চাল ও আটা",
  LENTIL: "ডাল",
  OIL_SPICE: "তেল ও মসলা",
  GROCERY: "মুদি",
  VEG: "সবজি",
};

export type Unit = "KG" | "L" | "PC" | "PKT";
export const UNIT_LABEL: Record<Unit, string> = { KG: "কেজি", L: "লিটার", PC: "পিস", PKT: "প্যাকেট" };

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit: Unit;
  marketPrice: number;
  municipalPrice: number;
  stock: number;
  capacity: number;
  perFamilyLimit: number;
  active: boolean;
  createdAt: string;
}

export type MovementType = "RESERVE" | "RELEASE" | "SALE" | "ADJUST" | "RESTOCK";

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  orderId?: string;
  actor: string;
  at: string;
}

export type OrderStatus = "PENDING" | "AWAITING_PICKUP" | "COLLECTED" | "CANCELLED";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "অনুমোদনের অপেক্ষায়",
  AWAITING_PICKUP: "সংগ্রহের অপেক্ষায়",
  COLLECTED: "সংগ্রহ সম্পন্ন",
  CANCELLED: "বাতিল",
};

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPriceSnapshot: number;
  marketPriceSnapshot: number;
}

export interface Order {
  id: string;
  orderNo: string;
  citizenId: string;
  status: OrderStatus;
  items: OrderItem[];
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
  cancelledAt?: string;
  /** mock: stored as plain hash-like string; real system stores a hash */
  pickupCodeHash?: string;
  /** demo only — the code the citizen app would know */
  pickupCode?: string;
  pickupPointId?: string;
  pickupDeadline?: string;
  collectedAt?: string;
  collectedVia?: "APP_CODE" | "APP_QR";
  wrongTries?: number;
  lockedUntil?: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  actorName: string;
  action: string;
  entity: "citizen" | "order" | "product" | "user" | "system";
  entityId: string;
  before?: unknown;
  after?: unknown;
  at: string;
}

export interface Notification {
  id: string;
  /** staff user id, or citizen id, or "STAFF" broadcast */
  target: string;
  type: "NEW_REG" | "NEW_ORDER" | "LOW_STOCK" | "ORDER_APPROVED" | "ORDER_REJECTED" | "DEADLINE" | "COLLECTED";
  text: string;
  read: boolean;
  at: string;
  link?: string;
}

export interface Settings {
  pickupDeadlineDays: number;
  limitPeriod: "CALENDAR_MONTH";
  lowStockPct: number;
  sessionTimeoutMin: number;
}
