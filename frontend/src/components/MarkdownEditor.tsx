import React, {useRef, useLayoutEffect} from "react";
import { useScrollSync } from "../services/useScrollSync";
import { Compartment, EditorState, StateField } from "@codemirror/state";
import { EditorView } from "codemirror";
import {keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, crosshairCursor, highlightActiveLineGutter, lineNumbers, gutter, GutterMarker} from "@codemirror/view";
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
import { vim, Vim, getCM } from "@replit/codemirror-vim";
import type { LineNumberMode } from "../types/types";

class LineNumberMarker extends GutterMarker {
  constructor(readonly count: number) { super(); }
  eq(other: LineNumberMarker) { return this.count === other.count; }
  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.textContent = String(this.count);
    return span;
  }
}

const activeLineField = StateField.define<number>({
  create(state) { return state.doc.lineAt(state.selection.main.head).number; },
  update(value, tr) {
    const newValue = tr.state.doc.lineAt(tr.state.selection.main.head).number;
    return newValue === value ? value : newValue;
  },
});

const relativeLineNumbers = () => [
  activeLineField,
  gutter({
    class: "cm-relative-line-numbers",
    lineMarker(view, line) {
      const active = view.state.field(activeLineField);
      const lineNumber = view.state.doc.lineAt(line.from).number;
      return new LineNumberMarker(Math.abs(lineNumber - active));
    },
    lineMarkerChange: () => true,
    initialSpacer() {
      return new LineNumberMarker(0);
    },
  }),
];

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  filePath: string | null;
  vimEnabled?: boolean;
  onVimModeChange?: (mode: string | null) => void;
  onSave?: () => void;
  lineNumberMode?: LineNumberMode;
  scrollRatio?: number;
  onScrollChange?: (ratio: number) => void;
}

function getLineNumberExtensions(mode: LineNumberMode | undefined): Array<any> {
  switch (mode) {
    case "relative":
      return [...relativeLineNumbers()];
    case "normal":
      return [lineNumbers()];
    default:
      return [];
  }
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = (props) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollDomRef = useRef<HTMLElement | null>(null);
  const onSaveRef = useRef(props.onSave);
  onSaveRef.current = props.onSave;
  useScrollSync(scrollDomRef, props.scrollRatio, props.onScrollChange);

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
      theme,
      ...getLineNumberExtensions(props.lineNumberMode),
      EditorView.updateListener.of((viewUpdate) => {
        if (viewUpdate.docChanged) {
          const value = viewUpdate.state.doc.toString();
          props.onChange(value);
        }
      }),
    ];

    if (props.vimEnabled) {
      extensions.push(vim());
      Vim.defineEx("write", "w", () => {
        onSaveRef.current?.();
      });
    }

    const editorState = EditorState.create({
      doc: props.content,
      extensions,
    });

    const editorView = new EditorView({ state: editorState, parent: editorRef.current as Element });
    scrollDomRef.current = editorView.scrollDOM;

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
    }
  }, [props.filePath, props.vimEnabled, props.lineNumberMode, resolvedTheme]);

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
