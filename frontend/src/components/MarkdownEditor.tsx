import React, { useState, useEffect, useCallback } from 'react';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  filePath: string | null;
  hasUnsavedChanges: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  onSave,
  filePath,
  hasUnsavedChanges
}) => {
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

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
      <textarea
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
