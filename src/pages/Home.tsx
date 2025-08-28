import React from "react";
import { SplitView } from "@/components/SplitView";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Columns2, Rows2, Layers, FolderOpen, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

function ModeIcon({ mode }: { mode: ReturnType<typeof useApp>["viewMode"] }) {
  switch (mode) {
    case "edit":
      return <Pencil className="size-4" />;
    case "preview":
      return <Eye className="size-4" />;
    case "split-vertical":
      return <Columns2 className="size-4" />;
    case "split-horizontal":
      return <Rows2 className="size-4" />;
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
  const { rootPath, pickRoot, viewMode, setViewMode, selectedPath } = useApp();

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

  const normalizedRoot = (rootPath || "").replace(/\\/g, "/");
  const normalizedSel = (selectedPath || "").replace(/\\/g, "/");
  let rel = "";
  if (selectedPath) {
    rel = normalizedSel.startsWith(normalizedRoot)
      ? normalizedSel.slice(normalizedRoot.length).replace(/^\/+/, "")
      : (selectedPath || "");
  }

  // We don't display the main folder (rootName) in the breadcrumb, only relative parts.
  const breadcrumbParts = rel ? rel.split("/").filter(Boolean) : [];;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbParts.length > 0 ? (
                  (() => {
                    const segs = breadcrumbParts
                    if (segs.length <= 3) {
                      return segs.map((seg, idx) => (
                        <React.Fragment key={idx}>
                          <BreadcrumbItem>
                            {idx < segs.length - 1 ? (
                              <BreadcrumbLink href="#">{seg}</BreadcrumbLink>
                            ) : (
                              <BreadcrumbPage>{seg}</BreadcrumbPage>
                            )}
                          </BreadcrumbItem>
                          {idx < segs.length - 1 && <BreadcrumbSeparator />}
                        </React.Fragment>
                      ))
                    } else {
                      // Render: first, ellipsis, second-last, last
                      const first = segs[0]
                      const secondLast = segs[segs.length - 2]
                      const last = segs[segs.length - 1]
                      return (
                        <>
                          <BreadcrumbItem>
                            <BreadcrumbLink href="#">{first}</BreadcrumbLink>
                          </BreadcrumbItem>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbEllipsis />
                          </BreadcrumbItem>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbLink href="#">{secondLast}</BreadcrumbLink>
                          </BreadcrumbItem>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbPage>{last}</BreadcrumbPage>
                          </BreadcrumbItem>
                        </>
                      )
                    }
                  })()
                ) : null}
              </BreadcrumbList>
            </Breadcrumb>
            <Separator orientation="vertical" className="ml-2 mr-2 data-[orientation=vertical]:h-4" />
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
                  <Columns2 className="size-4" /> Split vertical
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground" onSelect={() => setViewMode("split-horizontal")}>
                  <Rows2 className="size-4" /> Split horizontal
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground" onSelect={() => setViewMode("stack")}>
                  <Layers className="size-4" /> Stack
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex-1 overflow-hidden">
            <SplitView />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
