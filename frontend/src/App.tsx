import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import '@radix-ui/themes/styles.css';
import {AlertDialog, Theme as RadixTheme } from '@radix-ui/themes';
import {useTheme} from "next-themes";
import FileTree from './components/FileTree';
import MarkdownEditor from './components/MarkdownEditor';
import MarkdownReader from './components/MarkdownReader';
import SearchModal from './components/SearchModal';
import ShortcutsModal from './components/ShortcutsModal';
import { getRadixThemeSettings } from './services/themeService';
import {
  FolderOpen,
  FileText,
  Plus,
  FolderPlus,
  RefreshCw,
  Edit,
  Eye,
  LockIcon,
  Search as SearchIcon
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
import SaveIndicator from "./components/SaveIndicator";
import handleKeys from "./services/handleKeys";
import SettingsPopover from './components/SettingsPopover';
import type { FileItem, ViewMode, ThemeMode, UIThemeMode, SearchResult } from './types/types';
import UseEncVaultModal from './components/UseEncVaultModal';
import UnlockVaultModal from './components/UnlockVaultModal';
import UnsavedChangesModal from './components/UnsavedChangesModal';
import { EventsOn, Quit } from '../wailsjs/runtime/runtime';

function App() {
  const { setTheme } = useTheme();

  const sidebarRef = useRef<HTMLDivElement>(null);
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
  const [alertMDinMDE, setAlertMDinMDE] = useState<boolean>(false);

  // maybe one day we can calculate the height automatically,
  // but for now this is the fastest since none of the elements change height
  const [sidebarHidden, setSidebarHidden] = useState<boolean>(false);
  const [zenMode, setZenMode] = useState<boolean>(false);

  // pending file switch / app-close guard for unsaved changes
  const [pendingFile, setPendingFile] = useState<FileItem | null>(null);
  const [closeRequested, setCloseRequested] = useState<boolean>(false);
  const hasUnsavedChangesRef = useRef(false);
  const quittingRef = useRef(false);

  // keep refs in sync so the runtime close handler reads fresh state
  useEffect(() => { hasUnsavedChangesRef.current = hasUnsavedChanges; }, [hasUnsavedChanges]);

  // app close: main window emits "tape:before-close" (OnBeforeClose returns true to cancel)
  useEffect(() => {
    const off = EventsOn("tape:before-close", () => {
      if (hasUnsavedChangesRef.current && selectedFilePath) {
        quittingRef.current = true;
        setCloseRequested(true);
      } else {
        Quit();
      }
    });
    return off;
  }, [selectedFilePath]);

  const noMDinMDEWarning = async () => {
    window.localStorage.setItem("noMDinMDEWarning", "1");
  }

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
    setSidebarHidden((h) => !h);
  }

  const toggleZenMode = () => {
    setZenMode((z) => {
      const next = !z;
      // entering zen: collapse the sidebar for a distraction-free view
      if (next) setSidebarHidden(true);
      return next;
    });
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

  // actually load and display a file's content
  const loadFile = async (item: FileItem) => {
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

      // alert if a md file is opened in a mde vault
      if (isVaultSecured && item.path.endsWith(".md")) {
        const noMDinMDEWarning = window.localStorage.getItem("noMDinMDEWarning");
        console.log(noMDinMDEWarning)
        if (noMDinMDEWarning !== "1") {
          setAlertMDinMDE(true);
        }
      }

    } catch (error) {
      console.error('Error reading file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // open a file and save the state in the config
  const handleFileSelect = async (item: FileItem) => {
    // if we already have an unsaved file, warn before switching
    if (hasUnsavedChanges && selectedFilePath && item.path !== selectedFilePath) {
      setCloseRequested(false);
      quittingRef.current = false;
      setPendingFile(item);
      return;
    }
    await loadFile(item);
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

  // close the unsaved-changes modal (Cancel)
  const handlePendingClose = () => {
    setPendingFile(null);
    setCloseRequested(false);
  };

  // discard pending action (switch file or quit) without saving
  const handlePendingDiscard = async () => {
    const file = pendingFile;
    const quitting = quittingRef.current;
    setPendingFile(null);
    setCloseRequested(false);

    if (quitting) {
      Quit();
    } else if (file) {
      await loadFile(file);
    }
  };

  // save pending file then switch or quit
  const handlePendingSave = async () => {
    const file = pendingFile;
    const quitting = quittingRef.current;
    setPendingFile(null);
    setCloseRequested(false);

    await handleSave();

    if (quitting) {
      Quit();
    } else if (file) {
      await loadFile(file);
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

  const radixThemeSettings = getRadixThemeSettings(uiTheme);

  if (!fileTree || isUnlockVaultModalOpen || isUseEncModalOpen) {
    return (
      <RadixTheme {...radixThemeSettings} panelBackground="translucent">
      <div className={`app-container${zenMode ? " zen-mode" : ""}`} data-ui-theme={uiTheme}>
          <div className="welcome-screen">
            <div>
              <img src={appIcon} alt="Tape app icon"/>
              <h1>Tape</h1>
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
    <RadixTheme {...radixThemeSettings}>
      <div className={`app-container${zenMode ? " zen-mode" : ""}`} data-ui-theme={uiTheme}>

        <div className="topbar">
          <div className="topbar-left">
            <button className="brand" onClick={() => toggleSidebar()} title="Toggle sidebar">
              <img src={appIconBck} alt="Tape app icon"/>
              <span className="brand-name">Tape</span>
            </button>

            <div className="topbar-actions">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <button className="action-button action-button-primary">
                    <Plus size={14} />
                    <span className="action-button-label">New</span>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="dropdown-content" sideOffset={6} align="start">
                  <DropdownMenu.Item className="dropdown-item" onClick={() => handleCreateFile()}>
                    <FileText size={15} />
                    <span>New file</span>
                    <span className="dropdown-hint">N</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="dropdown-item" onClick={() => handleCreateFolder()}>
                    <FolderPlus size={15} />
                    <span>New folder</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>

              <Tooltip content="Open another folder">
                <button onClick={() => handleRootOpen()} className="action-button">
                  <FolderOpen size={15} />
                </button>
              </Tooltip>

              <Tooltip content="Refresh">
                <button onClick={refreshFileTree} className="action-button">
                  <RefreshCw size={15} />
                </button>
              </Tooltip>

              {isVaultSecured && (
                <Tooltip content="Lock vault">
                  <button onClick={lockVault} className="action-button">
                    <LockIcon size={15} />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          <div className="topbar-center">
            <button className="search-trigger" onClick={() => setIsSearchModalOpen(true)}>
              <SearchIcon size={14} />
              <span className="search-trigger-text">Search notes…</span>
              <kbd className="search-trigger-kbd">Ctrl K</kbd>
            </button>
          </div>

          <div className="topbar-right">
            <SaveIndicator
              original={originalContent}
              edited={fileContent}
              hasUnsavedChanges={hasUnsavedChanges}
              showSavedState
            />

            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === "editor" ? "active" : ""}`}
                onClick={() => handleViewModeChange('editor')}
                title="Editor"
              >
                <Edit size={14} />
              </button>
              <button
                className={`view-toggle-btn ${viewMode === "reader" ? "active" : ""}`}
                onClick={() => handleViewModeChange('reader')}
                title="Reader"
              >
                <Eye size={14} />
              </button>
            </div>

            <SettingsPopover
              fileTree={fileTree}
              isVaultSecured={isVaultSecured}
              uiTheme={uiTheme}
              onUIThemeChange={(theme) => setUITheme(theme)}
              onEncryptionComplete={async () => {
                await refreshFileTree();
                setIsVaultSecured(true);
              }}
            />
          </div>
        </div>

        <div className="content">

          <div className="content-container">
            <div className={`sidebar${sidebarHidden ? " sidebar-hidden" : " sidebar-extended"}`} ref={sidebarRef}>
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

          <Stats
            original={originalContent}
            edited={fileContent}
            selectedFilePath={selectedFilePath}
            hasUnsavedChanges={hasUnsavedChanges}
            isVaultSecured={isVaultSecured}
          />

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

      {/* alert when md in mde vault */}
      <AlertDialog.Root open={alertMDinMDE} onOpenChange={setAlertMDinMDE}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Warning</AlertDialog.Title>
          <AlertDialog.Description size="2">
            This note isn’t encrypted, even though it’s inside an encrypted vault.
            For full encryption, please create notes using the in-app menu.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" onClick={noMDinMDEWarning}>
                Don't notify me anymore
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red">
                Ok
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* warn before switching file or closing app with unsaved changes */}
      <UnsavedChangesModal
        open={!!pendingFile || closeRequested}
        filePath={selectedFilePath}
        quitting={closeRequested}
        onClose={handlePendingClose}
        onSave={handlePendingSave}
        onDiscard={handlePendingDiscard}
      />

    </RadixTheme>
  );
}

export default App;
