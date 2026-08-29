import React, { useRef } from "react";
import { BrowserOpenURL } from "../../wailsjs/runtime/runtime";
import { useScrollSync } from "../services/useScrollSync";
import MarkdownBody from "./MarkdownBody";

interface MarkdownReaderProps {
  content: string;
  filePath: string | null;
  onContentChange?: (content: string) => void;
  scrollRatio?: number;
  onScrollChange?: (ratio: number) => void;
}

const MarkdownReader: React.FC<MarkdownReaderProps> = ({ content, filePath, scrollRatio, onScrollChange }: MarkdownReaderProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  useScrollSync(contentRef, scrollRatio, onScrollChange);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    const link = target.closest('a');
    if (link && link.href && /^https?:\/\//i.test(link.href)) {
      e.preventDefault();
      BrowserOpenURL(link.href);
    }
  };

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
      <div className="reader-content" ref={contentRef} onClick={handleClick}>
        <MarkdownBody content={content} />
      </div>
    </div>
  );
};

export default MarkdownReader;