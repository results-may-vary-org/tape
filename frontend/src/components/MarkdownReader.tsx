import React, { useEffect, useRef, useMemo } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';

interface MarkdownReaderProps {
  content: string;
  filePath: string | null;
  hasUnsavedChanges: boolean;
  originalContent: string;
}

const MarkdownReader: React.FC<MarkdownReaderProps> = ({ content, filePath, hasUnsavedChanges, originalContent }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const noteStats = useMemo(() => {
    if (!filePath || !content) return {
      chars: 0, words: 0, lines: 0,
      originalChars: 0, originalWords: 0, originalLines: 0,
      charsDelta: 0, wordsDelta: 0, linesDelta: 0
    };

    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;

    const originalChars = originalContent.length;
    const originalWords = originalContent.trim() ? originalContent.trim().split(/\s+/).length : 0;
    const originalLines = originalContent.split('\n').length;

    const charsDelta = chars - originalChars;
    const wordsDelta = words - originalWords;
    const linesDelta = lines - originalLines;

    return { chars, words, lines, originalChars, originalWords, originalLines, charsDelta, wordsDelta, linesDelta };
  }, [filePath, content, originalContent]);

  const formatDelta = (delta: number): string => {
    if (delta === 0) return '';
    return delta > 0 ? `+${delta}` : `${delta}`;
  };

  const getDeltaClass = (delta: number): string => {
    if (delta === 0) return 'stat-delta';
    return delta > 0 ? 'stat-delta stat-delta-positive' : 'stat-delta stat-delta-negative';
  };

  const getStatClass = (hasChanged: boolean, delta: number): string => {
    if (!hasUnsavedChanges || !hasChanged) return '';
    if (delta > 0) return 'stat-positive';
    if (delta < 0) return 'stat-negative';
    return 'stat-changed';
  };

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
          contentRef.current.querySelectorAll('code').forEach((block) => {
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
      <div className="note-status-bar vt32">
        <span className={getStatClass(noteStats.chars !== noteStats.originalChars, noteStats.charsDelta)}>Characters: {noteStats.chars}</span>{hasUnsavedChanges && noteStats.charsDelta !== 0 && <span className={getDeltaClass(noteStats.charsDelta)}> ({formatDelta(noteStats.charsDelta)})</span>} <span className={getStatClass(noteStats.words !== noteStats.originalWords, noteStats.wordsDelta)}>Words: {noteStats.words}</span>{hasUnsavedChanges && noteStats.wordsDelta !== 0 && <span className={getDeltaClass(noteStats.wordsDelta)}> ({formatDelta(noteStats.wordsDelta)})</span>} <span className={getStatClass(noteStats.lines !== noteStats.originalLines, noteStats.linesDelta)}>Lines: {noteStats.lines}</span>{hasUnsavedChanges && noteStats.linesDelta !== 0 && <span className={getDeltaClass(noteStats.linesDelta)}> ({formatDelta(noteStats.linesDelta)})</span>}
      </div>
      <div className="reader-content" ref={contentRef}>
      </div>
    </div>
  );
};

export default MarkdownReader;
