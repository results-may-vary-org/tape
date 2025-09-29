import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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
    setLocalContent(content);
  }, [content]);

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
    }
    // Let browser handle undo/redo naturally - no need to intercept
  }, [onSave]);

  const noteStats = useMemo(() => {
    if (!filePath || !localContent) return {
      chars: 0, words: 0, lines: 0,
      originalChars: 0, originalWords: 0, originalLines: 0,
      charsDelta: 0, wordsDelta: 0, linesDelta: 0
    };

    const chars = localContent.length;
    const words = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
    const lines = localContent.split('\n').length;

    const originalChars = originalContent.length;
    const originalWords = originalContent.trim() ? originalContent.trim().split(/\s+/).length : 0;
    const originalLines = originalContent.split('\n').length;

    const charsDelta = chars - originalChars;
    const wordsDelta = words - originalWords;
    const linesDelta = lines - originalLines;

    return { chars, words, lines, originalChars, originalWords, originalLines, charsDelta, wordsDelta, linesDelta };
  }, [filePath, localContent, originalContent]);

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
        <span className={getStatClass(noteStats.chars !== noteStats.originalChars, noteStats.charsDelta)}>Characters: {noteStats.chars}</span>{hasUnsavedChanges && noteStats.charsDelta !== 0 && <span className={getDeltaClass(noteStats.charsDelta)}> ({formatDelta(noteStats.charsDelta)})</span>} <span className={getStatClass(noteStats.words !== noteStats.originalWords, noteStats.wordsDelta)}>Words: {noteStats.words}</span>{hasUnsavedChanges && noteStats.wordsDelta !== 0 && <span className={getDeltaClass(noteStats.wordsDelta)}> ({formatDelta(noteStats.wordsDelta)})</span>} <span className={getStatClass(noteStats.lines !== noteStats.originalLines, noteStats.linesDelta)}>Lines: {noteStats.lines}</span>{hasUnsavedChanges && noteStats.linesDelta !== 0 && <span className={getDeltaClass(noteStats.linesDelta)}> ({formatDelta(noteStats.linesDelta)})</span>}
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
