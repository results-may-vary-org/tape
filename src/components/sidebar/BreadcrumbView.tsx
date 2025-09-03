import {Fragment} from "react";
import {Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator} from "@/components/ui/breadcrumb.tsx";
import {useApp} from "@/context/AppContext.tsx";

export function BreadcrumbView() {
  const { rootPath, selectedPath } = useApp();

  /* for windows for the later split */
  const normalizedRoot = (rootPath || "").replace(/\\/g, "/");
  const normalizedSel = (selectedPath || "").replace(/\\/g, "/");

  // we don't display the main folder (rootName) in the breadcrumb, only relative parts
  const cleanedPath = normalizedSel.slice(normalizedRoot.length);

  const breadcrumbParts = cleanedPath ? cleanedPath.split("/").filter(Boolean) : ["no selection"];

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        {breadcrumbParts.map((value, index) => {
          // keep the first and two lasts part of the path
          const isPartToShow = index === 0 || index >= breadcrumbParts.length-2;
          // we show ellipsis just one time, after the first part if needed
          const isEllipsisToShow = !isPartToShow && index === 1;
          const isLast = index === breadcrumbParts.length - 1;
          return (
            <Fragment key={value+index}>
              {isPartToShow && <BreadcrumbItem><BreadcrumbPage className={isLast ? "truncate max-w-30" : ""}>{value}</BreadcrumbPage></BreadcrumbItem>}
              {isEllipsisToShow && <BreadcrumbItem><BreadcrumbEllipsis/></BreadcrumbItem>}
              {isEllipsisToShow && <BreadcrumbSeparator/>}
              {isPartToShow && !isLast && <BreadcrumbSeparator/>}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
