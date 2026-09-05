"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "../app/providers";
import { useLanguage } from "../lib/language-context";
import LanguageSwitcher from "./LanguageSwitcher";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role, demoMode } = useAuth();
  const { t } = useLanguage();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const mainLinks = [
    { href: "/dashboard", icon: "⌂", label: t.nav.dashboard },
    { href: "/mock", icon: "◇", label: t.nav.fullMock },
    { href: "/history", icon: "↻", label: t.nav.history },
    { href: "/typing", icon: "⌨", label: t.nav.typing },
  ];

  const skillLinks = [
    {
      href: "/tests/reading",
      icon: "▤",
      name: t.modules.reading.name,
      desc: t.nav.readingDesc,
      tone: "blue",
    },
    {
      href: "/tests/listening",
      icon: "◉",
      name: t.modules.listening.name,
      desc: t.nav.listeningDesc,
      tone: "orange",
    },
    {
      href: "/tests/writing",
      icon: "✎",
      name: t.modules.writing.name,
      desc: t.nav.writingDesc,
      tone: "pink",
    },
    {
      href: "/tests/speaking",
      icon: "◌",
      name: t.modules.speaking.name,
      desc: t.nav.speakingDesc,
      tone: "green",
    },
  ];

  const drawerContent = (
    <>
      <div className="sidebar-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <Link className="product-logo" href="/" style={{ padding: "0 4px" }}>
          <span>IS</span>
          <strong>{t.nav.brand}</strong>
        </Link>
        <LanguageSwitcher variant="sidebar" />
      </div>

      <div className="practice-hub-card">
        <div className="hub-tag">
          <span className="hub-dot" />
          <strong>{t.nav.hubTitle}</strong>
        </div>
        <p className="hub-sub">{t.nav.hubSubtitle}</p>
      </div>

      <p className="side-label">{t.nav.overview}</p>
      <nav className="nav-group">
        {mainLinks.map(({ href, icon, label }) => (
          <Link
            className={`nav-link ${pathname === href ? "active" : ""}`}
            href={href}
            key={href}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <i>{icon}</i>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <p className="side-label">{t.nav.skillPractice}</p>
      <nav className="nav-group skill-group">
        {skillLinks.map(({ href, icon, name, desc, tone }) => (
          <Link
            className={`skill-nav-link ${pathname === href ? "active" : ""} tone-${tone}`}
            href={href}
            key={href}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <i className="skill-icon">{icon}</i>
            <div className="skill-meta">
              <strong>{name}</strong>
              <small>{desc}</small>
            </div>
          </Link>
        ))}
      </nav>

      {role === "admin" && (
        <>
          <p className="side-label">{t.nav.administration}</p>
          <nav className="nav-group">
            <Link
              className={`nav-link ${pathname.startsWith("/admin") ? "active" : ""}`}
              href="/admin"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <i>⚙</i>
              <span>{t.nav.adminPanel}</span>
            </Link>
          </nav>
        </>
      )}

      <div className="side-account" style={{ marginTop: "auto" }}>
        <span>{demoMode ? t.nav.demoMode : role.toUpperCase()}</span>
        <strong>{role === "admin" ? t.nav.administrator : t.nav.scholarAccount}</strong>
        <Link href="/login" onClick={() => setMobileDrawerOpen(false)}>
          {t.nav.accountSettings}
        </Link>
      </div>
    </>
  );

  return (
    <div className="product-shell">
      {/* Mobile Top Header with App Drawer Toggle */}
      <div className="mobile-top-bar">
        <button
          type="button"
          className="drawer-toggle"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          aria-label="Toggle App Drawer"
        >
          ☰
        </button>
        <Link className="product-logo" href="/" style={{ padding: 0 }}>
          <span>IS</span>
          <strong>{t.nav.brand}</strong>
        </Link>
        <LanguageSwitcher variant="header" />
      </div>

      {/* Mobile Slide-out Drawer */}
      {mobileDrawerOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          role="presentation"
        >
          <aside
            className="mobile-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="App Drawer"
          >
            <button
              type="button"
              className="drawer-close"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close Drawer"
            >
              ✕
            </button>
            {drawerContent}
          </aside>
        </div>
      )}

      {/* Desktop App Drawer (Permanently Open on Left) */}
      <aside className="product-sidebar">{drawerContent}</aside>

      <main className="product-main">{children}</main>
    </div>
  );
}
