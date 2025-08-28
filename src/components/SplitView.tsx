import { useApp } from "@/context/AppContext";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";

export function SplitView() {
  const { viewMode } = useApp();
  if (viewMode === "edit") return <MarkdownEditor/>;
  if (viewMode === "preview") return <MarkdownPreview/>;

  return (
    <ResizablePanelGroup direction={viewMode === "split-horizontal" ? "vertical" : "horizontal"}>
      <ResizablePanel defaultSize={50} minSize={20}>
        <ScrollArea>
          <MarkdownEditor/>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle/>

      <ResizablePanel defaultSize={50} minSize={20}>
        <ScrollArea>
          <div className="w-full">
            <MarkdownPreview/>
          </div>
        </ScrollArea>
      </ResizablePanel>

    </ResizablePanelGroup>
  );
}
