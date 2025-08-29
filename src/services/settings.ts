import { invoke } from "@tauri-apps/api/core";

export type AppSettings = {
  viewMode: "edit" | "preview" | "split-vertical" | "split-horizontal";
  showLineNumbers: boolean;
  relativeLineNumbers: boolean;
};

export const settingsService = {
  async get(root: string): Promise<AppSettings> {
    return await invoke<AppSettings>("get_settings", { root });
  },
  async save(root: string, settings: AppSettings): Promise<void> {
    await invoke("save_settings", { root, settings });
  },
};
