import React, { useRef, useLayoutEffect } from "react";
import { Compartment, EditorState, StateField } from "@codemirror/state";
import { EditorView } from "codemirror";
import { keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, crosshairCursor, highlightActiveLineGutter, lineNumbers, gutter, GutterMarker } from "@codemirror/view";
import { defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, foldKeymap, syntaxTree } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { linter, lintGutter, lintKeymap, type Diagnostic } from "@codemirror/lint";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import type { SyntaxNode } from "@lezer/common";
import { useTheme } from "next-themes";
import { tapeLight } from "../codeThemes/ligh";
import { tapeDark } from "../codeThemes/dark";
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
    if (!tr.selection) return value;
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

interface ConfigEditorProps {
  content: string;
  onChange: (content: string) => void;
  vimMode: boolean;
  lineNumberMode: LineNumberMode;
  initialContent?: string;
  onValidation?: (counts: { errors: number; warnings: number }) => void;
}

function getLineNumberExtensions(mode: LineNumberMode): Array<any> {
  switch (mode) {
    case "relative":
      return [...relativeLineNumbers()];
    case "normal":
      return [lineNumbers()];
    default:
      return [];
  }
}

interface KnownKeySpec {
  type: string; // lezer node name for the value: String | boolean | Array
  enum?: string[];
}

const UI_THEME_IDS = [
  "default",
  "catppuccin-mocha",
  "catppuccin-macchiato",
  "catppuccin-frappe",
  "catppuccin-latte",
  "rose-pine",
  "rose-pine-moon",
  "rose-pine-dawn",
  "tokyo-night",
  "tokyo-night-storm",
  "tokyo-night-light",
];

const KNOWN_KEYS: Record<string, KnownKeySpec> = {
  lastOpenedFolder: { type: "String" },
  lastOpenedFile: { type: "String" },
  viewMode: { type: "String", enum: ["editor", "reader"] },
  theme: { type: "String", enum: ["system", "light", "dark"] },
  uiTheme: { type: "String", enum: UI_THEME_IDS },
  lineNumberMode: { type: "String", enum: ["none", "normal", "relative"] },
  privacyMode: { type: "boolean" },
  showFileMTime: { type: "boolean" },
  vimMode: { type: "boolean" },
  expandedFolders: { type: "Array" },
  check: { type: "String" },
  nonceCheck: { type: "String" },
};

const PROTECTED_KEYS = ["privacyMode", "check", "nonceCheck"];

// returns the value node for a Property node, or null
function propertyValue(node: SyntaxNode): SyntaxNode | null {
  for (let c = node.firstChild; c; c = c.nextSibling) {
    if (c.name !== "PropertyName" && c.name !== ":") return c;
  }
  return null;
}

function walk(node: SyntaxNode, visit: (n: SyntaxNode) => void) {
  visit(node);
  for (let c = node.firstChild; c; c = c.nextSibling) walk(c, visit);
}

function unquote(text: string): string | null {
  const t = text.trim();
  if (t.length >= 2 && t[0] === '"' && t[t.length - 1] === '"') {
    try {
      return JSON.parse(t);
    } catch {
      return t;
    }
  }
  return null;
}

