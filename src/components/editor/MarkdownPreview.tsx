import {useApp} from "@/context/AppContext.tsx";
import Markdoc, {Node, RenderableTreeNode} from '@markdoc/markdoc';
import React, {JSX, ReactNode, useLayoutEffect, useRef, useState} from "react";
import {Prism} from "react-syntax-highlighter";
import {oneDark, oneLight} from "react-syntax-highlighter/dist/esm/styles/prism";
import {useTheme} from "@/context/theme-provider.tsx";
import '@/gh-mk-light.css';
import '@/gh-mk-dark.css';

// todo merge with MarkdownEditor measure and stuff for better code
export function MarkdownPreview({divider}: {divider: number}): JSX.Element {
  const {content, viewMode} = useApp();
  const {themeStrict} = useTheme();
  const [rn, setRn] = useState<ReactNode>(<div>Loading...</div>);
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

  function Fence({children, language}: {children: string | string[], language: string}) {
    return <Prism
      key={language}
      language={language}
      style={themeStrict === "light" ? oneLight : oneDark}
    >
      {children}
    </Prism>;
  }

  const fence = {
    render: 'Fence',
    attributes: {
      language: {
        type: String
      }
    }
  };

  useLayoutEffect(() => {
    console.log("render");
    const ast: Node = Markdoc.parse(content);
    const rtn: RenderableTreeNode = Markdoc.transform(ast, {nodes: {fence}});
    const reactNode: ReactNode = Markdoc.renderers.react(rtn, React, {components: {Fence}});
    setRn(reactNode);
  }, [content, themeStrict]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {dims && dims.width > 0 && dims.height > 0 ? (
        <div style={{height: dims.height}} className={`p-2 overflow-y-scroll gh-mk markdown-body-${themeStrict}`}>{rn}</div>
      ) : <div className="h-full w-full text-muted-foreground flex flex-col items-center justify-center">
        Something goes wrong with the editor.
        <a href="https://github.com/results-may-vary-org" target="_blank" rel="noopener noreferrer">Contact-us</a>
      </div>}
    </div>
  );
}
