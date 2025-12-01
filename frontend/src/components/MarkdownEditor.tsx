import React, {useState, useRef, useLayoutEffect} from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import {catppuccinLatte, catppuccinMocha} from "@catppuccin/codemirror";
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import {useTheme} from "next-themes";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  filePath: string | null;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = (props) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  const themeConfig = new Compartment();
  const langConfig = new Compartment();
  const wrapConfig = new Compartment();

  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? catppuccinLatte : catppuccinMocha;

  useLayoutEffect(() => {
    const editorState = EditorState.create({
      doc: props.content,
      extensions: [
        basicSetup,
        wrapConfig.of(EditorView.lineWrapping),
        langConfig.of(markdown({ base: markdownLanguage, codeLanguages: languages })),
        themeConfig.of([theme]),
        // handle the value change
        EditorView.updateListener.of((viewUpdate) => {
          if (viewUpdate.docChanged) {
            const value = viewUpdate.state.doc.toString();
            props.onChange(value);
          }
        }),
      ],
    });

    const editorView = new EditorView({ state: editorState, parent: editorRef.current as Element });
    setEditorView(editorView);

    return () => {
      editorView.destroy();
      setEditorView(null);
    }
  }, [props.filePath]);

  useLayoutEffect(() => {
    if (editorView) {
      editorView.dispatch({
        effects: themeConfig.reconfigure([theme]),
      });
    }
  }, [resolvedTheme, editorView]);

  if (!props.filePath) {
    return (
      <div className="empty-editor">
        <p>Select a markdown file to start editing</p>
      </div>
    );
  }

  return (
    <div className="markdown-editor">
      {/* maybe one day we can calculate the height automatically,
      but for now this is the fatest since none of the elements change height */}
      <div
        ref={editorRef}
        style={{ height: "calc(100vh - (41px + 69px))", overflowY: "auto", maxWidth: "100%" }}
      ></div>
    </div>
  );
};

export default MarkdownEditor;
