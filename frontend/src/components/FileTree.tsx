import React, { useEffect, useMemo } from 'react';
import type { UIThemeMode, FileItem } from '../types/types';
import FileTreeNode from './FileTreeNode';

interface FileTreeProps {
  fileTree: FileItem | null;
  onFileSelect: (item: FileItem) => void;
  selectedFile: string | null;
  onCreateFile: (parentPath: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onRenameItem: (itemPath: string, newName: string, isFile: boolean) => void;
  onDeleteItem: (itemPath: string, isDir: boolean) => void;
  expandedFolders: string[];
  onExpandedFoldersChange: (expandedFolders: string[]) => void;
  isVaultSecured: boolean;
  uiTheme: UIThemeMode;
  showFileMTime: boolean;
  treeFocused: boolean;
  focusedTreeItem: string | null;
  onFocusedTreeItemChange: (path: string | null) => void;
}

// depth-first flatten of the rendered items, skipping collapsed folders
const flattenVisible = (item: FileItem, expanded: string[]): FileItem[] => {
  const visible = [item];
  if (item.isDir && expanded.includes(item.path) && item.children) {
    for (const child of item.children) {
      visible.push(...flattenVisible(child, expanded));
    }
  }
  return visible;
};

const FileTree: React.FC<FileTreeProps> = ({
  fileTree,
  onFileSelect,
  selectedFile,
  onCreateFile,
  onCreateFolder,
  onRenameItem,
  onDeleteItem,
  expandedFolders,
  onExpandedFoldersChange,
  isVaultSecured,
  uiTheme,
  showFileMTime,
  treeFocused,
  focusedTreeItem,
  onFocusedTreeItemChange,
}) => {
  const visibleItems = useMemo(
    () => (fileTree ? flattenVisible(fileTree, expandedFolders) : []),
    [fileTree, expandedFolders]
  );
  const visiblePaths = useMemo(() => new Set(visibleItems.map(i => i.path)), [visibleItems]);

  // entering the tree with no usable focus target: fall back to the root (first visible node)
  useEffect(() => {
    if (treeFocused && (focusedTreeItem === null || !visiblePaths.has(focusedTreeItem))) {
      onFocusedTreeItemChange(visibleItems[0]?.path ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeFocused, visiblePaths, visibleItems]);

  // arrow keys move the tree cursor between the rendered nodes
  const handleTreeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    if (visibleItems.length === 0) return;

    const idx = focusedTreeItem ? visibleItems.findIndex(i => i.path === focusedTreeItem) : -1;
    let next = idx;
    if (e.key === 'ArrowDown') next = idx < 0 ? 0 : Math.min(idx + 1, visibleItems.length - 1);
    else if (e.key === 'ArrowUp') next = idx < 0 ? 0 : Math.max(idx - 1, 0);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = visibleItems.length - 1;
    if (next !== idx) onFocusedTreeItemChange(visibleItems[next].path);
  };

  if (!fileTree) {
    return (
      <div className="file-tree-empty">
        <p>No directory selected</p>
        <p>Click "Open Directory" to get started</p>
      </div>
    );
  }

  return (
    <div className="file-tree" onKeyDown={handleTreeKeyDown}>
      <FileTreeNode
        item={fileTree}
        onFileSelect={onFileSelect}
        selectedFile={selectedFile}
        level={0}
        onCreateFile={onCreateFile}
        onCreateFolder={onCreateFolder}
        onRenameItem={onRenameItem}
        onDeleteItem={onDeleteItem}
        isRootFolder={true}
        expandedFolders={expandedFolders}
        onExpandedFoldersChange={onExpandedFoldersChange}
        isVaultSecured={isVaultSecured}
        uiTheme={uiTheme}
        showFileMTime={showFileMTime}
        treeFocused={treeFocused}
        focusedTreeItem={focusedTreeItem}
        onFocusedTreeItemChange={onFocusedTreeItemChange}
      />
    </div>
  );
};

export default FileTree;
