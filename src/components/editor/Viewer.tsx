import {useApp} from "@/context/AppContext.tsx";
import {MarkdownEditor} from "@/components/editor/MardownEditor.tsx";
import {getHello} from "@/services/hello.tsx";
import {Eye, FileText} from "lucide-react";
import {MarkdownPreview} from "@/components/editor/MarkdownPreview.tsx";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";

export function Viewer() {
  const {viewMode, selectedPath, selectedIsDir, content} = useApp();
  const isEmpty = !selectedPath || !content || selectedIsDir;

  function editIsEmpty() {
    return (
      <div className="h-full w-full text-muted-foreground flex flex-col items-center justify-center">
        <div>
          <i>{getHello()}</i>
        </div>
        <div className="flex gap-2 pt-2">
          <FileText className="size-5" />
          <span>Select a note to start editing.</span>
        </div>
      </div>
    );
  }

  function previewIsEmpty() {
    return (
      <div className="h-full w-full text-muted-foreground flex flex-col items-center justify-center">
        <div><i>{getHello()}</i></div>
        <div className="flex gap-2 pt-2">
          <Eye className="size-5" />
          <span>Select a note to read it.</span>
        </div>
      </div>
    );
  }

  if (viewMode === "preview") return isEmpty ? previewIsEmpty() : <MarkdownPreview/>;

  if (viewMode === "split-vertical" || viewMode === "split-horizontal") {
    return (
      // todo: dono why but the vertical do horizontal and vice versa
      <ResizablePanelGroup direction={viewMode !== "split-vertical" ? "vertical" : "horizontal"}>
        <ResizablePanel>
          {isEmpty ? editIsEmpty() : <MarkdownEditor/>}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          {isEmpty ? previewIsEmpty() : <MarkdownPreview/>}
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  return isEmpty ? editIsEmpty() : <MarkdownEditor/>;
}
