import React, {useState, useRef, useLayoutEffect} from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { ThemeMode } from '../App';

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
      <CodeEditor
        value={localContent}
        language="md"
        placeholder="Please enter JS code."
        onChange={(e) => handleChange(e.target.value)}
        padding={15}
        style={{
          overflowY: "auto",
          height: "calc(100vh - (40px + 111px))",
        }}
      />
    </div>
  );
};

export default MarkdownEditor;
