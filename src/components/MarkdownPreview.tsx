import { useApp } from "@/context/AppContext";
import remarkGfm from "remark-gfm";
import { Eye } from "lucide-react";
import rehypeSanitize from "rehype-sanitize";
import Markdown from "react-markdown";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {oneLight} from "react-syntax-highlighter/dist/esm/styles/prism";

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
    <div className="h-full w-full overflow-auto">
      <div className="max-w-full px-1 sm:px-2 md:px-3 [&_img]:max-w-full [&_img]:h-auto [&_table]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto break-words">
        <Markdown
          rehypePlugins={[rehypeSanitize]}
          remarkPlugins={[remarkGfm]}
          children={content}
          components={{
            code(props) {
              const {children, className, node, ...rest} = props
              const match = /language-(\w+)/.exec(className || '')
              return match ? (
                <SyntaxHighlighter
                  PreTag="div"
                  children={String(children).replace(/\n$/, '')}
                  language={match[1]}
                  style={oneLight}
                />
              ) : (
                <code {...rest} className={className}>
                  {children}
                </code>
              )
            }
          }}
        />
      </div>
    </div>
  );
}
