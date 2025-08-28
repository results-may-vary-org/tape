import { useApp } from "@/context/AppContext";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import { fsService } from "@/services/fs";
import { FileText } from "lucide-react";
import {toast} from "sonner";

export function MarkdownEditor() {
  const { content, setContent, selectedPath, selectedIsDir, rootPath } = useApp();

  useDebouncedEffect(() => {
    if (!rootPath || !selectedPath || selectedIsDir) return;
    fsService.writeNote(rootPath, selectedPath, content).catch((err) => {
      toast.error(err.message);
    });
  }, [content, selectedPath, selectedIsDir, rootPath], 500);

  if (!selectedPath || selectedIsDir) {
    return (
      <div className="h-full w-full text-muted-foreground flex items-center justify-center gap-2">
        <FileText className="size-5" />
        <span>Sélectionnez une note pour éditer.</span>
      </div>
    );
  }

  return (
    <textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className="resize-none outline-none w-full"
      placeholder="Écrivez en Markdown..."
    />
  );
}
