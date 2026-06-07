"use client";

import { useTheme } from "./theme-provider";
import { MoonIcon, SunIcon } from "@/components/icons";

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

export function ThemeToggle({ className = "", compact }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={isLight}
      className={`theme-toggle flex items-center justify-center rounded-lg border transition ${compact ? "h-10 w-10" : "gap-2 px-3 py-1.5 text-xs"} ${className}`}
    >
      {isLight ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      {!compact ? <span>{isLight ? "Light" : "Dark"}</span> : null}
    </button>
  );
}
