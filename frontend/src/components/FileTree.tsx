import React from 'react';
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
}

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
}) => {
  if (!fileTree) {
    return (
      <div className="file-tree-empty">
        <p>No directory selected</p>
        <p>Click "Open Directory" to get started</p>
      </div>
    );
  }

  return (
    <div className="file-tree">
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
      />
    </div>
  );
};

export default FileTree;
