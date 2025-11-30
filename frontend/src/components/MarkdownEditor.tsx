import { TextArea } from '@radix-ui/themes';
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
      <TextArea
        ref={textareaRef}
        value={localContent}
        placeholder="Write something."
        onChange={(e) => handleChange(e.target.value)}
        style={{
          overflowY: "auto",
          height: "calc(100vh - (40px + 69px))"
        }}
        radius="none"
      />
    </div>
  );
};

export default MarkdownEditor;
