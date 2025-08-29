import {useApp} from "@/context/AppContext.tsx";
import {MarkdownEditor} from "@/components/editor/MarkdownEditor.tsx";
import {MarkdownPreview} from "@/components/editor/MarkdownPreview.tsx";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {useEffect, useLayoutEffect, useRef, useState} from "react";

export function Viewer() {
  const {viewMode, content} = useApp();
  const mkRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  function getHeight() {
    setLoading(true);
    const headerHeight = document.getElementById("sidebarHeader")?.offsetHeight ?? 0;
    const totalHeight = document.body.offsetHeight;
    if (mkRef && mkRef.current) mkRef.current.style.height = `${totalHeight-headerHeight}px`;
    console.log({headerHeight, totalHeight, "t": totalHeight-headerHeight})
    setLoading(false);
  }

  useLayoutEffect(() => {
    console.log("useLayoutEffect viewer");
    document.addEventListener("resize", () => getHeight())
    return () => document.removeEventListener("resize", () => getHeight())
  }, []);

  useEffect(() => {
    console.log("viewMode or content changed", viewMode, content.length);
    getHeight();
  }, [viewMode, content]);

  useEffect(() => {
    console.log(";", loading);
  }, [loading])

  function generateMkPreview() {
    return (
      <div ref={mkRef} className="p-2" style={{background: "green"}}>
        <MarkdownPreview loading={loading}/>
      </div>
    )
  }

  if (viewMode === "preview") return generateMkPreview();
  else if (viewMode.startsWith("split")) {
    return (
      <ResizablePanelGroup direction={viewMode === "split-horizontal" ? "vertical" : "horizontal"}>
        <ResizablePanel defaultSize={50} minSize={20}>
          <MarkdownEditor/>
        </ResizablePanel>
        <ResizableHandle withHandle/>
        <ResizablePanel defaultSize={50} minSize={20}>
          {generateMkPreview()}
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }
  return <MarkdownEditor/>
}
