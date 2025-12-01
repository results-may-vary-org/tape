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
  const editorRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // compartment allows extension to be dynamically added and removed
    const themeConfig = new Compartment();
    const langConfig = new Compartment();
    const wrapConfig = new Compartment();

    const editorState = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        wrapConfig.of(EditorView.lineWrapping),
        langConfig.of(markdown({ base: markdownLanguage, codeLanguages: languages })),
        themeConfig.of([catppuccinMocha]),
        // handle the value change
        EditorView.updateListener.of((viewUpdate) => {
          if (viewUpdate.docChanged) {
            const value = viewUpdate.state.doc.toString();
            onChange(value);
          }
        }),
      ],
    });

    const view = new EditorView({ state: editorState, parent: editorRef.current as Element });

    return () => {
      view.destroy()
    }
  }, [editorRef]);

  if (!filePath) {
    return (
      <div className="empty-editor">
        <p>Select a markdown file to start editing</p>
      </div>
    );
  }

  return (
    <div className="markdown-editor">
      <div
        ref={editorRef}
        style={{ height: "calc(100vh - (41px + 69px))", overflowY: "auto", maxWidth: "100%" }}
      ></div>
    </div>
  );
};

export default MarkdownEditor;
