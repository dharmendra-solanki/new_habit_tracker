"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Focus,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Sparkles,
  Sprout,
  Target,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/auth-provider";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/habits", label: "My habits", icon: Target },
  { href: "/dashboard/weekly", label: "Weekly rhythm", icon: CalendarDays },
  { href: "/dashboard/insights", label: "Little insights", icon: Sparkles },
  { href: "/dashboard/stats", label: "Your progress", icon: BarChart3 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function logout() {
    await signOut();
    router.replace("/");
  }

  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          type="button"
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`app-sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <Link href="/dashboard" className="brand-lockup app-brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark"><Focus size={17} /></span>
          <span>little by little</span>
        </Link>
        <div className="workspace-label">YOUR SPACE</div>
        <nav className="app-navigation" aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                href={href}
                key={href}
                className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                <span>{label}</span>
                {active && <span className="active-indicator" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-gentle-card">
            <div className="gentle-icon"><Sprout size={18} /></div>
            <strong>Growing takes time.</strong>
            <span>Be kind to yourself along the way.</span>
            <div className="gentle-decoration">✳</div>
          </div>
          <button type="button" className="sidebar-help" onClick={() => router.push("/dashboard/insights")}>
            <CircleHelp size={16} /> A little help
          </button>
          <div className="sidebar-user-wrap">
            <button type="button" className="sidebar-user" onClick={() => setUserMenuOpen((open) => !open)}>
              <span className="user-avatar">{initials || "Y"}</span>
              <span className="user-details"><strong>{user?.name}</strong><small>{user?.email}</small></span>
              <ChevronDown size={15} className={userMenuOpen ? "rotate-chevron" : ""} />
            </button>
            {userMenuOpen && (
              <button type="button" className="logout-action" onClick={logout}>
                <LogOut size={15} /> Sign out
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button type="button" className="mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div className="topbar-context"><span className="topbar-breadcrumb">YOUR SPACE</span><span className="breadcrumb-divider">/</span><span>{navigation.find((item) => item.href === pathname)?.label ?? "Your space"}</span></div>
          <div className="topbar-actions">
            <span className="today-pill"><span /> Your own pace</span>
            <Link href="/dashboard/habits" className="button button-dark button-small topbar-add"><Plus size={15} /> New habit</Link>
          </div>
        </header>
        <main className="dashboard-main">{children}</main>
        <footer className="dashboard-footer"><span>little by little <span>✳</span></span><span>There’s no rush. You’re right on time.</span></footer>
      </div>
      {mobileOpen && <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button>}
      <span className="shell-decoration" aria-hidden="true"><Activity size={20} /></span>
    </div>
  );
}
