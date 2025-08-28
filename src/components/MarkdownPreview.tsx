import { useApp } from "@/context/AppContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye } from "lucide-react";
import rehypeSanitize from "rehype-sanitize";

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
    <ReactMarkdown
      rehypePlugins={[rehypeSanitize]}
      remarkPlugins={[remarkGfm]}
      children={content}
    />
  );
}
