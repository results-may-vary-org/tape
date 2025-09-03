import * as React from "react";
import {Sidebar, SidebarContent, SidebarHeader} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useApp } from "@/context/AppContext";
import { useModal } from "@/context/ModalContext";
import type { FsNode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  MousePointerSquareDashed,
  Pencil,
  Trash2,
} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";

function TreeNode({ node, level, expanded, onToggle, isExpandedFn }: { node: FsNode; level: number; expanded: boolean; onToggle: (path: string) => void; isExpandedFn: (path: string) => boolean; }) {
  const { selectedPath, selectedIsDir, selectPath, createFolder, createNote, renamePath, deletePath } = useApp();
  const modal = useModal();

  const handleOpen = async (e?: Event) => {
    e?.stopPropagation();
    await selectPath(node.path, node.is_dir);
  };

  const handleNewFolder = async (e?: Event) => {
    e?.stopPropagation();
    const name = await modal.prompt({ title: "New folder", placeholder: "Folder name" });
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createFolder(node.path, trimmed);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Error creating folder");
    }
  };

  const handleNewNote = async (e?: Event) => {
    e?.stopPropagation();
    const name = await modal.prompt({ title: "New note", placeholder: "Note name" });
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createNote(node.is_dir ? node.path : node.path.replace(/[^\/\\]+$/, ""), trimmed);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Error creating note");
    }
  };

  const handleRename = async (e?: Event) => {
    e?.stopPropagation();
    const defaultName = node.is_dir ? node.name : node.name.replace(/\.md$/i, "");
    const name = await modal.prompt({ title: "Rename", placeholder: "New name", defaultValue: defaultName, confirmText: "Rename" });
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await renamePath(node.path, trimmed);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Error during rename");
    }
  };

  const handleDelete = async (e?: Event) => {
    e?.stopPropagation();
    try {
      await deletePath(node.path);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Error deleting");
    }
  };

  return (
    <div className="select-none">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent",
              selectedPath === node.path && "bg-accent"
            )}
            style={{ paddingLeft: level * 12 + 8 }}
            onClick={() => { if (node.is_dir) { onToggle(node.path); } else { selectPath(node.path, node.is_dir); } }}
          >
            {node.is_dir ? (
              <button
                className="outline-none text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(node.path);
                }}
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            ) : (
              <span className="w-4 inline-block" />
            )}
            {node.is_dir ? <Folder className="size-4 text-muted-foreground" /> : <FileText className="size-4 text-muted-foreground" />}
            <span className={cn("text-xs", node.is_dir ? "font-semibold" : "")}>{node.name}</span>
            {(() => {
              let showDot = false;
              if (!selectedIsDir && selectedPath) {
                const normNodePath = node.path.replace(/\\/g, "/").replace(/\/+$/, "");
                const normSelPath = selectedPath.replace(/\\/g, "/").replace(/\/+$/, "");
                if (!node.is_dir && normSelPath === normNodePath) {
                  showDot = true;
                } else if (node.is_dir) {
                  const normNode = normNodePath;
                  const normSel = normSelPath;
                  const isAncestor = normSel.startsWith(normNode + "/");
                  if (isAncestor) {
                    const expandedSelf = isExpandedFn(node.path);
                    if (!expandedSelf) {
                      // ensure all ancestor folders along the path from root to this node are expanded
                      let p = normNode;
                      let ok = true;
                      while (true) {
                        const parent = p.replace(/\/[^\/]+$/, "");
                        if (!parent || parent === p) break;
                        // Only consider if this parent is also an ancestor of the selected path
                        if (normSel.startsWith(parent + "/")) {
                          if (!isExpandedFn(parent)) { ok = false; break; }
                          p = parent;
                        } else {
                          break;
                        }
                      }
                      if (ok) showDot = true;
                    }
                  }
                }
              }
              return (
                <div className={cn("ml-auto", showDot ? "opacity-100" : "opacity-40")}>
                  {showDot ? (
                    <span className="inline-block size-2 rounded-full bg-green-500" />
                  ) : (
                    <MousePointerSquareDashed className="size-3.5" />
                  )}
                </div>
              );
            })()}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <ContextMenuItem onSelect={handleOpen} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
            {node.is_dir ? <Folder className="size-4" /> : <FileText className="size-4" />}
            Open
          </ContextMenuItem>
          {node.is_dir && (
            <>
              <ContextMenuSeparator className="-mx-1 my-1 h-px bg-border" />
              <ContextMenuItem onSelect={handleNewFolder} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                <FolderPlus className="size-4" />
                New folder
              </ContextMenuItem>
              <ContextMenuItem onSelect={handleNewNote} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                <FilePlus className="size-4" />
                New note
              </ContextMenuItem>
            </>
          )}
          {!node.is_dir && (
            <>
              <ContextMenuSeparator className="-mx-1 my-1 h-px bg-border" />
              <ContextMenuItem onSelect={handleNewNote} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                <FilePlus className="size-4" />
                New note in this folder
              </ContextMenuItem>
            </>
          )}
          <ContextMenuSeparator className="-mx-1 my-1 h-px bg-border" />
          <ContextMenuItem onSelect={handleRename} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
            <Pencil className="size-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onSelect={handleDelete} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none data-[highlighted]:bg-destructive/10">
            <Trash2 className="size-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {node.is_dir && expanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} level={level + 1} expanded={isExpandedFn(child.path)} onToggle={onToggle} isExpandedFn={isExpandedFn} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const modal = useModal();
  const { rootPath, pickRoot, tree, selectedPath, selectedIsDir, createFolder, createNote, showConfigInSidebar, selectPath } = useApp();
  const parentForNew = selectedPath && selectedIsDir ? selectedPath : rootPath ?? "";

  const normalizePath = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/,"");

  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(() => new Set());
  const isExpanded = (p: string) => expandedPaths.has(normalizePath(p));
  const togglePath = (p: string) => setExpandedPaths((prev) => {
    const key = normalizePath(p);
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const expandAll = () => {
    const next = new Set<string>();
    const walk = (nodes: FsNode[]) => {
      for (const n of nodes) {
        if (n.is_dir) {
          next.add(normalizePath(n.path));
          if (n.children) walk(n.children);
        }
      }
    };
    walk(tree);
    setExpandedPaths(next);
  };
  const collapseAll = () => setExpandedPaths(new Set());

  // Auto-expand ancestor folders to reveal the selected note (excluding config file)
  React.useEffect(() => {
    if (!rootPath) return;
    if (!selectedPath) return;
    if (selectedIsDir) return;

    const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "");
    const cfgPath = `${norm(rootPath)}/carnet.config.json`;
    if (norm(selectedPath) === norm(cfgPath)) return;

    // Find ancestor directories for selectedPath within the current tree
    const ancestors: string[] = [];
    const walk = (nodes: FsNode[], parents: string[]): boolean => {
      for (const n of nodes) {
        if (n.is_dir) {
          const newParents = [...parents, norm(n.path)];
          if (n.children && n.children.length) {
            if (walk(n.children, newParents)) return true;
          }
        } else {
          if (norm(n.path) === norm(selectedPath)) {
            ancestors.push(...parents);
            return true;
          }
        }
      }
      return false;
    };
    walk(tree, []);

    if (ancestors.length) {
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        for (const a of ancestors) next.add(norm(a));
        return next;
      });
    }
  }, [rootPath, tree, selectedPath, selectedIsDir]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="outline" aria-label="Choose folder" onClick={pickRoot}>
                <FolderOpen className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Choose a folder</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="outline" aria-label="Collapse all" onClick={collapseAll}>
                <ChevronRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Collapse all</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="outline" aria-label="Expand all" onClick={expandAll}>
                <ChevronDown className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Expand all</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                aria-label="New folder"
                onClick={async () => {
                  const name = await modal.prompt({ title: "New folder", placeholder: "Folder name" });
                  if (name === null) return;
                  const trimmed = name.trim();
                  if (!trimmed) return;
                  try {
                    if (!rootPath) return;
                    await createFolder(rootPath, trimmed);
                  } catch (err: any) {
                    toast.error(typeof err === "string" ? err : err?.message || "Erreur lors de la création du dossier");
                  }
                }}
              >
                <FolderPlus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>New folder</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                aria-label="Nouvelle note"
                onClick={async () => {
                  const name = await modal.prompt({ title: "Nouvelle note", placeholder: "Nom de la note" });
                  if (name === null) return;
                  const trimmed = name.trim();
                  if (!trimmed) return;
                  try {
                    await createNote(parentForNew || rootPath!, trimmed);
                  } catch (err: any) {
                    toast.error(typeof err === "string" ? err : err?.message || "Erreur lors de la création de la note");
                  }
                }}
              >
                <FilePlus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>New note</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="text-xs text-muted-foreground break-all px-2 py-1">{rootPath || "Aucun dossier"}</div>
        <div className="flex-1 overflow-auto px-1 pb-2">
          {tree.map((n) => (
            <TreeNode key={n.path} node={n} level={0} expanded={isExpanded(n.path)} onToggle={togglePath} isExpandedFn={isExpanded} />
          ))}
          {showConfigInSidebar && rootPath && (
            <>
              <div className="border-t my-2" />
              {(() => {
                const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "");
                const cfgPath = `${norm(rootPath)}/carnet.config.json`;
                const isSelected = selectedPath && norm(selectedPath) === norm(cfgPath);
                return (
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent",
                      isSelected && "bg-accent"
                    )}
                    onClick={() => selectPath(cfgPath, false)}
                    title={cfgPath}
                  >
                    <span className="w-4 inline-block" />
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="text-xs">carnet.config.json</span>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
