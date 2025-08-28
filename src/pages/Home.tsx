import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { SplitView } from "@/components/SplitView";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Columns3, Rows3, Layers, FolderOpen, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

function ModeIcon({ mode }: { mode: ReturnType<typeof useApp>["viewMode"] }) {
  switch (mode) {
    case "edit":
      return <Pencil className="size-4" />;
    case "preview":
      return <Eye className="size-4" />;
    case "split-vertical":
      return <Columns3 className="size-4" />;
    case "split-horizontal":
      return <Rows3 className="size-4" />;
    case "stack":
      return <Layers className="size-4" />;
    default:
      return null;
  }
}

function modeLabel(mode: ReturnType<typeof useApp>["viewMode"]) {
  switch (mode) {
    case "edit":
      return "Édition";
    case "preview":
      return "Preview";
    case "split-vertical":
      return "Split vertical";
    case "split-horizontal":
      return "Split horizontal";
    case "stack":
      return "Stack";
  }
}

export default function Home() {
  const { rootPath, pickRoot, viewMode, setViewMode } = useApp();

  if (!rootPath) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="flex flex-col gap-4 items-center">
          <div className="text-xl">Choisissez un dossier racine pour vos notes</div>
          <Button onClick={pickRoot}>
            <FolderOpen />
            Choisir un dossier
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b flex items-center gap-2 px-2">
          <div className="text-sm text-muted-foreground mr-2">Mode:</div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <ModeIcon mode={viewMode} />
                {modeLabel(viewMode)}
                <ChevronDown className="size-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 min-w-52 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              <DropdownMenuItem className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground" onSelect={() => setViewMode("edit")}>
                <Pencil className="size-4" /> Édition
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground" onSelect={() => setViewMode("preview")}>
                <Eye className="size-4" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground" onSelect={() => setViewMode("split-vertical")}>
                <Columns3 className="size-4" /> Split vertical
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground" onSelect={() => setViewMode("split-horizontal")}>
                <Rows3 className="size-4" /> Split horizontal
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground" onSelect={() => setViewMode("stack")}>
                <Layers className="size-4" /> Stack
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex-1 overflow-hidden">
          <SplitView />
        </div>
      </div>
    </div>
  );
}
