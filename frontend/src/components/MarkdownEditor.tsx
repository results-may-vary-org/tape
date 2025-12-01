import React, {useState, useRef, useLayoutEffect} from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import {catppuccinMocha} from "@catppuccin/codemirror";
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  filePath: string | null;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({content, onChange, filePath}) => {
  const [localContent, setLocalContent] = useState(content);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorParentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {

    if (editorRef && editorParentRef && editorRef.current && editorParentRef.current) {
      editorRef.current.style.width = editorParentRef.current?.offsetWidth + "px";
    }

    // compartment allows extension to be dynamically added and removed
    const themeConfig = new Compartment();
    const langConfig = new Compartment();
    const wrapConfig = new Compartment();

    const editorState = EditorState.create({
      doc: localContent,
      extensions: [
        basicSetup,
        wrapConfig.of(EditorView.lineWrapping),
        langConfig.of(markdown({ base: markdownLanguage, codeLanguages: languages })),
        themeConfig.of([catppuccinMocha]),
      ],
    });

    const view = new EditorView({ state: editorState, parent: editorRef.current as Element });

    return () => {
      view.destroy()
    }
  }, [localContent, editorRef, editorParentRef]);

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
    <div className="markdown-editor" ref={editorParentRef}>
      <div
        ref={editorRef}
        style={{ height: "calc(100vh - (2rem + 69px))", overflowY: "auto", maxWidth: "100%" }}
      ></div>
    </div>
  );
};

export default MarkdownEditor;
