import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {Button} from "@/components/ui/button.tsx";
import {ChevronDown, Columns2, Eye, Pencil, Rows2, Settings} from "lucide-react";
import {useApp} from "@/context/AppContext.tsx";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {Label} from "@/components/ui/label.tsx";

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
  }
}

export function ViewSelector() {
  const { viewMode, setViewMode, showLineNumbers, relativeLineNumbers, setShowLineNumbers, setRelativeLineNumbers } = useApp();
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="flex items-center gap-2">
            <ModeIcon mode={viewMode} />
            {modeLabel(viewMode)}
            <ChevronDown className="size-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setViewMode("edit")} className="cursor-pointer">
            <Pencil className="size-4" /> Édition
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setViewMode("preview")} className="cursor-pointer">
            <Eye className="size-4" /> Preview
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setViewMode("split-vertical")} className="cursor-pointer">
            <Columns2 className="size-4" /> Split vertical
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setViewMode("split-horizontal")} className="cursor-pointer">
            <Rows2 className="size-4" /> Split horizontal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" title="Editor settings" aria-label="Editor settings" className="flex items-center gap-2">
            <Settings className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editor settings</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Label className="justify-between">
              <span>Show line numbers</span>
              <Switch checked={showLineNumbers} onCheckedChange={setShowLineNumbers} />
            </Label>
            <Label className="justify-between">
              <span>Relative line numbers</span>
              <Switch checked={relativeLineNumbers} onCheckedChange={setRelativeLineNumbers} disabled={!showLineNumbers} />
            </Label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
