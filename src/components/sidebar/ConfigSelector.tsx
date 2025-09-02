import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Settings} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {useApp} from "@/context/AppContext.tsx";

export function ConfigSelector() {
  const {showLineNumbers, relativeLineNumbers, setShowLineNumbers, setRelativeLineNumbers} = useApp();
  return (
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
  )
}
