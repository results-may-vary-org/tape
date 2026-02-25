import React, { useEffect, useState } from "react";
import { Checkbox, Flex, Text } from "@radix-ui/themes";

import Markdown from "react-markdown";
import remarkRehype from "remark-rehype"; // for rehype-highlight
import remarkGfm from "remark-gfm"; // github flavor md
import codeTitle from "remark-code-title"; // add the possibility to add title to code block
import rehypeHighlight from "rehype-highlight"; // code colorization
import rehypeCallouts from "rehype-callouts"; // to html
import rehypeStringify from "rehype-stringify"; // render blockquote-based callouts (admonitions/alerts)
import rehypeHighlightLines from "rehype-highlight-code-lines";

// import "rehype-callouts/theme/obsidian";

interface MarkdownReaderProps {
  content: string;
  filePath: string | null;
  onContentChange?: (content: string) => void;
}

const MarkdownReader: React.FC<MarkdownReaderProps> = ({ content, filePath, onContentChange }: MarkdownReaderProps) => {
  const getTheme = () => document.documentElement.classList.contains("dark") ? "dark" : "light";

  const [theme, setTheme] = useState<"light" | "dark">(getTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // dynamically import css for code block
  useEffect(() => {
    const id = "hljs-theme";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    const styleEl = el;
    if (theme === "dark") {
      import("highlight.js/styles/github-dark.css?inline").then((css) => {
        styleEl.textContent = css.default;
      });
    } else {
      import("highlight.js/styles/github.min.css?inline").then((css) => {
        styleEl.textContent = css.default;
      });
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

  const toggleCheckbox = (index: number) => {
    if (!onContentChange) return;
    let count = 0;
    const updated = content.replace(
      /^(\s*[-*+]|\s*\d+\.) \[([ xX])\]/gm,
      (match, prefix, state) => {
        if (count++ === index) {
          return `${prefix} [${state.trim() === "" ? "x" : " "}]`;
        }
        return match;
      }
    );
    onContentChange(updated);
  };

  let checkboxIndex = 0;

  return (
    <div className="markdown-reader markdown-body" data-theme={theme}>
      <div className="reader-content">
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
            input: ({ type, checked }) => {
              if (type !== "checkbox") return null;
              const idx = checkboxIndex++;
              return (
                <Checkbox
                  checked={checked}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleCheckbox(idx);
                  }}
                />
              );
            },
            li: ({ children, className, node, ...props }) => {
              if (className?.includes("task-list-item")) {
                return <Text as="label" size="3"><Flex gap="2" className={className}>{children}</Flex></Text>;
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
