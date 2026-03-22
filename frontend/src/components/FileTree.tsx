import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Edit3,
  Trash2,
  CassetteTape, PackageOpen, Package, ShieldCheck
} from 'lucide-react';
import type { UIThemeMode } from '../types/types';
import { ContextMenu, Dialog, Button, Flex, TextField, Text } from '@radix-ui/themes';

interface FileItem {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileItem[];
}

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
}

interface FileTreeNodeProps {
  item: FileItem;
  onFileSelect: (item: FileItem) => void;
  selectedFile: string | null;
  level: number;
  onCreateFile: (parentPath: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onRenameItem: (itemPath: string, newName: string, isFile: boolean) => void;
  onDeleteItem: (itemPath: string, isDir: boolean) => void;
  isRootFolder?: boolean;
  expandedFolders: string[];
  onExpandedFoldersChange: (expandedFolders: string[]) => void;
  isVaultSecured: boolean;
  uiTheme: UIThemeMode;
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
  isRootFolder = false,
  expandedFolders,
  onExpandedFoldersChange,
  isVaultSecured,
  uiTheme,
}: FileTreeNodeProps) => {
  const useAltIcons = uiTheme === 'modern' || uiTheme === 'agrume';
  const isExpanded = expandedFolders.includes(item.path);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState<string>(item.name);
  const [renameError, setRenameError] = useState<string>("");
  const itemRef = React.useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (item.isDir) {
      const newExpandedFolders = isExpanded
        ? expandedFolders.filter(path => path !== item.path)
        : [...expandedFolders, item.path];
      onExpandedFoldersChange(newExpandedFolders);
    } else {
      onFileSelect(item);
    }
  };

  const handleRename = () => {
    const stem = item.isDir ? item.name : item.name.replace(/\.(mde|md)$/i, "");
    setNewName(stem);
    setRenameError("");
    setShowRenameDialog(true);
  };

  const confirmRename = async (isDir: boolean) => {
    if (!newName.trim()) return;
    const ext = !isDir ? (item.name.match(/\.(mde|md)$/i)?.[0] ?? "") : "";
    const fullName = newName.trim() + ext;
    if (fullName === item.name) {
      setShowRenameDialog(false);
      return;
    }
    try {
      // linter say no but await is very important here
      await onRenameItem(item.path, fullName, !isDir);
      setShowRenameDialog(false);
      setRenameError("");
    } catch (error) {
      if (typeof error === "string" && error === "file_already_exist") {
        setRenameError(`${isDir ? "Folder" : "File"} "${fullName}" already exists in this directory.`);
      } else {
        setRenameError(`Error renaming ${isDir ? "folder" : "file"}. Please try again.`);
        console.warn("Rename error:", error);
      }
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDeleteItem(item.path, item.isDir);
    setShowDeleteDialog(false);
  };

  const handleCreateFile = () => {
    const parentPath = item.isDir ? item.path : item.path.substring(0, item.path.lastIndexOf('/'));
    onCreateFile(parentPath);
  };

  const handleCreateFolder = () => {
    const parentPath = item.isDir ? item.path : item.path.substring(0, item.path.lastIndexOf('/'));
    onCreateFolder(parentPath);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleClick();
        break;
      case 'ArrowRight':
        if (item.isDir && !isExpanded) {
          e.preventDefault();
          const newExpandedFolders = [...expandedFolders, item.path];
          onExpandedFoldersChange(newExpandedFolders);
        }
        break;
      case 'ArrowLeft':
        if (item.isDir && isExpanded) {
          e.preventDefault();
          const newExpandedFolders = expandedFolders.filter(path => path !== item.path);
          onExpandedFoldersChange(newExpandedFolders);
        }
        break;
    }
  };

  const indent = level * 16;
  const isSelected = selectedFile === item.path;

  return (
    <div>
      <ContextMenu.Root>
        <ContextMenu.Trigger>
          <div
            ref={itemRef}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`file-tree-item ${isSelected ? 'selected' : ''}`}
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
                  ? <FileText size={16} style={{marginLeft: 5}} />
                  : <CassetteTape size={16} style={{marginLeft: 5}} />
              )}
              {(isRootFolder && isVaultSecured) && <ShieldCheck size={16}/>}
            </span>
            <span className="file-tree-name">{item.name}</span>
          </div>
        </ContextMenu.Trigger>
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
              expandedFolders={expandedFolders}
              onExpandedFoldersChange={onExpandedFoldersChange}
              isVaultSecured={isVaultSecured}
              uiTheme={uiTheme}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Delete {item.isDir ? 'Folder' : 'File'}</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Are you sure you want to delete this {item.isDir ? 'folder' : 'file'}?
            <br />
            <Text weight="bold" mt="2" as="div">{item.name}</Text>
            {item.isDir && (
              <Text color="red" size="2" mt="2" as="div">
                This will delete the folder and all its contents permanently.
              </Text>
            )}
          </Dialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button color="red" onClick={confirmDelete}>
              Delete
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Rename Dialog */}
      <Dialog.Root open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Rename {item.isDir ? 'Folder' : 'File'}</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {renameError
              ? <span className="important">{renameError}</span>
              : <>Enter a new name for this {item.isDir ? 'folder' : 'file'}.</>
            }
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                {item.isDir ? 'Folder' : 'File'} name
              </Text>
              <TextField.Root
                value={item.isDir ? newName : newName.replace(/\.(mde|md)$/i, "")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewName(e.target.value); setRenameError(""); }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmRename(item.isDir);
                  }
                }}
              />
            </label>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={() => confirmRename(item.isDir)} disabled={!newName.trim()}>
              Rename
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
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
  onDeleteItem,
  expandedFolders,
  onExpandedFoldersChange,
  isVaultSecured,
  uiTheme,
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
      />
    </div>
  );
};

export default FileTree;
