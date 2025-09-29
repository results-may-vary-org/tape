import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDiffStats } from '../hooks/useDiffStats';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  filePath: string | null;
  hasUnsavedChanges: boolean;
  originalContent: string;
  autoFocus?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  onSave,
  filePath,
  hasUnsavedChanges,
  originalContent,
  autoFocus = true
}) => {
  const [localContent, setLocalContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Only update local content if it's different from what the user is typing
    // This preserves the browser's native undo stack
    if (content !== localContent) {
      setLocalContent(content);
    }
  }, [content, localContent]);

  // Auto-focus the textarea when editor becomes visible
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      // Use a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, filePath]); // Re-focus when file changes or autoFocus changes

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onChange(newContent);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      onSave();
      return;
    }

    // Let all other shortcuts (including Ctrl+Z, Ctrl+Y, etc.) pass through naturally
    // The textarea will handle undo/redo by default
  }, [onSave]);

  // Use the new Git-powered diff stats
  const { diffResult } = useDiffStats(originalContent, localContent);

  const noteStats = useMemo(() => {
    if (!filePath || !localContent) return {
      chars: 0, words: 0, lines: 0,
      charsDelta: 0, wordsDelta: 0, linesDelta: 0,
      linesAdded: 0, linesRemoved: 0, linesModified: 0
    };

    if (!diffResult) {
      // Fallback to basic calculations if diff not ready
      const chars = localContent.length;
      const words = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
      const lines = localContent.split('\n').length;

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
  }, [filePath, localContent, diffResult]);

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

  if (!filePath) {
    return (
      <div className="empty-editor">
        <p>Select a markdown file to start editing</p>
      </div>
    );
  }

  return (
    <div className="markdown-editor">
      <div className="note-status-bar vt32">
        <span className={getStatClass(noteStats.linesDelta !== 0, noteStats.linesDelta)}>Lines: {noteStats.lines}</span><span className="stat-delta stat-delta-positive">{formatGitLineDelta()}</span> <span className={getStatClass(noteStats.charsDelta !== 0, noteStats.charsDelta)}>Characters: {noteStats.chars}</span>{hasUnsavedChanges && noteStats.charsDelta !== 0 && <span className={getDeltaClass(noteStats.charsDelta)}> ({formatDelta(noteStats.charsDelta)})</span>} <span className={getStatClass(noteStats.wordsDelta !== 0, noteStats.wordsDelta)}>Words: {noteStats.words}</span>{hasUnsavedChanges && noteStats.wordsDelta !== 0 && <span className={getDeltaClass(noteStats.wordsDelta)}> ({formatDelta(noteStats.wordsDelta)})</span>}
      </div>
      <textarea
        ref={textareaRef}
        value={localContent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="editor-textarea"
        placeholder="Start writing your markdown..."
        spellCheck="false"
      />
    </div>
  );
};

export default MarkdownEditor;
