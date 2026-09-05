"use client";

import { useLanguage } from "../lib/language-context";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "header" | "sidebar" | "subtle";
}

export default function LanguageSwitcher({ className = "", variant = "header" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`lang-switcher lang-switcher-${variant} ${className}`} role="group" aria-label="Language selection">
      <button
        type="button"
        className={`lang-btn ${language === "en" ? "active" : ""}`}
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
      >
        <span className="lang-code">EN</span>
      </button>
      <span className="lang-divider">/</span>
      <button
        type="button"
        className={`lang-btn ${language === "bn" ? "active" : ""}`}
        onClick={() => setLanguage("bn")}
        aria-pressed={language === "bn"}
      >
        <span className="lang-code">বাং</span>
      </button>
    </div>
  );
}
