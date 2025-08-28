import { useApp } from "@/context/AppContext";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {useEffect, useState} from "react";

export function SplitView() {
  const { viewMode } = useApp();
  const [ h, setH ] = useState<number>(0);

  useEffect(() => {
    const updateHeights = () => {
      const sh = document.getElementById("sidebarHeader")?.offsetHeight || 0;
      const si = document.getElementById("sidebarInset")?.offsetHeight || 0;
      // 17 = remaining padding and 1 px for border
      setH(si-sh-17);
    };
    updateHeights();
    window.addEventListener("resize", updateHeights);
    return () => window.removeEventListener("resize", updateHeights);
  }, [viewMode]);

  if (viewMode === "edit") return (
    <div className="p-2">
      <MarkdownEditor height={h}/>
    </div>
  );

  if (viewMode === "preview") return (
    <div className="p-2" style={{height: h}}>
      <MarkdownPreview/>
    </div>
  );

  return (
    <ResizablePanelGroup direction={viewMode === "split-horizontal" ? "vertical" : "horizontal"} style={{height: h}}>
      <ResizablePanel defaultSize={50} minSize={20} className="p-2">
        <MarkdownEditor/>
      </ResizablePanel>
      <ResizableHandle withHandle/>
      <ResizablePanel defaultSize={50} minSize={20} className="p-2 overflow-y-scroll">
        <MarkdownPreview/>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