function valueKind(node: SyntaxNode): string {
  if (node.name === "True" || node.name === "False") return "boolean";
  if (node.name === "Null") return "null";
  return node.name;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({ content, onChange, vimMode, lineNumberMode, initialContent, onValidation }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onValidationRef = useRef(onValidation);
  onValidationRef.current = onValidation;
  const lastCountsRef = useRef<{ errors: number; warnings: number }>({ errors: -1, warnings: -1 });

  // capture which protected keys were present when the editor first mounted,
  // so we can warn if any of them gets removed/renamed
  const initialProtectedRef = useRef<Set<string>>(new Set());
  if (initialContent && initialProtectedRef.current.size === 0) {
    try {
      const parsed = JSON.parse(initialContent);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const k of PROTECTED_KEYS) {
          if (k in parsed) initialProtectedRef.current.add(k);
        }
      }
    } catch {
      // ignore unparseable initial content
    }
  }

  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? tapeLight : tapeDark;

  useLayoutEffect(() => {
    const langConfig = new Compartment();

    const validate = (view: EditorView): Diagnostic[] => {
      const doc = view.state.doc.toString();
      const diagnostics: Diagnostic[] = [];
      const currentKeys = new Set<string>();
      let brokenStructure = false;

      const tree = syntaxTree(view.state);
      walk(tree.topNode, (node) => {
        if (node.name !== "Property") return;
        let nameNode: SyntaxNode | null = null;
        for (let c = node.firstChild; c; c = c.nextSibling) {
          if (c.name === "PropertyName") { nameNode = c; break; }
        }
        if (!nameNode) return;
        const key = unquote(doc.slice(nameNode.from, nameNode.to));
        if (key === null) return;
        currentKeys.add(key);

        const spec = KNOWN_KEYS[key];
        if (!spec) {
          diagnostics.push({
            from: nameNode.from,
            to: nameNode.to,
            severity: "warning",
            message: `Unknown key "${key}". Tape doesn't use this key and it will be ignored.`,
            source: "tape-config",
          });
          return;
        }

        const valueNode = propertyValue(node);
        if (!valueNode) return;
        const vkind = valueKind(valueNode);
        if (vkind === "⚠" || vkind === "null" || vkind === "error") {
          brokenStructure = true;
          return;
        }

        if (vkind !== spec.type) {
          diagnostics.push({
            from: valueNode.from,
            to: valueNode.to,
            severity: "error",
            message: `"${key}" must be a ${spec.type === "boolean" ? "boolean" : spec.type === "Array" ? "list" : "string"}.`,
            source: "tape-config",
          });
          return;
        }

        if (spec.enum && vkind === "String") {
          const val = unquote(doc.slice(valueNode.from, valueNode.to));
          if (val !== null && !spec.enum.includes(val)) {
            diagnostics.push({
              from: valueNode.from,
              to: valueNode.to,
              severity: "error",
              message: `"${key}" must be one of: ${spec.enum.join(", ")}.`,
              source: "tape-config",
            });
          }
        }
      });

      // warn when a protected key that existed on load has been removed/renamed
      if (!brokenStructure && initialProtectedRef.current.size > 0) {
        for (const pk of initialProtectedRef.current) {
          if (!currentKeys.has(pk)) {
            diagnostics.push({
              from: 0,
              to: 0,
              severity: "error",
              message: `Protected key "${pk}" was removed or renamed. This can lock you out of your encrypted vault.`,
              source: "tape-config",
            });
          }
        }
      }

      // report counts to the parent (only when they change)
      const errors = diagnostics.filter((d) => d.severity === "error").length;
      const warnings = diagnostics.filter((d) => d.severity === "warning").length;
      const last = lastCountsRef.current;
      if (last.errors !== errors || last.warnings !== warnings) {
        last.errors = errors;
        last.warnings = warnings;
        onValidationRef.current?.({ errors, warnings });
      }

      return diagnostics;
    };

    const extensions: Array<any> = [
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      crosshairCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
      ]),
      langConfig.of(json()),
      theme,
      ...getLineNumberExtensions(lineNumberMode),
      lintGutter(),
      linter(validate, { delay: 300 }),
      linter(jsonParseLinter()),
      EditorView.updateListener.of((viewUpdate) => {
        if (viewUpdate.docChanged) {
          onChangeRef.current(viewUpdate.state.doc.toString());
        }
      }),
    ];

    if (vimMode) {
      extensions.push(vim());
      Vim.defineEx("write", "w", () => {});
    }

    const editorState = EditorState.create({
      doc: content,
      extensions,
    });

    const editorView = new EditorView({ state: editorState, parent: editorRef.current as Element });

    return () => {
      editorView.destroy();
    };
  }, [vimMode, lineNumberMode, resolvedTheme]);

  return (
    <div className="markdown-editor">
      <div
        ref={editorRef}
        style={{ flex: 1, overflowY: "auto", maxWidth: "100%", minHeight: 0 }}
      ></div>
    </div>
  );
};

export default ConfigEditor;