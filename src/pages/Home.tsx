import {Viewer} from "@/components/editor/Viewer.tsx";
import {useApp} from "@/context/AppContext";
import {Button} from "@/components/ui/button";
import {FolderOpen} from "lucide-react";
import {AppSidebar} from "@/components/sidebar/app-sidebar";
import {Separator} from "@/components/ui/separator";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar";
import {ViewSelector} from "@/components/editor/ViewSelector";
import {BreadcrumbView} from "@/components/sidebar/BreadcrumbView.tsx";
import {getHello} from "@/services/hello.tsx";

export default function Home() {
  const {rootPath, pickRoot} = useApp();

  if (!rootPath) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="flex flex-col gap-4 items-center">
          <div className="text-4xl">{getHello()}</div>
          <div className="text-xl">Choose a root folder for your notes</div>
          <Button onClick={pickRoot}>
            <FolderOpen />
            Choose a folder
          </Button>
        </div>
      </div>
    );}

  return (
    <SidebarProvider>
      <AppSidebar/>
      <SidebarInset>
        <div id="sidebarHeader">
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <BreadcrumbView/>
              <Separator orientation="vertical" className="ml-2 mr-2 data-[orientation=vertical]:h-4" />
              <ViewSelector/>
            </div>
          </header>
          <Separator/>
        </div>
        <Viewer/>
      </SidebarInset>
    </SidebarProvider>
  );
}
