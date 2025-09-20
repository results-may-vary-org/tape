import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';

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
    });

    // Configure highlight.js
    hljs.configure({
      languages: ['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'go', 'rust', 'html', 'css', 'json', 'yaml', 'bash', 'sql']
    });
  }, []);

  useEffect(() => {
    if (contentRef.current && content) {
      // Parse markdown to HTML
      const processMarkdown = async () => {
        const htmlContent = await marked(content);
        if (contentRef.current) {
          contentRef.current.innerHTML = htmlContent;

          // Apply syntax highlighting to code blocks
          contentRef.current.querySelectorAll('pre code').forEach((block) => {
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
