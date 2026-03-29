import type { UIThemeMode } from "../types/types";

export interface RadixThemeSettings {
  accentColor: "gray" | "gold" | "bronze" | "brown" | "yellow" | "amber" | "orange" | "tomato" | "red" | "ruby" | "crimson" | "pink" | "plum" | "purple" | "violet" | "iris" | "indigo" | "blue" | "cyan" | "teal" | "jade" | "green" | "grass" | "lime" | "mint" | "sky";
  grayColor: "auto" | "gray" | "mauve" | "slate" | "sage" | "olive" | "sand";
  radius: "none" | "small" | "medium" | "large" | "full";
  scaling: "90%" | "95%" | "100%" | "105%" | "110%";
}

export function getRadixThemeSettings(uiTheme: UIThemeMode): RadixThemeSettings {
  switch (uiTheme) {
    case "modern":
      return { accentColor: "violet", grayColor: "slate", radius: "small", scaling: "100%" };
    case "agrume":
      return { accentColor: "orange", grayColor: "sand", radius: "small", scaling: "100%" };
    case "original":
    default:
      return { accentColor: "gold", grayColor: "sand", radius: "small", scaling: "100%" };
  }
}

