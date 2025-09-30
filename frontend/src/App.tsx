import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import '@radix-ui/themes/styles.css';
import {Theme as RadixTheme } from '@radix-ui/themes';
import FileTree from './components/FileTree';
import MarkdownEditor from './components/MarkdownEditor';
import MarkdownReader from './components/MarkdownReader';
import SearchModal from './components/SearchModal';
import ShortcutsModal from './components/ShortcutsModal';
import {
  FolderOpen,
  FileText,
  Plus,
  FolderPlus,
  RefreshCw,
  Edit,
  Eye,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { DropdownMenu, Select, Tooltip, Dialog, Button, Flex, TextField, Text } from '@radix-ui/themes';
import {
  OpenDirectoryDialog,
  GetDirectoryTree,
  ReadFile,
  WriteFile,
  CreateFile,
  CreateDirectory,
  DeleteFile,
  DeleteDirectory,
  RenameFile,
  FileExists,
  LoadConfig,
  SaveLastOpenedFolder,
  SaveLastOpenedFile,
  SaveExpandedFolders,
  SaveViewMode,
  SaveTheme,
  SearchFiles
} from "../wailsjs/go/main/App";
import appIcon from './assets/images/logo.png';
import appIconBck from './assets/images/logo-background.png';
import Stats from "./components/Stats";
import handleKeys from "./services/handleKeys";

interface FileItem {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileItem[];
}

interface SearchResult {
  path: string;
  name: string;
  isDir: boolean;
  matchType: 'filename' | 'foldername' | 'content';
  matchText: string;
  contextText: string;
}

type ViewMode = 'editor' | 'reader';
type ThemeMode = 'system' | 'light' | 'dark';

function App() {
  const [version] = useState<string>(__TAPE_VERSION__);
  const [fileTree, setFileTree] = useState<FileItem | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  // Modal states
  const [showCreateFileDialog, setShowCreateFileDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [currentParentPath, setCurrentParentPath] = useState<string>('');

  // Load last opened folder on app startup
  useEffect(() => {
    setIsLoading(true);
    const lastOpenedFolder = localStorage.getItem('lastOpenedFolder');
    if (lastOpenedFolder) {
      handleRootOpen(lastOpenedFolder)
        .then(() => console.log('Last opened folder loaded successfully'))
        .catch((err) => console.warn('Error loading last opened folder:', err));
    }
    setIsLoading(false);
  }, []);

  // Listen for system theme changes when using 'system' mode
  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Force re-render to update resolvedTheme
        setThemeMode('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  const handleThemeChange = async (newTheme: ThemeMode) => {
    setThemeMode(newTheme);

    // Save to config if we have a selected folder
    if (fileTree?.path) {
      try {
        await SaveTheme(fileTree.path, newTheme);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
  };

  const handleViewModeChange = async (newViewMode: ViewMode) => {
    setViewMode(newViewMode);

    // Save to config if we have a selected folder
    if (fileTree?.path) {
      try {
        await SaveViewMode(fileTree.path, newViewMode);
      } catch (error) {
        console.error('Error saving view mode:', error);
      }
    }
  };

  const handleRootOpen = async (rootPath?: string) => {
    try {
      const dirPath = rootPath ?? await OpenDirectoryDialog();
      if (dirPath) {
        const tree = await GetDirectoryTree(dirPath);
        setFileTree(tree);
        setSelectedFilePath(null);
        setFileContent('');
        setOriginalContent('');
        setHasUnsavedChanges(false);

        // Load folder-specific config including view mode, theme, expanded folders, and last file
        try {
          const folderConfig = await LoadConfig(dirPath);
          if (folderConfig.viewMode) {
            setViewMode(folderConfig.viewMode as ViewMode);
          }
          if (folderConfig.theme) {
            setThemeMode(folderConfig.theme as ThemeMode);
          }
          if (folderConfig.expandedFolders) {
            setExpandedFolders(folderConfig.expandedFolders);
          } else {
            setExpandedFolders([]);
          }

          // Restore last opened file if it exists
          if (folderConfig.lastOpenedFile) {
            try {
              const fileExists = await FileExists(folderConfig.lastOpenedFile);
              if (fileExists) {
                const content = await ReadFile(folderConfig.lastOpenedFile);
                setSelectedFilePath(folderConfig.lastOpenedFile);
                setFileContent(content);
                setOriginalContent(content);
                setHasUnsavedChanges(false);
              }
            } catch (error) {
              console.log('Last opened file no longer exists or cannot be read:', error);
            }
          }
        } catch (error) {
          // If no config exists, use defaults
          console.log('No config found for this folder, using defaults');
          setExpandedFolders([]);
        }

        // Save to config for future sessions
        localStorage.setItem('lastOpenedFolder', dirPath);
        await SaveLastOpenedFolder(dirPath);
      }
    } catch (error) {
      console.error('Error opening directory:', error);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    try {
      setIsLoading(true);
      const content = await ReadFile(filePath);
      setSelectedFilePath(filePath);
      setFileContent(content);
      setOriginalContent(content);
      setHasUnsavedChanges(false);

      // Save last opened file to config
      if (fileTree?.path) {
        try {
          await SaveLastOpenedFile(fileTree.path, filePath);
        } catch (error) {
          console.error('Error saving last opened file:', error);
        }
      }
    } catch (error) {
      console.error('Error reading file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandedFoldersChange = async (newExpandedFolders: string[]) => {
    setExpandedFolders(newExpandedFolders);

    // Save expanded folders to config
    if (fileTree?.path) {
      try {
        await SaveExpandedFolders(fileTree.path, newExpandedFolders);
      } catch (error) {
        console.error('Error saving expanded folders:', error);
      }
    }
  };

  const handleSearch = async (query: string): Promise<SearchResult[]> => {
    if (!fileTree?.path || !query.trim()) {
      return [];
    }

    try {
      const results = await SearchFiles(fileTree.path, query);
      return results as SearchResult[];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  };

  const handleContentChange = useCallback((content: string) => {
    setFileContent(content);
    setHasUnsavedChanges(content !== originalContent);
  }, [originalContent]);

  const handleSave = async () => {
    if (!selectedFilePath) return;

    try {
      await WriteFile(selectedFilePath, fileContent);
      setOriginalContent(fileContent);
      setHasUnsavedChanges(false);
      console.log('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  // Global keyboard handler - app shortcuts work everywhere
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeys(
        event,
        setIsSearchModalOpen,
        setIsShortcutsModalOpen,
        setViewMode,
        viewMode,
        selectedFilePath,
        hasUnsavedChanges,
        handleSave
      );
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFilePath, hasUnsavedChanges, handleSave, viewMode]);

  const refreshFileTree = async () => {
    if (!fileTree) return;

    try {
      const tree = await GetDirectoryTree(fileTree.path);
      setFileTree(tree);
    } catch (error) {
      console.error('Error refreshing file tree:', error);
    }
  };

  const handleCreateFile = (parentPath?: string) => {
    if (!fileTree && !parentPath) return;
    setCurrentParentPath(parentPath || fileTree!.path);
    setNewFileName('');
    setShowCreateFileDialog(true);
  };

  const confirmCreateFile = async () => {
    if (!newFileName.trim()) return;

    try {
      const filePath = `${currentParentPath}/${newFileName}.md`;

      // Check if file already exists
      const exists = await FileExists(filePath);
      if (exists) {
        alert(`File "${newFileName}.md" already exists in this directory.`);
        return;
      }

      await CreateFile(filePath);
      await refreshFileTree();

      // Auto-open the newly created file
      await handleFileSelect(filePath);

      setShowCreateFileDialog(false);
      setNewFileName('');
    } catch (error) {
      console.error('Error creating file:', error);
      alert('Error creating file. Please try again.');
    }
  };

  const handleCreateFolder = (parentPath?: string) => {
    if (!fileTree && !parentPath) return;
    setCurrentParentPath(parentPath || fileTree!.path);
    setNewFolderName('');
    setShowCreateFolderDialog(true);
  };

  const confirmCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const folderPath = `${currentParentPath}/${newFolderName}`;

      // Check if folder already exists
      const exists = await FileExists(folderPath);
      if (exists) {
        alert(`Folder "${newFolderName}" already exists in this directory.`);
        return;
      }

      await CreateDirectory(folderPath);
      await refreshFileTree();
      setShowCreateFolderDialog(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Error creating folder. Please try again.');
    }
  };

  const handleRenameItem = async (itemPath: string, newName: string) => {
    try {
      const parentPath = itemPath.substring(0, itemPath.lastIndexOf('/'));
      const newPath = `${parentPath}/${newName}`;

      // Check if new name already exists
      if (itemPath !== newPath) {
        const exists = await FileExists(newPath);
        if (exists) {
          alert(`"${newName}" already exists in this directory.`);
          return;
        }
      }

      await RenameFile(itemPath, newPath);
      await refreshFileTree();

      // Update selected file path if it was renamed
      if (selectedFilePath === itemPath) {
        setSelectedFilePath(newPath);
      }
    } catch (error) {
      console.error('Error renaming item:', error);
      alert('Error renaming item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemPath: string, isDir: boolean) => {
    try {
      if (isDir) {
        await DeleteDirectory(itemPath);
      } else {
        await DeleteFile(itemPath);
      }
      await refreshFileTree();

      // Clear selected file if it was deleted
      if (selectedFilePath === itemPath) {
        setSelectedFilePath(null);
        setFileContent('');
        setOriginalContent('');
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const resolvedTheme = themeMode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : themeMode;

  if (!fileTree) {
    return (
      <RadixTheme appearance={resolvedTheme} accentColor="gold" grayColor="sand" radius="medium" scaling="100%">
        <div className="app-container">
          <div className="welcome-screen">
            <div>
              <img src={appIcon} alt="Tape app icon"/>
              <h1 className="workbench">Tape</h1>
            </div>
            <div className="welcome-buttons">
              <Tooltip content="Select a directory to browse markdown files">
                <Button disabled={isLoading} onClick={() => handleRootOpen()} className="primary-button">
                  <FolderOpen size={20}/>
                  Open your tape box
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </RadixTheme>
    );
  }

  return (
    <RadixTheme appearance={resolvedTheme} accentColor="gold" grayColor="sand" radius="medium" scaling="100%">
      <div className="app-container">
        <div className="header">
          <div className="header-left">
            <div className="logo">
              <img src={appIconBck} alt="Tape app icon"/>
              <h1 className="workbench">Tape <small style={{fontSize: 'xx-small'}}>{version}</small></h1>
              <div id="info" className="info vt32">
                {hasUnsavedChanges && "unsaved file_"}
              </div>
            </div>
            <div className="file-info">
              <span className="current-path">{fileTree && fileTree.path}</span >
              {selectedFilePath && selectedFilePath.split('/').pop() ? (
                <span className="current-file">
                  {selectedFilePath?.split('/').pop()?.slice(0, 30)}
                </span>
              ) : <span className="current-file">no tape selected</span>}
            </div>
          </div>
          <div className="header-right">
              <Select.Root value={themeMode} onValueChange={(value: ThemeMode) => handleThemeChange(value)}>
                <Select.Trigger className="theme-select-trigger">
                  <Flex as="span" align="center" gap="2">
                    {themeMode === 'system'
                      ? <Monitor size={16}/>
                      : themeMode === 'dark'
                        ? <Moon size={16}/>
                        : <Sun size={16}/>
                    }
                    {themeMode === 'system'
                      ? "System"
                      : themeMode === 'dark'
                        ? "Dark"
                        : "Light"
                    }
                  </Flex>
                </Select.Trigger>
                <Select.Content className="select-content" position="popper">
                  <Select.Item value="system" className="select-item">
                    <Flex as="span" align="center" gap="2">
                      <Monitor size={16} />
                      System
                    </Flex>
                  </Select.Item>
                  <Select.Item value="light" className="select-item">
                    <Flex as="span" align="center" gap="2">
                      <Sun size={16} />
                      Light
                    </Flex>
                  </Select.Item>
                  <Select.Item value="dark" className="select-item">
                    <Flex as="span" align="center" gap="2">
                      <Moon size={16} />
                      Dark
                    </Flex>
                  </Select.Item>
                </Select.Content>
              </Select.Root>

              <div className="view-toggle">
                <Button
                  size="2"
                  variant={viewMode === "editor" ? "solid" : "soft"}
                  onClick={() => handleViewModeChange('editor')}
                  style={{borderBottomRightRadius: 0, borderTopRightRadius: 0}}
                >
                  <Edit size="16"/> Editor
                </Button>
                <Button
                  size="2"
                  variant={viewMode === "reader" ? "solid" : "soft"}
                  onClick={() => handleViewModeChange('reader')}
                  style={{borderBottomLeftRadius: 0, borderTopLeftRadius: 0}}
                >
                  <Eye size="16"/> Reader
                </Button>
              </div>
          </div>
        </div>

        <div className="main-content">
          <div className="sidebar">
            <div className="sidebar-header">
              <h3>Files</h3>
              <div className="file-actions">
                <Tooltip content="Select another root">
                  <button onClick={() => handleRootOpen()} className="action-button">
                    <FolderOpen size={16} />
                  </button>
                </Tooltip>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <button className="action-button">
                      <Plus size={16} />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content className="dropdown-content" sideOffset={5}>
                    <DropdownMenu.Item className="dropdown-item" onClick={() => handleCreateFile()}>
                      <FileText size={16} />
                      New File
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="dropdown-item" onClick={() => handleCreateFolder()}>
                      <FolderPlus size={16} />
                      New Folder
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>

                <Tooltip content="Refresh file tree">
                  <button onClick={refreshFileTree} className="action-button">
                    <RefreshCw size={16} />
                  </button>
                </Tooltip>
              </div>
            </div>
            <FileTree
              fileTree={fileTree}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFilePath}
              onCreateFile={handleCreateFile}
              onCreateFolder={handleCreateFolder}
              onRenameItem={handleRenameItem}
              onDeleteItem={handleDeleteItem}
              expandedFolders={expandedFolders}
              onExpandedFoldersChange={handleExpandedFoldersChange}
            />
          </div>

          <div className="content-area">
            <Stats original={originalContent} edited={fileContent}/>
            {isLoading ? (
              <div className="loading">Loading...</div>
            ) : viewMode === 'editor' ? (
              <MarkdownEditor
                key={`editor-${viewMode}`}
                content={fileContent}
                onChange={handleContentChange}
                filePath={selectedFilePath}
                autoFocus={true}
              />
            ) : (
              <MarkdownReader
                content={fileContent}
                filePath={selectedFilePath}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create File Dialog */}
      <Dialog.Root open={showCreateFileDialog} onOpenChange={setShowCreateFileDialog}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Create New File</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Enter a name for the new markdown file.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                File name
              </Text>
              <TextField.Root
                value={newFileName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFileName(e.target.value)}
                placeholder="my-document"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmCreateFile();
                  }
                }}
              >
                <TextField.Slot side="right">
                  <Text size="2" color="gray">.md</Text>
                </TextField.Slot>
              </TextField.Root>
            </label>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={confirmCreateFile} disabled={!newFileName.trim()}>
              Create File
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Create Folder Dialog */}
      <Dialog.Root open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Create New Folder</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Enter a name for the new folder.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Folder name
              </Text>
              <TextField.Root
                value={newFolderName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
                placeholder="my-folder"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmCreateFolder();
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
            <Button onClick={confirmCreateFolder} disabled={!newFolderName.trim()}>
              Create Folder
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => {
          setIsSearchModalOpen(false);
          // Refocus editor in editor mode after modal closes
          if (viewMode === 'editor') {
            setTimeout(() => {
              const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
              textarea?.focus();
            }, 100);
          }
        }}
        onFileSelect={handleFileSelect}
        onSearch={handleSearch}
      />

      {/* Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => {
          setIsShortcutsModalOpen(false);
          // Refocus editor in editor mode after modal closes
          if (viewMode === 'editor') {
            setTimeout(() => {
              const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
              textarea?.focus();
            }, 100);
          }
        }}
        version={version}
      />
    </RadixTheme>
  );
}

export default App;
