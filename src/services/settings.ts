import { invoke } from "@tauri-apps/api/core";

export type AppSettings = {
  viewMode: "edit" | "preview" | "split-vertical" | "split-horizontal";
  showLineNumbers: boolean;
  relativeLineNumbers: boolean;
  showConfigInSidebar: boolean;
  lastNotePath?: string | null;
};

export const settingsService = {
  async get(root: string): Promise<AppSettings> {
    return await invoke<AppSettings>("get_settings", { root });
  },
  async save(root: string, settings: AppSettings): Promise<void> {
    await invoke("save_settings", { root, settings });
  },
  async getLastRoot(): Promise<string | null> {
    return await invoke<string | null>("get_last_root");
  },
  async saveLastRoot(root: string | null): Promise<void> {
    await invoke("save_last_root", { root });
  },
};
