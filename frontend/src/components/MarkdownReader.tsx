import React from "react";
import "highlight.js/styles/github.min.css";
import "highlight.js/styles/github-dark.css";

import Markdown from "react-markdown";
import remarkRehype from "remark-rehype"; // for rehype-highlight
import remarkGfm from "remark-gfm"; // github flavor md
import codeTitle from "remark-code-title"; // add the possibility to add title to code block
import rehypeHighlight from "rehype-highlight"; // code colorization

interface MarkdownReaderProps {
  content: string;
  filePath: string | null;
}

const MarkdownReader: React.FC<MarkdownReaderProps> = ({ content, filePath }) => {
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
      <div className="reader-content">
        <Markdown
          remarkPlugins={[remarkGfm, codeTitle]}
          rehypePlugins={[remarkRehype, rehypeHighlight]}
        >{content}</Markdown>
      </div>
    </div>
  );
};

export default MarkdownReader;
