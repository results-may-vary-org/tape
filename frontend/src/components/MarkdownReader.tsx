import React, { useEffect, useRef, useMemo } from 'react';
import { useDiffStats } from '../hooks/useDiffStats';
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

  // Use the new Git-powered diff stats
  const { diffResult } = useDiffStats(originalContent, content);

  const noteStats = useMemo(() => {
    if (!filePath || !content) return {
      chars: 0, words: 0, lines: 0,
      charsDelta: 0, wordsDelta: 0, linesDelta: 0,
      linesAdded: 0, linesRemoved: 0, linesModified: 0
    };

    if (!diffResult) {
      // Fallback to basic calculations if diff not ready
      const chars = content.length;
      const words = content.trim() ? content.trim().split(/\s+/).length : 0;
      const lines = content.split('\n').length;

      return {
        chars, words, lines,
        charsDelta: 0, wordsDelta: 0, linesDelta: 0,
        linesAdded: 0, linesRemoved: 0, linesModified: 0
      };
    }

    // Use Git diff results
    return {
      chars: diffResult.totalChars,
      words: diffResult.totalWords,
      lines: diffResult.totalLines,
      charsDelta: diffResult.charsAdded - diffResult.charsRemoved,
      wordsDelta: diffResult.wordsAdded - diffResult.wordsRemoved,
      linesDelta: diffResult.linesAdded - diffResult.linesRemoved,
      linesAdded: diffResult.linesAdded,
      linesRemoved: diffResult.linesRemoved,
      linesModified: diffResult.linesModified
    };
  }, [filePath, content, diffResult]);

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

  const formatGitLineDelta = (): string => {
    if (!hasUnsavedChanges || !diffResult) return '';
    const { linesAdded, linesRemoved, linesModified } = noteStats;

    let parts: string[] = [];
    if (linesAdded > 0) parts.push(`+${linesAdded}`);
    if (linesRemoved > 0) parts.push(`-${linesRemoved}`);
    if (linesModified > 0) parts.push(`~${linesModified}`);

    return parts.length > 0 ? ` (${parts.join('/')})` : '';
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
        <span className={getStatClass(noteStats.linesDelta !== 0, noteStats.linesDelta)}>Lines: {noteStats.lines}</span><span className="stat-delta stat-delta-positive">{formatGitLineDelta()}</span> <span className={getStatClass(noteStats.charsDelta !== 0, noteStats.charsDelta)}>Characters: {noteStats.chars}</span>{hasUnsavedChanges && noteStats.charsDelta !== 0 && <span className={getDeltaClass(noteStats.charsDelta)}> ({formatDelta(noteStats.charsDelta)})</span>} <span className={getStatClass(noteStats.wordsDelta !== 0, noteStats.wordsDelta)}>Words: {noteStats.words}</span>{hasUnsavedChanges && noteStats.wordsDelta !== 0 && <span className={getDeltaClass(noteStats.wordsDelta)}> ({formatDelta(noteStats.wordsDelta)})</span>}
      </div>
      <div className="reader-content" ref={contentRef}>
      </div>
    </div>
  );
};

export default MarkdownReader;
