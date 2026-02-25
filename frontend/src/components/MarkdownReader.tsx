import React, { useEffect, useState } from "react";
import "highlight.js/styles/github.min.css";
import "highlight.js/styles/github-dark.css";

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
}

const MarkdownReader: React.FC<MarkdownReaderProps> = ({ content, filePath }) => {
  const getTheme = () =>
    document.documentElement.classList.contains("dark") ? "dark" : "light";

  const [theme, setTheme] = useState<"light" | "dark">(getTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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
      <div className="reader-content">
        <Markdown
          remarkPlugins={[remarkGfm, codeTitle]}
          rehypePlugins={[
            remarkRehype,
            rehypeHighlight,
            rehypeCallouts,
            [rehypeHighlightLines, { showLineNumbers: true }],
            rehypeStringify,
          ]}
        >{content}</Markdown>
      </div>
    </div>
  );
};

export default MarkdownReader;
