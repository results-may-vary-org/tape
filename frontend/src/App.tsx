import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import '@radix-ui/themes/styles.css';
import {Theme as RadixTheme } from '@radix-ui/themes';
import {useTheme} from "next-themes";
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
  PanelTopClose,
  LockIcon
} from 'lucide-react';
import { DropdownMenu, Tooltip, Dialog, Button, Flex, TextField, Text } from '@radix-ui/themes';
import {
  OpenDirectoryDialog,
  GetDirectoryTree,
  ReadFile,
  CreateFile,
  CreateDirectory,
  DeleteFile,
  DeleteDirectory,
  RenameFile,
  LoadConfig,
  SaveLastOpenedFolder,
  SaveLastOpenedFile,
  SaveExpandedFolders,
  SaveViewMode,
  SearchFiles,
  SetupPassword,
  HasSecurity,
  PasswordIsCorrect,
  IsFileExists,
  WriteContentInFile,
  GetOs,
} from "../wailsjs/go/main/App";
import appIcon from './assets/images/logo.png';
import appIconBck from './assets/images/logo-background.png';
import Stats from "./components/Stats";
import handleKeys from "./services/handleKeys";
import SettingsPopover from './components/SettingsPopover';
import type { FileItem, ViewMode, ThemeMode, UIThemeMode, SearchResult } from './types/types';
import UseEncVaultModal from './components/UseEncVaultModal';
import UnlockVaultModal from './components/UnlockVaultModal';

