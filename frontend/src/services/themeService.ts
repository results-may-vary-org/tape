import type { ThemeMode, UIThemeMode } from "../types/types";

export interface RadixThemeSettings {
  accentColor: "gray" | "gold" | "bronze" | "brown" | "yellow" | "amber" | "orange" | "tomato" | "red" | "ruby" | "crimson" | "pink" | "plum" | "purple" | "violet" | "iris" | "indigo" | "blue" | "cyan" | "teal" | "jade" | "green" | "grass" | "lime" | "mint" | "sky";
  grayColor: "auto" | "gray" | "mauve" | "slate" | "sage" | "olive" | "sand";
  radius: "none" | "small" | "medium" | "large" | "full";
  scaling: "90%" | "95%" | "100%" | "105%" | "110%";
  appearance: "inherit" | "light" | "dark";
}

export interface UIThemePreset {
  id: UIThemeMode;
  label: string;
  appearance: "dark" | "light";
}

export const UI_THEMES: UIThemePreset[] = [
  { id: "default", label: "Default", appearance: "dark" },
  { id: "catppuccin-mocha", label: "Catppuccin Mocha", appearance: "dark" },
  { id: "catppuccin-macchiato", label: "Catppuccin Macchiato", appearance: "dark" },
  { id: "catppuccin-frappe", label: "Catppuccin Frappé", appearance: "dark" },
  { id: "catppuccin-latte", label: "Catppuccin Latte", appearance: "light" },
  { id: "rose-pine", label: "Rosé Pine", appearance: "dark" },
  { id: "rose-pine-moon", label: "Rosé Pine Moon", appearance: "dark" },
  { id: "rose-pine-dawn", label: "Rosé Pine Dawn", appearance: "light" },
  { id: "tokyo-night", label: "Tokyo Night", appearance: "dark" },
  { id: "tokyo-night-storm", label: "Tokyo Night Storm", appearance: "dark" },
  { id: "tokyo-night-light", label: "Tokyo Night Light", appearance: "light" },
];

export function getUIThemePreset(uiTheme: UIThemeMode): UIThemePreset {
  return UI_THEMES.find((preset) => preset.id === uiTheme) ?? UI_THEMES[0];
}

export function getRadixThemeSettings(uiTheme: UIThemeMode): RadixThemeSettings {
  const preset = getUIThemePreset(uiTheme);
  const base = { grayColor: "slate" as const, radius: "medium" as const, scaling: "100%" as const };
  switch (uiTheme) {
    case "catppuccin-mocha":
    case "catppuccin-macchiato":
    case "catppuccin-frappe":
    case "rose-pine":
    case "rose-pine-moon":
      return { ...base, accentColor: "iris", appearance: "dark" };
    case "catppuccin-latte":
    case "rose-pine-dawn":
      return { ...base, accentColor: "violet", appearance: "light" };
    case "tokyo-night":
    case "tokyo-night-storm":
    case "tokyo-night-light":
      return { ...base, accentColor: "blue", appearance: preset.appearance };
    case "default":
    default:
      return { ...base, accentColor: "violet", appearance: "inherit" };
  }
}

export function getThemeModeForUITheme(uiTheme: UIThemeMode): ThemeMode {
  if (uiTheme === "default") return "system";
  return getUIThemePreset(uiTheme).appearance;
}

export function isKnownUITheme(uiTheme: string | undefined): uiTheme is UIThemeMode {
  return !!uiTheme && UI_THEMES.some((preset) => preset.id === uiTheme);
}