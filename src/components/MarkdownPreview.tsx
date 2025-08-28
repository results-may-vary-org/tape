import { useApp } from "@/context/AppContext";
import ReactMarkdown from "react-markdown";
import { Eye } from "lucide-react";

export function MarkdownPreview() {
  const { content, selectedPath, selectedIsDir } = useApp();
  if (!selectedPath || selectedIsDir) {
    return (
      <div className="h-full w-full text-muted-foreground flex items-center justify-center gap-2">
        <Eye className="size-5" />
        <span>Aucune note sélectionnée.</span>
      </div>
    );
  }
  return (
    <div className="prose dark:prose-invert max-w-none p-4 overflow-auto h-full">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
