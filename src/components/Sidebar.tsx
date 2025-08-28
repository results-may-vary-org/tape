import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FsNode } from "@/lib/types";
import { Folder, FileText, FolderPlus, FilePlus, Pencil, Trash2, FolderOpen, MousePointerSquareDashed, ChevronRight, ChevronDown } from "lucide-react";
import { useModal } from "@/context/ModalContext";
import { toast } from "sonner";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


type TreeNodeProps = {
  node: FsNode;
  level: number;
  expanded: boolean;
  onToggle: (path: string) => void;
  isExpandedFn: (path: string) => boolean;
};

function TreeNode({ node, level, expanded, onToggle, isExpandedFn }: TreeNodeProps) {
  const { selectedPath, selectPath, createFolder, createNote, renamePath, deletePath } = useApp();
  const modal = useModal();

  const handleOpen = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    await selectPath(node.path, node.is_dir);
  };

  const handleNewFolder = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const name = await modal.prompt({ title: "Nouveau dossier", placeholder: "Nom du dossier" });
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createFolder(node.path, trimmed);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erreur lors de la création du dossier");
    }
  };

  const handleNewNote = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const name = await modal.prompt({ title: "Nouvelle note", placeholder: "Nom de la note" });
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createNote(node.is_dir ? node.path : node.path.replace(/[^\/\\]+$/, ""), trimmed);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erreur lors de la création de la note");
    }
  };

  const handleRename = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const defaultName = node.is_dir ? node.name : node.name.replace(/\.md$/i, "");
    const name = await modal.prompt({ title: "Renommer", placeholder: "Nouveau nom", defaultValue: defaultName, confirmText: "Renommer" });
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await renamePath(node.path, trimmed);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erreur lors du renommage");
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await deletePath(node.path);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erreur lors de la suppression");
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
            onClick={() => selectPath(node.path, node.is_dir)}
          >
            {node.is_dir ? (
              <button
                className="outline-none text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(node.path);
                }}
                aria-label={expanded ? "Réduire" : "Développer"}
              >
                {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            ) : (
              <span className="w-4 inline-block" />
            )}
            {node.is_dir ? <Folder className="size-4 text-muted-foreground" /> : <FileText className="size-4 text-muted-foreground" />}
            <span className={cn("text-xs", node.is_dir ? "font-semibold" : "")}>{node.name}</span>
            <div className="ml-auto opacity-40">
              <MousePointerSquareDashed className="size-3.5" />
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <ContextMenuItem onSelect={handleOpen} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
            {node.is_dir ? <Folder className="size-4" /> : <FileText className="size-4" />}
            Ouvrir
          </ContextMenuItem>
          {node.is_dir && (
            <>
              <ContextMenuSeparator className="-mx-1 my-1 h-px bg-border" />
              <ContextMenuItem onSelect={handleNewFolder} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                <FolderPlus className="size-4" />
                Nouveau dossier
              </ContextMenuItem>
              <ContextMenuItem onSelect={handleNewNote} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                <FilePlus className="size-4" />
                Nouvelle note
              </ContextMenuItem>
            </>
          )}
          {!node.is_dir && (
            <>
              <ContextMenuSeparator className="-mx-1 my-1 h-px bg-border" />
              <ContextMenuItem onSelect={handleNewNote} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                <FilePlus className="size-4" />
                Nouvelle note dans ce dossier
              </ContextMenuItem>
            </>
          )}
          <ContextMenuSeparator className="-mx-1 my-1 h-px bg-border" />
          <ContextMenuItem onSelect={handleRename} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
            <Pencil className="size-4" />
            Renommer
          </ContextMenuItem>
          <ContextMenuItem onSelect={handleDelete} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none data-[highlighted]:bg-destructive/10">
            <Trash2 className="size-4" />
            Supprimer
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
  );
}

export function Sidebar() {
  const modal = useModal();
  const { rootPath, pickRoot, tree, selectedPath, selectedIsDir, createFolder, createNote } = useApp();

  const parentForNew = selectedPath && selectedIsDir ? selectedPath : rootPath ?? "";

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());
  const isExpanded = (p: string) => expandedPaths.has(p);
  const togglePath = (p: string) => setExpandedPaths((prev) => {
    const next = new Set(prev);
    if (next.has(p)) next.delete(p); else next.add(p);
    return next;
  });

  const expandAll = () => {
    const next = new Set<string>();
    const walk = (nodes: FsNode[]) => {
      for (const n of nodes) {
        if (n.is_dir) {
          next.add(n.path);
          if (n.children) walk(n.children);
        }
      }
    };
    walk(tree);
    setExpandedPaths(next);
  };
  const collapseAll = () => setExpandedPaths(new Set());

  return (
    <div className="h-full w-64 border-r bg-sidebar p-2 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="outline" aria-label="Choisir dossier" onClick={pickRoot}>
              <FolderOpen />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="z-50 rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
            Choisir dossier
          </TooltipContent>
        </Tooltip>
        {rootPath && (
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" aria-label="Tout réduire" onClick={collapseAll}>
                  <ChevronRight className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="z-50 rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
                Tout réduire
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" aria-label="Tout développer" onClick={expandAll}>
                  <ChevronDown className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="z-50 rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
                Tout développer
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      {rootPath && (
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                aria-label="Nouveau dossier"
                onClick={async () => {
                  const name = await modal.prompt({ title: "Nouveau dossier", placeholder: "Nom du dossier" });
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
                <FolderPlus />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="z-50 rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
              Nouveau dossier
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
                <FilePlus />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="z-50 rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
              Nouvelle note
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      <div className="text-xs text-muted-foreground break-all px-1">{rootPath || "Aucun dossier"}</div>
      <div className="flex-1 overflow-auto">
        {tree.map((n) => (
          <TreeNode key={n.path} node={n} level={0} expanded={isExpanded(n.path)} onToggle={togglePath} isExpandedFn={isExpanded} />
        ))}
      </div>
    </div>
  );
}
