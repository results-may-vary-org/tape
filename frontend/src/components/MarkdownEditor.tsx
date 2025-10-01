import React, {useState, useRef, useLayoutEffect} from 'react';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  filePath: string | null;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({content, onChange, filePath}) => {
  const [localContent, setLocalContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    setLocalContent(content);
    if (textareaRef.current) {
      textareaRef.current.focus();
      // place the cursor at the end
      textareaRef.current.setSelectionRange(textareaRef.current.value.length,textareaRef.current.value.length);
    }
  }, [filePath]);

  function handleChange(data: string) {
    setLocalContent(data);
    onChange(data);
  }

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
        ref={textareaRef}
        value={localContent}
        onChange={(e) => handleChange(e.target.value)}
        className="editor-textarea"
        placeholder="Start writing your markdown..."
      />
    </div>
  );
};

export default MarkdownEditor;
