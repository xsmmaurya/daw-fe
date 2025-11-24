"use client";

import { useEffect, useState } from "react";

export default function ToggleTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "light";
    const current = document.documentElement.dataset.theme as "light" | "dark" | undefined;
    return current ?? "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("srotas-theme", theme);
    } catch {}
  }, [theme]);

  return (
    <button
      className="themeToggle"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79L6.76 4.84zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zm9-10h3v-2h-3v2zm-2.93 7.07l1.79 1.79 1.79-1.8-1.79-1.79-1.79 1.8zM13 1h-2v3h2V1zm-7.07 15.07l-1.8 1.79 1.8 1.79 1.79-1.79-1.79-1.79zM12 6a6 6 0 100 12A6 6 0 0012 6z"/></svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13A9 9 0 1 1 11 2.36 7 7 0 0 0 21.64 13z"/></svg>
      )}
    </button>
  );
}
