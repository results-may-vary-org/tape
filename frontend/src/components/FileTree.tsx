import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  Edit3,
  Trash2,
  Box, CassetteTape, PackageOpen, Package
} from 'lucide-react';
import { ContextMenu, Dialog, Button, Flex, TextField, Text } from '@radix-ui/themes';

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
  expandedFolders: string[];
  onExpandedFoldersChange: (expandedFolders: string[]) => void;
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
  expandedFolders: string[];
  onExpandedFoldersChange: (expandedFolders: string[]) => void;
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
  onExpandedFoldersChange
}) => {
  const isExpanded = expandedFolders.includes(item.path);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const itemRef = React.useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (item.isDir) {
      const newExpandedFolders = isExpanded
        ? expandedFolders.filter(path => path !== item.path)
        : [...expandedFolders, item.path];
      onExpandedFoldersChange(newExpandedFolders);
    } else {
      onFileSelect(item.path);
    }
  };

  const handleRename = () => {
    setNewName(item.name);
    setShowRenameDialog(true);
  };

  const confirmRename = () => {
    if (newName.trim() && newName !== item.name) {
      onRenameItem(item.path, newName.trim());
    }
    setShowRenameDialog(false);
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
                  {isExpanded ? <PackageOpen size={16} /> : <Package size={16} />}
                </>
              ) : (
                <CassetteTape size={16} style={{marginLeft: 5}} />
              )}
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
            Enter a new name for this {item.isDir ? 'folder' : 'file'}.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                {item.isDir ? 'Folder' : 'File'} name
              </Text>
              <TextField.Root
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmRename();
                  }
                }}
              >
                {!item.isDir && (
                  <TextField.Slot side="right">
                    <Text size="2" color="gray">.md</Text>
                  </TextField.Slot>
                )}
              </TextField.Root>
            </label>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={confirmRename} disabled={!newName.trim()}>
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
  onExpandedFoldersChange
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
      />
    </div>
  );
};

export default FileTree;
