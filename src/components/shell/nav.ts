import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ClipboardList, BarChart3, UserPlus, Package, Settings } from "lucide-react";
import type { Permission } from "@/store/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  perm: Permission;
  badge?: "pendingCitizens" | "pendingOrders";
  divider?: boolean;
  keywords?: string;
}

export const NAV: NavItem[] = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard, perm: "citizen.view", badge: "pendingCitizens", keywords: "dashboard home" },
  { href: "/admin/orders", label: "অর্ডার অনুরোধ", icon: ClipboardList, perm: "order.view", badge: "pendingOrders", keywords: "orders requests" },
  { href: "/admin/reports", label: "বিক্রয় রিপোর্ট", icon: BarChart3, perm: "report.view", keywords: "sales report" },
  { href: "/admin/register", label: "নতুন নাগরিক নিবন্ধন", icon: UserPlus, perm: "citizen.register", keywords: "register citizen new" },
  { href: "/admin/products", label: "পণ্য ব্যবস্থাপনা", icon: Package, perm: "product.view", keywords: "products stock" },
  { href: "/admin/settings", label: "সেটিংস", icon: Settings, perm: "settings.view", divider: true, keywords: "settings" },
];

export function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}
