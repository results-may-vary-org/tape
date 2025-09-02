import {useLayoutEffect, useRef, useState} from 'react';
import {useApp} from "@/context/AppContext.tsx";
import CodeMirror from '@uiw/react-codemirror';
import {markdown, markdownLanguage} from '@codemirror/lang-markdown';
import {languages} from '@codemirror/language-data';
import {githubDark, githubLight} from "@uiw/codemirror-theme-github";
import {EditorView, lineNumbers} from '@codemirror/view';
import {lineNumbersRelative} from '@uiw/codemirror-extensions-line-numbers-relative';
import {useDebouncedEffect} from "@/hooks/useDebouncedEffect.ts";
import {fsService} from "@/services/fs.ts";
import {toast} from "sonner";
import {useTheme} from "@/context/theme-provider.tsx";

export function MarkdownEditor({divider}: {divider: number}) {
  const {content, setContent, rootPath, selectedPath, selectedIsDir, showLineNumbers, relativeLineNumbers, viewMode} = useApp();
  const {theme} = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);

  /**
   * Measures and calculates the dimensions (width and height) for Codemirror based on the viewport size and other offsets.
   *
   * The function determines the available space by subtracting the height of the sidebar header and any defined margins
   * from the window's total height. It also retrieves the current width of a referenced container. If the new dimensions differ
   * from the previous ones, it updates the state with the new width and height.
   *
   * @return {void} This function does not return any value.
   */
  function measure(): void {
    const headerHeight = document.getElementById('sidebarHeader')?.offsetHeight ?? 0;
    const docHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0;
    let height = docHeight-headerHeight-17; // 17 is margin and alike
    const width = containerRef.current?.offsetWidth ?? 0;
    if (viewMode === "split-horizontal") height = (divider / 100) * height;
    setDims(prev => {
      if (!prev || prev.width !== width || prev.height !== height) {
        return { width, height };
      }
      return prev;
    });
  }

  /**
   * Measure sizes after the first paint and on another event (resize, ...)
   * and apply it to the CodeMirror instance.
   */
  useLayoutEffect(() => {
    // Initial measure after first paint
    const raf = requestAnimationFrame(measure);

    // React to window resize
    const onResize = () => measure();
    window.addEventListener('resize', onResize);

    // Observe header and container size changes
    const ro = new ResizeObserver(() => measure());
    const header = document.getElementById('sidebarHeader');
    if (header) ro.observe(header);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [divider, viewMode]);

  /**
   * Save the note to the file system after a delay.
   */
  useDebouncedEffect(() => {
    if (!rootPath || !selectedPath || selectedIsDir) return;
    fsService
      .writeNote(rootPath, selectedPath, content)
      .then(() => toast.success("note saved"))
      .catch((err) => toast.error(err.message));
  }, [content, selectedPath, selectedIsDir, rootPath], 250);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {dims && dims.width > 0 && dims.height > 0 ? (
        <CodeMirror
          height={`${dims.height}px`}
          value={content}
          onChange={(value) => setContent(value)}
          theme={theme === "light" ? githubLight : githubDark}
          extensions={[
            markdown({ base: markdownLanguage, codeLanguages: languages }),
            EditorView.lineWrapping,
            ...(showLineNumbers
              ? [relativeLineNumbers ? lineNumbersRelative : lineNumbers()]
              : []),
          ]}
          basicSetup={{ lineNumbers: false }}
        />
      ) : <div className="h-full w-full text-muted-foreground flex flex-col items-center justify-center">
        Something goes wrong with the editor.
        <a href="https://github.com/results-may-vary-org" target="_blank" rel="noopener noreferrer">Contact-us</a>
      </div>}
    </div>
  );
}
