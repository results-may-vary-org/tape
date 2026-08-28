import React, {useState, useRef, useLayoutEffect} from "react";
import { useScrollSync } from "../services/useScrollSync";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "codemirror";
import {keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, crosshairCursor, highlightActiveLineGutter} from "@codemirror/view";
import {defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, foldKeymap} from "@codemirror/language";
import {defaultKeymap, history, historyKeymap} from "@codemirror/commands";
import {searchKeymap, highlightSelectionMatches} from "@codemirror/search";
import {autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap} from "@codemirror/autocomplete";
import {lintKeymap} from "@codemirror/lint";
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import {useTheme} from "next-themes";
import {tapeLight} from "../codeThemes/ligh";
import {tapeDark} from "../codeThemes/dark";
import { vim, getCM } from "@replit/codemirror-vim";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  filePath: string | null;
  vimEnabled?: boolean;
  onVimModeChange?: (mode: string | null) => void;
  scrollRatio?: number;
  onScrollChange?: (ratio: number) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = (props) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollDomRef = useRef<HTMLElement | null>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  useScrollSync(scrollDomRef, props.scrollRatio, props.onScrollChange);

  const themeConfig = new Compartment();
  const langConfig = new Compartment();
  const wrapConfig = new Compartment();

  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? tapeLight : tapeDark;

  useLayoutEffect(() => {
    const extensions: Array<any> = [
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
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
      EditorView.updateListener.of((viewUpdate) => {
        if (viewUpdate.docChanged) {
          const value = viewUpdate.state.doc.toString();
          props.onChange(value);
        }
      }),
    ];

    if (props.vimEnabled) {
      extensions.push(vim());
    }

    const editorState = EditorState.create({
      doc: props.content,
      extensions,
    });

    const editorView = new EditorView({ state: editorState, parent: editorRef.current as Element });
    scrollDomRef.current = editorView.scrollDOM;
    setEditorView(editorView);

    let lastMode: string | null = null;
    const reportMode = () => {
      const cm = getCM(editorView);
      const mode = cm?.state.vim?.mode ?? null;
      if (mode !== lastMode) {
        lastMode = mode;
        props.onVimModeChange?.(mode);
      }
    };

    let offModeChange: (() => void) | null = null;
    if (props.vimEnabled) {
      const cm = getCM(editorView);
      if (cm) {
        cm.on("vim-mode-change", reportMode);
        offModeChange = () => cm.off("vim-mode-change", reportMode);
      }
      reportMode();
    } else {
      props.onVimModeChange?.(null);
    }

    return () => {
      offModeChange?.();
      scrollDomRef.current = null;
      editorView.destroy();
      setEditorView(null);
    }
  }, [props.filePath, props.vimEnabled]);

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
      <div
        ref={editorRef}
        style={{ flex: 1, overflowY: "auto", maxWidth: "100%", minHeight: 0 }}
      ></div>
    </div>
  );
};

export default MarkdownEditor;