function App() {
  const { setTheme } = useTheme();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainHeaderRef = useRef<HTMLDivElement>(null);
  const scrollRatioRef = useRef<number>(0);

  const [version] = useState<string>(__TAPE_VERSION__);
  const [dirPath, setDirPath] = useState<string>("");
  const [fileTree, setFileTree] = useState<FileItem | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isUseEncModalOpen, setIsUseEncModalOpen] = useState<boolean>(false);
  const [useEncModalError, setUseEncModalError] = useState<string>("");
  const [isUnlockVaultModalOpen, setIsUnlockVaultModalOpen] = useState<boolean>(false);
  const [unlockVaultModalError, setUnlockVaultModalError] = useState<string>("");
  const [isVaultSecured, setIsVaultSecured] = useState<boolean>(false);
  const [uiTheme, setUITheme] = useState<UIThemeMode>('original');

  // Modal states
  const [showCreateFileDialog, setShowCreateFileDialog] = useState<boolean>(false);
  const [createFileDialogError, setCreateFileDialogError] = useState<string>("");
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState<boolean>(false);
  const [createFolderDialogError, setCreateFolderDialogError] = useState<string>("");
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [currentParentPath, setCurrentParentPath] = useState<string>('');

  // maybe one day we can calculate the height automatically,
  // but for now this is the fastest since none of the elements change height
  // 53 = header, 40 = subheader
  const [containerHeight, setContainerHeight] = useState<string>("calc(100vh - (40px + 53px))");
  const [sidebarRotate, setSidebarRotate] = useState<string>("270deg");

  const handleVaultSetup = async (password: string) => {
    if (password) {
      const resp = await SetupPassword(password, dirPath);
      if (resp !== "ok") {
        setUseEncModalError(`Error setting up vault: ${resp.substring(0, 30)}`);
        return;
      }
    }
    setUseEncModalError("");
    setIsUseEncModalOpen(false);
    loadConfig();
  };

  const handleVaultUnlock = async (password: string) => {
    const isValid = await PasswordIsCorrect(password, dirPath);
    if (!isValid) {
      setUnlockVaultModalError("Wrong password. Please try again.");
      return;
    }
    const isSecured = await HasSecurity(dirPath);
    setIsVaultSecured(isSecured);
    setUnlockVaultModalError("");
    setIsUnlockVaultModalOpen(false);
    loadConfig();
  };

  const lockVault = () => {
    setDirPath("");
    setFileTree(null);
  }

  const getLastOpenedFolder = () => {
    return window.localStorage.getItem("lastOpenedFolder");
  }

  // load the config and set up the app
  const loadConfig = async (dPath?: string) => {
    const path = dPath ?? dirPath;

    // set rootPath on Go side before any file reads so HasSecurity works correctly
    localStorage.setItem('lastOpenedFolder', path);
    await SaveLastOpenedFolder(path);

    const tree = await GetDirectoryTree(path);
    setFileTree(tree);
    setSelectedFilePath(null);
    setFileContent('');
    setOriginalContent('');
    setHasUnsavedChanges(false);

    // Load folder-specific config including view mode, theme, expanded folders, and last file
    try {
      const folderConfig = await LoadConfig(path);
      if (folderConfig.viewMode) {
        setViewMode(folderConfig.viewMode as ViewMode);
      }
      if (folderConfig.theme) {
        setTheme(folderConfig.theme as ThemeMode);
      }
      if (folderConfig.uiTheme) {
        setUITheme(folderConfig.uiTheme as UIThemeMode);
      } else {
        setUITheme('original');
      }
      if (folderConfig.expandedFolders) {
        setExpandedFolders(folderConfig.expandedFolders);
      } else {
        setExpandedFolders([]);
      }

      // Restore last opened file if it exists
      if (folderConfig.lastOpenedFile) {
        try {
          const fileExists = await IsFileExists(folderConfig.lastOpenedFile);
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
  }

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

  const toggleSidebar = () => {
    if (sidebarRef && sidebarRef.current) {
      sidebarRef.current.classList.toggle("sidebar-extended");
      sidebarRef.current.classList.toggle("sidebar-hidden");
      if (sidebarRef.current.classList.contains("sidebar-hidden")) {
        setSidebarRotate("90deg");
      } else {
        setSidebarRotate("270deg");
      }
    }
  }

  const toggleZenMode = () => {
    if (mainHeaderRef && mainHeaderRef.current && sidebarRef && sidebarRef.current) {
      mainHeaderRef.current.classList.toggle("header-extended");
      mainHeaderRef.current.classList.toggle("header-hidden");

      // not toggle on sidebarRef class because we need to force the class not to inverse
      if (mainHeaderRef.current.classList.contains("header-hidden")) {
        setContainerHeight("calc(100vh - 40px)");
        sidebarRef.current.classList.remove("sidebar-extended");
        sidebarRef.current.classList.add("sidebar-hidden");
        setSidebarRotate("90deg");
      } else {
        setContainerHeight("calc(100vh - (40px + 53px))");
        sidebarRef.current.classList.add("sidebar-extended");
        sidebarRef.current.classList.remove("sidebar-hidden");
        setSidebarRotate("270deg");
      }
    }
  }

  // handle the opening of any root (new or old)
  const handleRootOpen = async (rootPath?: string) => {
    try {
      const dPath = rootPath ?? await OpenDirectoryDialog();
      if (dPath) {
        setDirPath(dPath);
        const tree = await GetDirectoryTree(dPath);

        // ask if the user want an encrypted vault or not
        // or ask for the password to unlock vault
        const noChildren = !tree.children || (tree.children && tree.children.length === 0);
        const needAuth = await HasSecurity(dPath);
        if (needAuth) { // first because the config file is actually filtered from children list
          setIsUnlockVaultModalOpen(true);
          return null; // next step handled via onSubmit callback
        } else {
          setIsVaultSecured(false);
        }
        if (noChildren && !needAuth) {
          setIsUseEncModalOpen(true);
          return null; // next step handled via onSubmit callback
        }
        loadConfig(dPath);
      }
    } catch (error) {
      console.error('Error opening directory:', error);
    }
  };

  // open a file and save the state in the config
  const handleFileSelect = async (item: FileItem) => {
    try {
      setIsLoading(true);
      scrollRatioRef.current = 0;
      const content = await ReadFile(item.path);
      setSelectedFilePath(item.path);
      setFileContent(content);
      setOriginalContent(content);
      setHasUnsavedChanges(false);

      // Save last opened file to config
      if (fileTree?.path) {
        try {
          await SaveLastOpenedFile(fileTree.path, item.path);
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

  // expand folder and save the state in the config
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

  // get the search result from the go backend
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

  // write new content and tell that the file need saving
  const handleContentChange = useCallback((content: string) => {
    setFileContent(content);
    setHasUnsavedChanges(content !== originalContent);
  }, [originalContent]);

  // write content into a file
  const handleSave = async () => {
    if (!selectedFilePath) return;

    try {
      await WriteContentInFile(selectedFilePath, fileContent);
      setOriginalContent(fileContent);
      setHasUnsavedChanges(false);
      console.log('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  // global keyboard handler - app shortcuts work everywhere
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeys(
        event,
        setIsSearchModalOpen,
        setIsShortcutsModalOpen,
        setIsUseEncModalOpen,
        setIsUnlockVaultModalOpen,
        isSearchModalOpen,
        isShortcutsModalOpen,
        isUseEncModalOpen,
        isUnlockVaultModalOpen,
        viewMode,
        selectedFilePath,
        hasUnsavedChanges,
        handleSave,
        handleViewModeChange,
        toggleZenMode,
        toggleSidebar
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
      const actualPath = await CreateFile(currentParentPath, newFileName);
      await refreshFileTree();
      await handleFileSelect({ name: newFileName, path: actualPath, isDir: false });
      setShowCreateFileDialog(false);
      setNewFileName("");
      setCreateFileDialogError("");
    } catch (error) {
      if (typeof error === "string" && error === "file_already_exist") {
        setCreateFileDialogError(`File "${newFileName}" already exists in this directory.`);
        return;
      }
      console.error('Error creating file:', error);
      setCreateFileDialogError('Error creating file. Please try again.');
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
      await CreateDirectory(currentParentPath, newFolderName);
      await refreshFileTree();
      setShowCreateFolderDialog(false);
      setNewFolderName("");
      setCreateFolderDialogError("");
    } catch (error) {
      if (typeof error === "string" && error === "folder_already_exist") {
        setCreateFolderDialogError(`Folder "${newFolderName}" already exists in this directory.`);
        return;
      }
      console.error('Error creating folder:', error);
      setCreateFolderDialogError('Error creating folder. Please try again.');
    }
  };

  const handleRenameItem = async (itemPath: string, newName: string, isFile: boolean) => {
    const os = await GetOs();
    let sep = "/";
    if (os !== "linux") sep = "\\";
    const parentPath = itemPath.substring(0, itemPath.lastIndexOf(sep));
    const actualPath = await RenameFile(itemPath, parentPath, newName, isFile);
    await refreshFileTree();
    if (selectedFilePath === itemPath) {
      setSelectedFilePath(actualPath);
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

  const radixThemeProps = uiTheme === 'modern'
    ? { accentColor: 'violet' as const, grayColor: 'slate' as const, radius: 'large' as const, scaling: '100%' as const }
    : uiTheme === 'agrume'
      ? { accentColor: 'orange' as const, grayColor: 'sand' as const, radius: 'medium' as const, scaling: '100%' as const }
      : { accentColor: 'gold' as const, grayColor: 'sand' as const, radius: 'small' as const, scaling: '100%' as const };

  if (!fileTree || isUnlockVaultModalOpen || isUseEncModalOpen) {
    return (
      <RadixTheme {...radixThemeProps} panelBackground="translucent">
        <div className="app-container" data-ui-theme={uiTheme}>
          <div className="welcome-screen">
            <div>
              <img src={appIcon} alt="Tape app icon"/>
              <h1 className="j12">Tape</h1>
            </div>
            <div className="welcome-button">
              <Tooltip content="Select a directory to browse markdown files">
                <Button disabled={isLoading} onClick={() => handleRootOpen()} className="primary-button">
                  <FolderOpen size={20}/>
                  Open a tape box
                </Button>
              </Tooltip>
              {getLastOpenedFolder() && isVaultSecured && (
                <Tooltip content="Unlock your tape box">
                  <Button
                    disabled={isLoading}
                    onClick={() => handleRootOpen(getLastOpenedFolder() ?? undefined)}
                    className="primary-button"
                  >
                    <FolderOpen size={20}/>
                    Unlock your tape box {getLastOpenedFolder()}
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        <UseEncVaultModal
          isOpen={isUseEncModalOpen}
          onSubmit={handleVaultSetup}
          error={useEncModalError}
        />

        <UnlockVaultModal
          isOpen={isUnlockVaultModalOpen}
          onSubmit={handleVaultUnlock}
          onAbort={() => setIsUnlockVaultModalOpen(false)}
          error={unlockVaultModalError}
          dirPath={dirPath}
        />
      </RadixTheme>
    );
  }

  return (
    <RadixTheme {...radixThemeProps}>
      <div className="app-container" data-ui-theme={uiTheme}>

        <div className="header header-extended" ref={mainHeaderRef}>
          <div className="header-left">
            <div className="logo">
              <img src={appIconBck} alt="Tape app icon"/>
              <h1 className="workbench">Tape <small style={{fontSize: 'xx-small'}}>{version}</small></h1>
            </div>
          </div>
          <div className="header-right">
            <SettingsPopover
              fileTree={fileTree}
              isVaultSecured={isVaultSecured}
              uiTheme={uiTheme}
              onUIThemeChange={(t) => setUITheme(t)}
              onEncryptionComplete={async () => {
                await refreshFileTree();
                setIsVaultSecured(true);
              }}
            />
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

        <div className="content">

          <div className="content-header">
            <div className="file-actions">
              <Tooltip content="Hide tree view">
                <button onClick={() => toggleSidebar()} className='action-button'>
                  <PanelTopClose size={16} style={{ rotate: sidebarRotate }} />
                </button>
              </Tooltip>

              <Tooltip content="Select another root">
                <button onClick={() => handleRootOpen()} className="action-button">
                  <FolderOpen size={16} />
                </button>
              </Tooltip>

              {isVaultSecured &&
                <Tooltip content="Lock your tape box">
                  <button onClick={() => lockVault()} className="action-button">
                    <LockIcon size={16} />
                  </button>
                </Tooltip>
              }

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

            <Stats
              original={originalContent}
              edited={fileContent}
              selectedFilePath={selectedFilePath}
              hasUnsavedChanges={hasUnsavedChanges}
              isVaultSecured={isVaultSecured}
            />
          </div>

          <div className="content-container" style={{ height: containerHeight }}>
            <div className="sidebar sidebar-extended" ref={sidebarRef}>
              <FileTree
                fileTree={fileTree}
                isVaultSecured={isVaultSecured}
                uiTheme={uiTheme}
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
              {isLoading ? (
                <div className="loading">Loading...</div>
              ) : viewMode === 'editor' ? (
                  <MarkdownEditor
                    key={`editor-${viewMode}`}
                    content={fileContent}
                    onChange={handleContentChange}
                    filePath={selectedFilePath}
                    containerHeight={containerHeight}
                    scrollRatio={scrollRatioRef.current}
                    onScrollChange={(r) => { scrollRatioRef.current = r; }}
                  />
                ) : (
                    <MarkdownReader
                      content={fileContent}
                      filePath={selectedFilePath}
                      onContentChange={handleContentChange}
                      scrollRatio={scrollRatioRef.current}
                      onScrollChange={(r) => { scrollRatioRef.current = r; }}
                    />
                  )}
            </div>
          </div>

        </div> {/* content */}
      </div>

      {/* Create File Dialog */}
      <Dialog.Root open={showCreateFileDialog} onOpenChange={setShowCreateFileDialog}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Create New File</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {createFileDialogError
              ? <span className="important">{createFileDialogError}</span>
              : <>Enter a name for the new markdown file.</>
            }
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
            {createFolderDialogError
              ? <span className="important">{createFolderDialogError}</span>
              : <>Enter a name for the new folder.</>
            }
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

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onFileSelect={handleFileSelect}
        onSearch={handleSearch}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        version={version}
      />
    </RadixTheme>
  );
}

export default App;
