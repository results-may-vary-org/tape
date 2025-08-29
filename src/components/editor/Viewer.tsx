import {useApp} from "@/context/AppContext.tsx";
import {MarkdownEditor} from "@/components/editor/MardownEditor.tsx";
import {getHello} from "@/services/hello.tsx";
import {Eye, FileText} from "lucide-react";

export function Viewer() {
  const {viewMode, selectedPath, selectedIsDir} = useApp();

  // if no content
  if (!selectedPath || selectedIsDir) {
    if (viewMode === "edit") {
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
    if (viewMode === "preview") {
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

  }

  if (viewMode === "preview") {

  }

  if (viewMode === "split-vertical") {}

  if (viewMode === "split-horizontal") {}

  return <MarkdownEditor/>;
}
