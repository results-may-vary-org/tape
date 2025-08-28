import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useApp } from "@/context/AppContext"
import { useModal } from "@/context/ModalContext"
import type { FsNode } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
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
} from "lucide-react"

function TreeNode({ node, level, expanded, onToggle, isExpandedFn }: { node: FsNode; level: number; expanded: boolean; onToggle: (path: string) => void; isExpandedFn: (path: string) => boolean; }) {
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
            onClick={() => { if (node.is_dir) { onToggle(node.path); } else { selectPath(node.path, node.is_dir); } }}
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
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const modal = useModal();
  const { rootPath, pickRoot, tree, selectedPath, selectedIsDir, createFolder, createNote } = useApp();
  const parentForNew = selectedPath && selectedIsDir ? selectedPath : rootPath ?? "";

  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(() => new Set());
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
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="p-2">
        <div className="flex items-center gap-2">
          {/* 5 buttons horizontally with same style */}
          <Button size="icon" variant="outline" aria-label="Choisir dossier" onClick={pickRoot}>
            <FolderOpen className="size-4" />
          </Button>
          <Button size="icon" variant="outline" aria-label="Tout réduire" onClick={collapseAll}>
            <ChevronRight className="size-4" />
          </Button>
          <Button size="icon" variant="outline" aria-label="Tout développer" onClick={expandAll}>
            <ChevronDown className="size-4" />
          </Button>
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
            <FolderPlus className="size-4" />
          </Button>
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
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="text-xs text-muted-foreground break-all px-2 py-1">{rootPath || "Aucun dossier"}</div>
        <div className="flex-1 overflow-auto px-1 pb-2">
          {tree.map((n) => (
            <TreeNode key={n.path} node={n} level={0} expanded={isExpanded(n.path)} onToggle={togglePath} isExpandedFn={isExpanded} />
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
