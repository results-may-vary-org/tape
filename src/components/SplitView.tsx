import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useApp } from "@/context/AppContext";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { MarkdownPreview } from "@/components/MarkdownPreview";

export function SplitView() {
  const { viewMode } = useApp();

  if (viewMode === "edit") return <MarkdownEditor />;
  if (viewMode === "preview") return <MarkdownPreview />;
  if (viewMode === "stack") {
    return (
      <div className="h-full w-full overflow-hidden flex flex-col">
        <div className="flex-1 min-h-[40%] border-b overflow-hidden"><MarkdownEditor /></div>
        <div className="flex-1 overflow-auto"><MarkdownPreview /></div>
      </div>
    );
  }

  const isHorizontal = viewMode === "split-horizontal";

  return (
    <PanelGroup direction={isHorizontal ? "vertical" : "horizontal"} className="h-full w-full">
      <Panel defaultSize={50} minSize={20} className="overflow-hidden">
        <MarkdownEditor />
      </Panel>
      <PanelResizeHandle className="bg-border data-[resize-handle-state=drag]:bg-primary/40 flex-shrink-0" />
      <Panel defaultSize={50} minSize={20} className="overflow-hidden">
        <MarkdownPreview />
      </Panel>
    </PanelGroup>
  );
}
