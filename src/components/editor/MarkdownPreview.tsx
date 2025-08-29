import {useApp} from "@/context/AppContext.tsx";
import Markdoc, {Node, RenderableTreeNode} from '@markdoc/markdoc';
import React, {ReactNode, useLayoutEffect, useRef, useState} from "react";

// todo merge with MarkdownEditor measure and stuff for better code
export function MarkdownPreview() {
  const {content} = useApp();
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
    const height = docHeight-headerHeight-17; // 17 is margin and alike
    const width = containerRef.current?.offsetWidth ?? 0;
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
  }, []);


  useLayoutEffect(() => {
    const ast: Node = Markdoc.parse(content);
    const rtn: RenderableTreeNode = Markdoc.transform(ast);
    const reactNode: ReactNode = Markdoc.renderers.react(rtn, React);
    setRn(reactNode);
  }, [content]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {dims && dims.width > 0 && dims.height > 0 ? (
        <div style={{height: dims.height}} className="p-2 overflow-y-scroll">{rn}</div>
      ) : <div className="h-full w-full text-muted-foreground flex flex-col items-center justify-center">
        Something goes wrong with the editor.
        <a href="https://github.com/results-may-vary-org" target="_blank" rel="noopener noreferrer">Contact-us</a>
      </div>}
    </div>
  );
}
