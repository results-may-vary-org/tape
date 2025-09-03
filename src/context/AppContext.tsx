import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FsNode, ViewMode } from "@/lib/types";
import { fsService } from "@/services/fs";
import { useModal } from "@/context/ModalContext";
import { settingsService } from "@/services/settings";

export type AppState = {
  rootPath: string | null;
  tree: FsNode[];
  selectedPath: string | null; // absolute path
  selectedIsDir: boolean;
  content: string;
  viewMode: ViewMode;
  orientation: "vertical" | "horizontal"; // for split only
  // editor settings
  showLineNumbers: boolean;
  relativeLineNumbers: boolean;
  // workspace settings
  showConfigInSidebar: boolean;
  // actions
  pickRoot: () => Promise<void>;
  refreshTree: (root?: string | null) => Promise<void>;
  selectPath: (path: string, isDir: boolean) => Promise<void>;
  setContent: (s: string) => void;
  setViewMode: (m: ViewMode) => void;
  setShowLineNumbers: (v: boolean) => void;
  setRelativeLineNumbers: (v: boolean) => void;
  setShowConfigInSidebar: (v: boolean) => void;
  createFolder: (parent: string, name: string) => Promise<void>;
  createNote: (dir: string, name: string) => Promise<void>;
  renamePath: (path: string, newName: string) => Promise<void>;
  deletePath: (path: string) => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const modal = useModal();
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [tree, setTree] = useState<FsNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedIsDir, setSelectedIsDir] = useState(false);
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(() => {
    const v = localStorage.getItem("editor.showLineNumbers");
    return v === null ? true : v === "true";
  });
  const [relativeLineNumbers, setRelativeLineNumbers] = useState<boolean>(() => {
    const v = localStorage.getItem("editor.relativeLineNumbers");
    return v === null ? false : v === "true";
  });
  const [showConfigInSidebar, setShowConfigInSidebar] = useState<boolean>(false);
  const [lastNotePath, setLastNotePath] = useState<string | null>(null);

  // On first mount: restore last root from persistent settings, validate it, or ask user
  useEffect(() => {
    (async () => {
      try {
        // Try persistent settings first
        let candidate = await settingsService.getLastRoot();
        // Fallback to legacy localStorage if present
        if (!candidate) candidate = localStorage.getItem("rootPath");
        if (candidate) {
          try {
            await fsService.listTree(candidate);
            setRootPath(candidate);
            localStorage.setItem("rootPath", candidate);
            await settingsService.saveLastRoot(candidate).catch(() => void 0);
          } catch {
            // invalid or missing; clear and ask
            await settingsService.saveLastRoot(null).catch(() => void 0);
            localStorage.removeItem("rootPath");
            const p = await fsService.pickRoot();
            if (p) {
              setRootPath(p);
              localStorage.setItem("rootPath", p);
              await settingsService.saveLastRoot(p).catch(() => void 0);
            }
          }
        } else {
          const p = await fsService.pickRoot();
          if (p) {
            setRootPath(p);
            localStorage.setItem("rootPath", p);
            await settingsService.saveLastRoot(p).catch(() => void 0);
          }
        }
      } catch (e) {
        console.warn("Failed to initialize root path", e);
      }
    })();
  }, []);

  // Load settings from native config (carnet.config.json) when a root is selected
  useEffect(() => {
    if (!rootPath) return;
    (async () => {
      try {
        const s = await settingsService.get(rootPath);
        setViewMode(s.viewMode as ViewMode);
        setOrientation(s.viewMode === "split-horizontal" ? "horizontal" : "vertical");
        setShowLineNumbers(s.showLineNumbers);
        setRelativeLineNumbers(s.relativeLineNumbers);
        setShowConfigInSidebar(Boolean(s.showConfigInSidebar));
        setLastNotePath(s.lastNotePath ?? null);
      } catch (err) {
        console.warn("Failed to load settings from backend", err);
      }
    })();
  }, [rootPath]);

  useEffect(() => {
    if (!rootPath) return;
    refreshTree(rootPath);
  }, [rootPath]);

  // Auto-select last opened note on startup (excluding config file)
  useEffect(() => {
    if (!rootPath) return;
    if (selectedPath) return;
    if (!lastNotePath) return;

    const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "");
    const cfgPath = `${norm(rootPath)}/carnet.config.json`;
    if (norm(lastNotePath) === norm(cfgPath)) return;

    // Check the lastNotePath exists in the current tree and is a file
    const existsInTree = (nodes: FsNode[]): boolean => {
      for (const n of nodes) {
        if (norm(n.path) === norm(lastNotePath) && !n.is_dir) return true;
        if (n.children && n.children.length && existsInTree(n.children)) return true;
      }
      return false;
    };

    if (existsInTree(tree)) {
      // Fire and forget; selectPath will read and set selected state
      selectPath(lastNotePath, false).catch(() => void 0);
    }
  }, [rootPath, tree, lastNotePath, selectedPath]);

  async function pickRoot() {
    const p = await fsService.pickRoot();
    if (p) {
      setRootPath(p);
      localStorage.setItem("rootPath", p);
      await settingsService.saveLastRoot(p).catch(() => void 0);
      await refreshTree(p);
      setSelectedPath(null);
      setContent("");
    }
  }

  async function refreshTree(root?: string | null) {
    const rp = root ?? rootPath;
    if (!rp) return;
    const t = await fsService.listTree(rp);
    setTree(t);
  }

  async function selectPath(path: string, isDir: boolean) {
    setSelectedPath(path);
    setSelectedIsDir(isDir);
    if (!isDir && rootPath) {
      const c = await fsService.readNote(rootPath, path);
      setContent(c);
      const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "");
      const cfgPath = `${norm(rootPath)}/carnet.config.json`;
      const isConfig = norm(path) === norm(cfgPath);
      if (!isConfig) {
        setLastNotePath(path);
        // persist last note path along with other settings
        try {
          await settingsService.save(rootPath, {
            viewMode,
            showLineNumbers,
            relativeLineNumbers,
            showConfigInSidebar,
            lastNotePath: path,
          });
        } catch (_) { /* ignore */ }
      }
    } else {
      setContent("");
    }
  }

  async function createFolder(parent: string, name: string) {
    if (!rootPath) return;
    await fsService.createFolder(rootPath, parent, name);
    await refreshTree();
  }

  async function createNote(dir: string, name: string) {
    if (!rootPath) return;
    const p = await fsService.createNote(rootPath, dir, name);
    await refreshTree();
    await selectPath(p, false);
  }

  async function renamePath(path: string, newName: string) {
    if (!rootPath) return;
    const newPath = await fsService.renamePath(rootPath, path, newName);
    await refreshTree();
    if (selectedPath === path) setSelectedPath(newPath);
  }

  async function deletePath(path: string) {
    if (!rootPath) return;
    const ok = await modal.confirm({
      title: "Delete",
      description: "Do you want to delete this item?",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
    });
    if (!ok) return;
    await fsService.deletePath(rootPath, path);
    await refreshTree();
    if (selectedPath === path) {
      setSelectedPath(null);
      setContent("");
    }
  }

  const value = useMemo<AppState>(() => ({
    rootPath,
    tree,
    selectedPath,
    selectedIsDir,
    content,
    viewMode,
    orientation,
    showLineNumbers,
    relativeLineNumbers,
    showConfigInSidebar,
    pickRoot,
    refreshTree,
    selectPath,
    setContent,
    setViewMode: (m: ViewMode) => {
      setViewMode(m);
      setOrientation(m === "split-horizontal" ? "horizontal" : "vertical");
      // persist settings to native config
      if (rootPath) {
        settingsService.save(rootPath, {
          viewMode: m,
          showLineNumbers,
          relativeLineNumbers,
          showConfigInSidebar,
          lastNotePath,
        }).catch(() => void 0);
      }
    },
    setShowLineNumbers: (v: boolean) => {
      setShowLineNumbers(v);
      localStorage.setItem("editor.showLineNumbers", String(v));
      // persist settings to native config
      if (rootPath) {
        settingsService.save(rootPath, {
          viewMode,
          showLineNumbers: v,
          relativeLineNumbers,
          showConfigInSidebar,
          lastNotePath,
        }).catch(() => void 0);
      }
    },
    setRelativeLineNumbers: (v: boolean) => {
      setRelativeLineNumbers(v);
      localStorage.setItem("editor.relativeLineNumbers", String(v));
      // persist settings to native config
      if (rootPath) {
        settingsService.save(rootPath, {
          viewMode,
          showLineNumbers,
          relativeLineNumbers: v,
          showConfigInSidebar,
          lastNotePath,
        }).catch(() => void 0);
      }
    },
    setShowConfigInSidebar: (v: boolean) => {
      setShowConfigInSidebar(v);
      if (rootPath) {
        settingsService.save(rootPath, {
          viewMode,
          showLineNumbers,
          relativeLineNumbers,
          showConfigInSidebar: v,
          lastNotePath,
        }).catch(() => void 0);
      }
    },
    createFolder,
    createNote,
    renamePath,
    deletePath,
  }), [rootPath, tree, selectedPath, selectedIsDir, content, viewMode, orientation, showLineNumbers, relativeLineNumbers, showConfigInSidebar, lastNotePath]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
