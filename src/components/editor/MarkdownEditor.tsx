import { useApp } from "@/context/AppContext.tsx";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect.ts";
import { fsService } from "@/services/fs.ts";
import { FileText } from "lucide-react";
import {toast} from "sonner";
import {JSX} from "react";
import {getHello} from "@/services/hello.tsx";

export function MarkdownEditor({style}: { style?: JSX.IntrinsicElements["textarea"]["style"]}) {
  const { content, setContent, selectedPath, selectedIsDir, rootPath } = useApp();

  useDebouncedEffect(() => {
    if (!rootPath || !selectedPath || selectedIsDir) return;
    fsService.writeNote(rootPath, selectedPath, content)
      .then(() => toast.success("note saved"))
      .catch((err) => toast.error(err.message));
  }, [content, selectedPath, selectedIsDir, rootPath], 500);

  if (!selectedPath || selectedIsDir) {
    return (
      <div className="h-full w-full text-muted-foreground flex flex-col items-center justify-center">
        <div><i>{getHello()}</i></div>
        <div className="flex gap-2 pt-2">
          <FileText className="size-5" />
          <span>Select a note to start editing.</span>
        </div>
      </div>
    );
  }

  return (
    <textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className="resize-none outline-none w-full h-full bg-transparent p-2"
      placeholder={getHello()}
      style={style}
    />
  );
}
