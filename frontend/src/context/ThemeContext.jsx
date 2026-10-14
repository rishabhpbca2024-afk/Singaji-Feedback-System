import React, { createContext, useContext, useState, useEffect } from "react";

export const COLOR_PALETTES = [
  {
    id: "orange",
    name: "Singaji Sunset",
    tagline: "Institutional Default",
    primary: "#f97316",
    primaryHover: "#ea580c",
    primaryActive: "#c2410c",
    primaryLight: "#ffedd5",
    primarySubtle: "#fff7ed",
    shadowRgb: "249, 115, 22",
  },
  {
    id: "blue",
    name: "Sapphire Blue",
    tagline: "Executive Corporate",
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    primaryActive: "#1e40af",
    primaryLight: "#dbeafe",
    primarySubtle: "#eff6ff",
    shadowRgb: "37, 99, 235",
  },
  {
    id: "green",
    name: "Emerald Green",
    tagline: "Fresh Botanic",
    primary: "#059669",
    primaryHover: "#047857",
    primaryActive: "#065f46",
    primaryLight: "#d1fae5",
    primarySubtle: "#ecfdf5",
    shadowRgb: "5, 150, 105",
  },
  {
    id: "purple",
    name: "Imperial Violet",
    tagline: "Royal Modern",
    primary: "#7c3aed",
    primaryHover: "#6d28d9",
    primaryActive: "#5b21b6",
    primaryLight: "#ede9fe",
    primarySubtle: "#f5f3ff",
    shadowRgb: "124, 58, 237",
  },
  {
    id: "rose",
    name: "Ruby Crimson",
    tagline: "High-Energy Rose",
    primary: "#e11d48",
    primaryHover: "#be123c",
    primaryActive: "#9f1239",
    primaryLight: "#ffe4e6",
    primarySubtle: "#fff1f2",
    shadowRgb: "225, 29, 72",
  },
  {
    id: "teal",
    name: "Nordic Teal",
    tagline: "Calm Cyan Ocean",
    primary: "#0891b2",
    primaryHover: "#0e7490",
    primaryActive: "#155e75",
    primaryLight: "#cffafe",
    primarySubtle: "#ecfeff",
    shadowRgb: "8, 145, 178",
  },
  {
    id: "amber",
    name: "Prestige Amber",
    tagline: "Golden Warmth",
    primary: "#d97706",
    primaryHover: "#b45309",
    primaryActive: "#92400e",
    primaryLight: "#fef3c7",
    primarySubtle: "#fffbeb",
    shadowRgb: "217, 119, 6",
  },
  {
    id: "slate",
    name: "Slate Carbon",
    tagline: "Minimalist Stealth",
    primary: "#475569",
    primaryHover: "#334155",
    primaryActive: "#1e293b",
    primaryLight: "#f1f5f9",
    primarySubtle: "#f8fafc",
    shadowRgb: "71, 85, 105",
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [currentPaletteId, setCurrentPaletteId] = useState(() => {
    return localStorage.getItem("app_palette") || "orange";
  });

  useEffect(() => {
    const palette =
      COLOR_PALETTES.find((p) => p.id === currentPaletteId) || COLOR_PALETTES[0];
    const root = document.documentElement;

    // Remove any leftover data-theme attribute
    root.removeAttribute("data-theme");
    localStorage.removeItem("app_theme_mode");

    // Apply color palette variables
    root.style.setProperty("--primary", palette.primary);
    root.style.setProperty("--primary-hover", palette.primaryHover);
    root.style.setProperty("--primary-active", palette.primaryActive);
    root.style.setProperty("--primary-light", palette.primaryLight);
    root.style.setProperty("--primary-subtle", palette.primarySubtle);
    root.style.setProperty("--primary-rgb", palette.shadowRgb);
    root.style.setProperty("accent-color", palette.primaryHover);

    // Neutral base styling
    root.style.setProperty("--bg-main", "#f8fafc");
    root.style.setProperty("--bg-surface", "#ffffff");
    root.style.setProperty("--bg-subtle", "#f1f5f9");
    root.style.setProperty("--text-primary", "#0f172a");
    root.style.setProperty("--text-secondary", "#475569");
    root.style.setProperty("--text-muted", "#94a3b8");
    root.style.setProperty("--border-light", "#e2e8f0");
    root.style.setProperty("--border-hover", "#cbd5e1");

    root.setAttribute("data-palette", palette.id);
    localStorage.setItem("app_palette", palette.id);
  }, [currentPaletteId]);

  const selectPalette = (paletteId) => {
    setCurrentPaletteId(paletteId);
  };

  const activePalette =
    COLOR_PALETTES.find((p) => p.id === currentPaletteId) || COLOR_PALETTES[0];

  return (
    <ThemeContext.Provider
      value={{
        currentPaletteId,
        activePalette,
        selectPalette,
        palettes: COLOR_PALETTES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
