import React, { useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github.min.css";
import "highlight.js/styles/github-dark.css";

interface MarkdownReaderProps {
  content: string;
  filePath: string | null;
}

const MarkdownReader: React.FC<MarkdownReaderProps> = ({ content, filePath }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Configure marked for GitHub Flavored Markdown
    marked.setOptions({
      breaks: true,
      gfm: true,
      silent: false,
      async: true,
    });

    // Configure highlight.js
    hljs.configure({}); // seems that language is not mandatory
  }, []);

  useEffect(() => {
    if (contentRef.current && content) {
      // Parse markdown to HTML
      const processMarkdown = async () => {
        const htmlContent = await marked(content);
        if (contentRef.current) {
          contentRef.current.innerHTML = htmlContent;
          // Apply syntax highlighting to code blocks
          contentRef.current.querySelectorAll("code").forEach((block) => {
            hljs.highlightElement(block as HTMLElement);
          });
        }
      };
      processMarkdown();
    }
  }, [content]);

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
    <div className="markdown-reader">
      <div className="reader-content" ref={contentRef}>
      </div>
    </div>
  );
};

export default MarkdownReader;
