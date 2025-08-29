import {useApp} from "@/context/AppContext.tsx";
import {Eye} from "lucide-react";
import {getHello} from "@/services/hello.tsx";
import Markdoc, {Node, RenderableTreeNode} from '@markdoc/markdoc';
import React, {ReactNode, useLayoutEffect, useState} from "react";

export function MarkdownPreview({loading}: {loading: boolean}) {
  const {content, selectedPath, selectedIsDir} = useApp();
  const [rn, setRn] = useState<ReactNode>(<div>Loading...</div>);

  useLayoutEffect(() => {
    console.log("useLayoutEffect preview");
    if (loading) {
      console.log("loading");
      const ast: Node = Markdoc.parse(content);
      const rtn: RenderableTreeNode = Markdoc.transform(ast);
      const reactNode: ReactNode = Markdoc.renderers.react(rtn, React);
      setRn(reactNode);
    }
  }, [loading, useApp(), useApp().content]);

  if (!selectedPath || selectedIsDir) {
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

  return rn;
}
