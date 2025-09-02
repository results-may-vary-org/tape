import {useApp} from "@/context/AppContext.tsx";
import {MarkdownEditor} from "@/components/editor/MardownEditor.tsx";
import {getHello} from "@/services/hello.tsx";
import {Eye, FileText} from "lucide-react";
import {MarkdownPreview} from "@/components/editor/MarkdownPreview.tsx";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {useState} from "react";
import {MkProps} from "@/lib/types.ts";

export function Viewer() {
  const {viewMode, selectedPath, selectedIsDir} = useApp();
  const isEmpty = !selectedPath || selectedIsDir;
  const [panSize, setPanSize] = useState<MkProps>({panTop: 0, panBottom: 0});

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

  function handleResize(size: number) {
    // we calculate the bottom size via the top size for simplicity
    setPanSize({panTop: size, panBottom: 100 - size});
  }

  if (viewMode === "preview") return isEmpty ? previewIsEmpty() : <MarkdownPreview divider={0}/>;

  if (viewMode === "split-vertical" || viewMode === "split-horizontal") {
    return (
      // todo: dono why but the vertical do horizontal and vice versa
      <ResizablePanelGroup direction={viewMode !== "split-vertical" ? "vertical" : "horizontal"}>
        <ResizablePanel onResize={(size) => handleResize(size)}>
          {isEmpty ? editIsEmpty() : <MarkdownEditor divider={panSize.panTop}/>}
        </ResizablePanel>
        <ResizableHandle withHandle/>
        <ResizablePanel>
          {isEmpty ? previewIsEmpty() : <MarkdownPreview divider={panSize.panBottom}/>}
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  return isEmpty ? editIsEmpty() : <MarkdownEditor divider={0}/>;
}
