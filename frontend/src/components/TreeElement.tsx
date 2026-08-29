import React from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  CassetteTape,
  PackageOpen,
  Package,
  ShieldCheck
} from "lucide-react";

export interface TreeItem {
  name: string;
  path: string;
  isDir: boolean;
  modTime?: string;
  children?: TreeItem[];
}

interface TreeElementProps {
  item: TreeItem;
  isExpanded: boolean;
  isSelected: boolean;
  isRootFolder?: boolean;
  isVaultSecured: boolean;
  showFileMTime: boolean;
  indent: number;
  useAltIcons: boolean;
  onClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

// IMPORTANT: TreeElement is rendered as the DIRECT CHILD of Radix's ContextMenu.Trigger.
// Radix clones that child and injects its own DOM props onto it: onContextMenu,
// onPointerDown, onPointerMove/Up/Cancel, data-state and a composed ref. This is what makes
// the context menu open on right-click AND makes the node reachable via Tab/Shift+Tab.
// Therefore this component MUST:
//   1. be a React.forwardRef component, so the injected ref composes correctly, AND
//   2. spread `...rest` onto the focusable div so all injected props are forwarded.
// If the extra props are dropped (e.g. by destructuring only a fixed set), the node
// loses its context-menu trigger wiring and Tab/Shift+Tab selection breaks.
// Keep `tabIndex={0}` on the inner div: it is what makes each node focusable so that
// pressing Tab/Shift+Tab moves selection between the file-tree items (native behavior).
const TreeElement = React.forwardRef<HTMLDivElement, TreeElementProps>(
  ({ item, isExpanded, isSelected, isRootFolder = false, isVaultSecured, showFileMTime, indent, useAltIcons, onClick, onKeyDown, ...rest }, ref) => {
    const displayName = (isVaultSecured && !item.isDir && item.name.endsWith(".mde"))
      ? item.name.slice(0, -4)
      : item.name;

    return (
      <div
        ref={ref}
        onClick={onClick}
        onKeyDown={onKeyDown}
        {...rest}
        className={`file-tree-item ${isSelected ? "selected" : ""}`}
        style={{ paddingLeft: `${indent}px` }}
        tabIndex={0}
        role={item.isDir ? "treeitem" : "button"}
        aria-expanded={item.isDir ? isExpanded : undefined}
        aria-selected={isSelected}
      >
        <span className="file-tree-icon">
          {item.isDir ? (
            <>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {useAltIcons
                ? isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
                : isExpanded ? <PackageOpen size={16} /> : <Package size={16} />
              }
            </>
          ) : (
            useAltIcons
              ? <FileText size={16} style={{ marginLeft: 5 }} />
              : <CassetteTape size={16} style={{ marginLeft: 5 }} />
          )}
          {(isRootFolder && isVaultSecured) && <ShieldCheck size={16} />}
        </span>
        <span className="file-tree-name-wrap">
          <span className="file-tree-name">{displayName}</span>
          {!item.isDir && showFileMTime && item.modTime && (
            <span className="file-tree-mtime">{item.modTime}</span>
          )}
        </span>
      </div>
    );
  }
);

TreeElement.displayName = "TreeElement";

export default TreeElement;
