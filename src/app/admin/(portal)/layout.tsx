import { AdminShell } from "@/components/shell/admin-shell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
