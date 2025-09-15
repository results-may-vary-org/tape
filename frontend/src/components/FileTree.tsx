import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Edit3, Trash2, Copy } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as ContextMenu from '@radix-ui/react-context-menu';

interface FileItem {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileItem[];
}

interface FileTreeProps {
  fileTree: FileItem | null;
  onFileSelect: (filePath: string) => void;
  selectedFile: string | null;
  onCreateFile: (parentPath: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onRenameItem: (itemPath: string, newName: string) => void;
  onDeleteItem: (itemPath: string, isDir: boolean) => void;
}

interface FileTreeNodeProps {
  item: FileItem;
  onFileSelect: (filePath: string) => void;
  selectedFile: string | null;
  level: number;
  onCreateFile: (parentPath: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onRenameItem: (itemPath: string, newName: string) => void;
  onDeleteItem: (itemPath: string, isDir: boolean) => void;
  isRootFolder?: boolean;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  item,
  onFileSelect,
  selectedFile,
  level,
  onCreateFile,
  onCreateFolder,
  onRenameItem,
  onDeleteItem,
  isRootFolder = false
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const handleClick = () => {
    if (item.isDir) {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(item.path);
    }
  };

  const handleRename = () => {
    const newName = prompt(`Rename ${item.isDir ? 'folder' : 'file'}:`, item.name);
    if (newName && newName !== item.name) {
      onRenameItem(item.path, newName);
    }
  };

  const handleDelete = () => {
    const confirmMessage = `Are you sure you want to delete this ${item.isDir ? 'folder' : 'file'}?\n${item.name}`;
    if (confirm(confirmMessage)) {
      onDeleteItem(item.path, item.isDir);
    }
  };

  const handleCreateFile = () => {
    const parentPath = item.isDir ? item.path : item.path.substring(0, item.path.lastIndexOf('/'));
    onCreateFile(parentPath);
  };

  const handleCreateFolder = () => {
    const parentPath = item.isDir ? item.path : item.path.substring(0, item.path.lastIndexOf('/'));
    onCreateFolder(parentPath);
  };

  const indent = level * 16;
  const isSelected = selectedFile === item.path;

  return (
    <div>
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div
            onClick={handleClick}
            className={`file-tree-item ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: `${indent}px` }}
          >
            <span className="file-tree-icon">
              {item.isDir ? (
                <>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                </>
              ) : (
                <File size={16} />
              )}
            </span>
            <span className="file-tree-name">{item.name}</span>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content className="context-menu-content">
            <ContextMenu.Item className="context-menu-item" onClick={handleCreateFile}>
              <Plus size={16} />
              New File
            </ContextMenu.Item>
            <ContextMenu.Item className="context-menu-item" onClick={handleCreateFolder}>
              <Folder size={16} />
              New Folder
            </ContextMenu.Item>
            {!isRootFolder && (
              <>
                <ContextMenu.Separator className="context-menu-separator" />
                <ContextMenu.Item className="context-menu-item" onClick={handleRename}>
                  <Edit3 size={16} />
                  Rename
                </ContextMenu.Item>
                <ContextMenu.Item className="context-menu-item" onClick={handleDelete}>
                  <Trash2 size={16} />
                  Delete
                </ContextMenu.Item>
              </>
            )}
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      {item.isDir && isExpanded && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileTreeNode
              key={`${child.path}-${index}`}
              item={child}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              level={level + 1}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onRenameItem={onRenameItem}
              onDeleteItem={onDeleteItem}
              isRootFolder={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({
  fileTree,
  onFileSelect,
  selectedFile,
  onCreateFile,
  onCreateFolder,
  onRenameItem,
  onDeleteItem
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
      />
    </div>
  );
};

export default FileTree;