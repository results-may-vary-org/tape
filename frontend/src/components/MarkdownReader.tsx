import React, { useEffect, useRef, useState } from "react";
import { useScrollSync } from "../services/useScrollSync";
import { Checkbox, Flex, Text } from "@radix-ui/themes";

import Markdown from "react-markdown";
import remarkRehype from "remark-rehype"; // for rehype-highlight
import remarkGfm from "remark-gfm"; // github flavor md
import codeTitle from "remark-code-title"; // add the possibility to add title to code block
import rehypeHighlight from "rehype-highlight"; // code colorization
import rehypeCallouts from "rehype-callouts"; // to html
import rehypeStringify from "rehype-stringify"; // render blockquote-based callouts (admonitions/alerts)
import rehypeHighlightLines from "rehype-highlight-code-lines";

interface MarkdownReaderProps {
  content: string;
  filePath: string | null;
  onContentChange?: (content: string) => void;
  scrollRatio?: number;
  onScrollChange?: (ratio: number) => void;
}

const MarkdownReader: React.FC<MarkdownReaderProps> = ({ content, filePath, onContentChange, scrollRatio, onScrollChange }: MarkdownReaderProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  useScrollSync(contentRef, scrollRatio, onScrollChange);

  const getTheme = (): "dark" | "light" => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }
  const [theme, setTheme] = useState<"light" | "dark">(getTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // dynamically import css for code block
  useEffect(() => {
    const id = "hljs-theme";
    let styleElem = document.getElementById(id) as HTMLStyleElement | null;

    if (!styleElem) {
      styleElem = document.createElement("style");
      styleElem.id = id;
      document.head.appendChild(styleElem);
    }

    if (styleElem) {
      const e = styleElem; // because of the async operation
      if (theme === "dark") {
        import("highlight.js/styles/github-dark.css?inline").then((css) => {
          e.textContent = css.default;
        });
      } else {
        import("highlight.js/styles/github.min.css?inline").then((css) => {
          e.textContent = css.default;
        });
      }
    }

  }, [theme]);

  if (!filePath) {
    return (
      <div className="reader-empty">
        <p>Select a markdown file to view its content</p>
      </div>
    );
  }

  if (!content.trim()) {
    return (
      <div className="reader-empty">
        <p>This file is empty</p>
        <p>Switch to editor mode to add content</p>
      </div>
    );
  }

  return (
    <div className="markdown-reader markdown-body" data-theme={theme}>
      <div className="reader-content" ref={contentRef}>
        <Markdown
          remarkPlugins={[remarkGfm, codeTitle]}
          rehypePlugins={[
            remarkRehype,
            rehypeHighlight,
            [rehypeCallouts, { theme: 'github' }],
            [rehypeHighlightLines, { showLineNumbers: true }],
            rehypeStringify,
          ]}
          components={{
            input: ({ type, checked, ...props }) => {
              if (type !== "checkbox") return null;
              return (
                <Checkbox checked={checked}/>
              );
            },
            li: ({ children, className, node, ...props }) => {
              if (className?.includes("task-list-item")) {
                return (
                  <span {...props}>
                    <Text as="label" size="3">
                      <Flex gap="2" className={className}>
                        {children}
                      </Flex>
                    </Text>
                  </span>
                );
              }
              return <li className={className} {...props}>{children}</li>;
            },
          }}
        >{content}</Markdown>
      </div>
    </div>
  );
};

export default MarkdownReader;
