import React, {useState, useRef, useLayoutEffect} from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "codemirror";
import {keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor,
  rectangularSelection, crosshairCursor,
  lineNumbers, highlightActiveLineGutter} from "@codemirror/view";
import {defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching,
  foldGutter, foldKeymap} from "@codemirror/language";
import {defaultKeymap, history, historyKeymap} from "@codemirror/commands";
import {searchKeymap, highlightSelectionMatches} from "@codemirror/search";
import {autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap} from "@codemirror/autocomplete";
import {lintKeymap} from "@codemirror/lint";
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import {useTheme} from "next-themes";
import {tapeLight} from "../codeThemes/ligh";
import {tapeDark} from "../codeThemes/dark";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  filePath: string | null;
  containerHeight: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = (props) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  const themeConfig = new Compartment();
  const langConfig = new Compartment();
  const wrapConfig = new Compartment();

  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? tapeLight : tapeDark;

  useLayoutEffect(() => {
    const editorState = EditorState.create({
      doc: props.content,
      extensions: [
        // lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        // foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap
        ]),
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
      console.log(theme);
      console.log(themeConfig)
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
      <div
        ref={editorRef}
        style={{ height: props.containerHeight, overflowY: "auto", maxWidth: "100%" }}
      ></div>
    </div>
  );
};

export default MarkdownEditor;
