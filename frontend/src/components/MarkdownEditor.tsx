import React, { useState, useEffect, useCallback, useRef } from 'react';
import Stats from "./Stats";

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
  }, [onSave]);

  if (!filePath) {
    return (
      <div className="empty-editor">
        <p>Select a markdown file to start editing</p>
      </div>
    );
  }

  return (
    <div className="markdown-editor">
      <Stats
        originalContent={originalContent}
        currentContent={localContent}
        filePath={filePath}
      />
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
