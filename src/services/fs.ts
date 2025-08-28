import { invoke } from "@tauri-apps/api/core";
import type { FsNode } from "@/lib/types";

export const fsService = {
  async pickRoot(): Promise<string | null> {
    return await invoke<string | null>("pick_root");
  },
  async listTree(root: string): Promise<FsNode[]> {
    return await invoke<FsNode[]>("list_tree", { root });
  },
  async readNote(root: string, path: string): Promise<string> {
    return await invoke<string>("read_note", { root, path });
  },
  async writeNote(root: string, path: string, content: string): Promise<void> {
    await invoke("write_note", { root, path, content });
  },
  async createFolder(root: string, parent: string, name: string): Promise<string> {
    return await invoke<string>("create_folder", { root, parent, name });
  },
  async createNote(root: string, dir: string, name: string): Promise<string> {
    return await invoke<string>("create_note", { root, dir, name });
  },
  async renamePath(root: string, path: string, newName: string): Promise<string> {
    return await invoke<string>("rename_path", { root, path, newName });
  },
  async deletePath(root: string, path: string): Promise<void> {
    await invoke("delete_path", { root, path });
  },
};
