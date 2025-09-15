import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import '@radix-ui/themes/styles.css';
import { Theme as RadixTheme } from '@radix-ui/themes';
import FileTree from './components/FileTree';
import MarkdownEditor from './components/MarkdownEditor';
import MarkdownReader from './components/MarkdownReader';
import {
  FolderOpen,
  FileText,
  Plus,
  FolderPlus,
  RefreshCw,
  Edit,
  Eye,
  Save,
  Settings,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Check
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Select from '@radix-ui/react-select';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Toast from '@radix-ui/react-toast';
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
  LoadInitialConfig,
  LoadConfig,
  SaveLastOpenedFolder,
  SaveViewMode,
  SaveTheme
} from "../wailsjs/go/main/App";

interface FileItem {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileItem[];
}

type ViewMode = 'editor' | 'reader';
type ThemeMode = 'system' | 'light' | 'dark';

function App() {
  const [fileTree, setFileTree] = useState<FileItem | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load last opened folder on app startup
  useEffect(() => {
    const loadLastFolder = async () => {
      try {
        // First try to load from the old config location
        const initialConfig = await LoadInitialConfig();
        if (initialConfig.lastOpenedFolder) {
          try {
            // Check if the folder still exists
            const tree = await GetDirectoryTree(initialConfig.lastOpenedFolder);
            setFileTree(tree);

            // Load folder-specific config including view mode and theme
            const folderConfig = await LoadConfig(initialConfig.lastOpenedFolder);
            if (folderConfig.viewMode) {
              setViewMode(folderConfig.viewMode as ViewMode);
            } else if (initialConfig.viewMode) {
              // Fallback to old config view mode
              setViewMode(initialConfig.viewMode as ViewMode);
            }

            if (folderConfig.theme) {
              setThemeMode(folderConfig.theme as ThemeMode);
            } else if (initialConfig.theme) {
              // Fallback to old config theme
              setThemeMode(initialConfig.theme as ThemeMode);
            }
          } catch (treeError) {
            console.log('Previous folder no longer exists:', treeError);
          }
        }
      } catch (error) {
        console.log('No previous config found');
      }
    };

    loadLastFolder();
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

  const handleOpenDirectory = async () => {
    try {
      const dirPath = await OpenDirectoryDialog();
      if (dirPath) {
        const tree = await GetDirectoryTree(dirPath);
        setFileTree(tree);
        setSelectedFilePath(null);
        setFileContent('');
        setOriginalContent('');
        setHasUnsavedChanges(false);

        // Load folder-specific config including view mode and theme
        try {
          const folderConfig = await LoadConfig(dirPath);
          if (folderConfig.viewMode) {
            setViewMode(folderConfig.viewMode as ViewMode);
          }
          if (folderConfig.theme) {
            setThemeMode(folderConfig.theme as ThemeMode);
          }
        } catch (error) {
          // If no config exists, use defaults
          console.log('No config found for this folder, using defaults');
        }

        // Save to config for future sessions
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
    } catch (error) {
      console.error('Error reading file:', error);
    } finally {
      setIsLoading(false);
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

  // Global keyboard handler for Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (selectedFilePath && hasUnsavedChanges) {
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFilePath, hasUnsavedChanges, handleSave]);

  const refreshFileTree = async () => {
    if (!fileTree) return;

    try {
      const tree = await GetDirectoryTree(fileTree.path);
      setFileTree(tree);
    } catch (error) {
      console.error('Error refreshing file tree:', error);
    }
  };

  const handleCreateFile = async (parentPath?: string) => {
    if (!fileTree && !parentPath) return;

    const basePath = parentPath || fileTree!.path;
    const fileName = prompt('Enter file name (without .md extension):');
    if (!fileName) return;

    try {
      const filePath = `${basePath}/${fileName}.md`;

      // Check if file already exists
      const exists = await FileExists(filePath);
      if (exists) {
        alert(`File "${fileName}.md" already exists in this directory.`);
        return;
      }

      await CreateFile(filePath);
      await refreshFileTree();
    } catch (error) {
      console.error('Error creating file:', error);
      alert('Error creating file. Please try again.');
    }
  };

  const handleCreateFolder = async (parentPath?: string) => {
    if (!fileTree && !parentPath) return;

    const basePath = parentPath || fileTree!.path;
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      const folderPath = `${basePath}/${folderName}`;

      // Check if folder already exists
      const exists = await FileExists(folderPath);
      if (exists) {
        alert(`Folder "${folderName}" already exists in this directory.`);
        return;
      }

      await CreateDirectory(folderPath);
      await refreshFileTree();
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
      <RadixTheme appearance={resolvedTheme}>
        <div className="app-container">
          <div className="welcome-screen">
            <h1>Markdown Note Taker</h1>
            <p>Get started by opening a directory or file</p>
            <div className="welcome-buttons">
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button onClick={handleOpenDirectory} className="primary-button">
                      <FolderOpen size={20} />
                      Open Directory
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="tooltip-content" sideOffset={5}>
                      Select a directory to browse markdown files
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>

              </Tooltip.Provider>
            </div>
          </div>
        </div>
      </RadixTheme>
    );
  }

  return (
    <RadixTheme appearance={resolvedTheme}>
      <div className="app-container">
        <div className="header">
          <div className="header-left">
            <h1>Markdown Notes</h1>
            <div className="file-info">
              <span className="current-path">{fileTree.path}</span>
              {selectedFilePath && (
                <span className="current-file">
                  {selectedFilePath.split('/').pop()}
                  {hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
                </span>
              )}
            </div>
          </div>
          <div className="header-right">
            <Tooltip.Provider>
              <Select.Root value={themeMode} onValueChange={(value: ThemeMode) => handleThemeChange(value)}>
                <Select.Trigger className="theme-select-trigger">
                  <Select.Value>
                    {themeMode === 'system' ? <Monitor size={16} /> : themeMode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  </Select.Value>
                  <Select.Icon>
                    <ChevronDown size={14} />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="select-content">
                    <Select.Viewport className="select-viewport">
                      <Select.Item value="system" className="select-item">
                        <Select.ItemIndicator className="select-item-indicator">
                          <Check size={16} />
                        </Select.ItemIndicator>
                        <Select.ItemText>
                          <div className="select-item-content">
                            <Monitor size={16} />
                            System
                          </div>
                        </Select.ItemText>
                      </Select.Item>
                      <Select.Item value="light" className="select-item">
                        <Select.ItemIndicator className="select-item-indicator">
                          <Check size={16} />
                        </Select.ItemIndicator>
                        <Select.ItemText>
                          <div className="select-item-content">
                            <Sun size={16} />
                            Light
                          </div>
                        </Select.ItemText>
                      </Select.Item>
                      <Select.Item value="dark" className="select-item">
                        <Select.ItemIndicator className="select-item-indicator">
                          <Check size={16} />
                        </Select.ItemIndicator>
                        <Select.ItemText>
                          <div className="select-item-content">
                            <Moon size={16} />
                            Dark
                          </div>
                        </Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>

              <div className="view-toggle">
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      className={viewMode === 'editor' ? 'active' : ''}
                      onClick={() => handleViewModeChange('editor')}
                    >
                      <Edit size={16} />
                      Editor
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="tooltip-content" sideOffset={5}>
                      Switch to editor mode
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      className={viewMode === 'reader' ? 'active' : ''}
                      onClick={() => handleViewModeChange('reader')}
                    >
                      <Eye size={16} />
                      Reader
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="tooltip-content" sideOffset={5}>
                      Switch to reader mode
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </div>
            </Tooltip.Provider>
          </div>
        </div>

        <div className="main-content">
          <div className="sidebar">
            <div className="sidebar-header">
              <h3>Files</h3>
              <div className="file-actions">
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button onClick={handleOpenDirectory} className="action-button">
                        <FolderOpen size={16} />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="tooltip-content" sideOffset={5}>
                        Select another folder
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="action-button">
                        <Plus size={16} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
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
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>

                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button onClick={refreshFileTree} className="action-button">
                        <RefreshCw size={16} />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="tooltip-content" sideOffset={5}>
                        Refresh file tree
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
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
            />
          </div>

          <div className="content-area">
            {isLoading ? (
              <div className="loading">Loading...</div>
            ) : viewMode === 'editor' ? (
              <MarkdownEditor
                content={fileContent}
                onChange={handleContentChange}
                onSave={handleSave}
                filePath={selectedFilePath}
                hasUnsavedChanges={hasUnsavedChanges}
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
    </RadixTheme>
  );
}

export default App;
