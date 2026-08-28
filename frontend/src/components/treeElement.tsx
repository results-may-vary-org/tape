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

interface treeElementProps {
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
  ref?: React.Ref<HTMLDivElement>;
}

const treeElement: React.FC<treeElementProps> = ({
  item,
  isExpanded,
  isSelected,
  isRootFolder = false,
  isVaultSecured,
  showFileMTime,
  indent,
  useAltIcons,
  onClick,
  onKeyDown,
  ref,
}: treeElementProps) => {
  const displayName = (isVaultSecured && !item.isDir && item.name.endsWith(".mde"))
    ? item.name.slice(0, -4)
    : item.name;

  return (
    <div
      ref={ref}
      onClick={onClick}
      onKeyDown={onKeyDown}
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
};

export default treeElement;