import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthRedirect } from "@/features/auth/auth-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthRedirect>
      <AppShell>{children}</AppShell>
    </AuthRedirect>
  );
}
