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

  // todo: try to make a wrapper
  function autoCompleteTag(endTag: string) {
    if (textareaRef && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);

      let startTag = "";

      switch (endTag) {
        case "}":
          startTag = "{";
          break;
        case "]":
          startTag = "[";
          break;
        case ")":
          startTag = "(";
          break;
      }

      // Insert the text at the cursor position
      textarea.value = text.substring(0, start) + endTag + text.substring(end);

      // Update cursor position
      textarea.selectionStart = textarea.selectionEnd = start + endTag.length;

      // Focus back on the textarea
      textarea.focus();

      handleChange(textarea.value);
    }
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
        placeholder="Write your markdown"
        onChange={(e) => handleChange(e.target.value)}
        style={{
          overflowY: "auto",
          height: "calc(100vh - (40px + 69px))", /*the two topbar, this is more quick to do it by hand than using ref*/
        }}
        radius="none"
        resize="none"
        onKeyUpCapture={(event) => {
          if (event.key === "{") autoCompleteTag("}");
          if (event.key === "[") autoCompleteTag("]");
          if (event.key === "(") autoCompleteTag(")");
        }}
      />
    </div>
  );
};

export default MarkdownEditor;
