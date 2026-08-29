function handleKeys(
  event: KeyboardEvent,
  setIsSearchModalOpen: (isOpen: boolean) => void,
  setIsShortcutsModalOpen: (isOpen: boolean) => void,
  setIsUseEncModalOpen: (isOpen: boolean) => void,
  setIsUnlockVaultModalOpen: (isOpen: boolean) => void,
  isSearchModalOpen: boolean,
  isShortcutsModalOpen: boolean,
  isUseEncModalOpen: boolean,
  isUnlockVaultModalOpen: boolean,
  viewMode: "editor" | "reader",
  selectedFilePath: string | null,
  hasUnsavedChanges: boolean,
  handleSave: () => void,
  handleViewModeChange: (view: "editor" | "reader") => void,
  toggleZenMode : () => void,
  toggleSidebar: () => void,
  toggleTreeFocus: () => void,
  treeFocused: boolean,
  refocusContent: () => void
) {

  // Esc for modal
  if (event.key === 'Escape') {
    event.preventDefault();
    // close only one modal
    if (isShortcutsModalOpen) {
      setIsShortcutsModalOpen(false);
    } else if (isSearchModalOpen) {
      setIsSearchModalOpen(false);
    } else if (isUseEncModalOpen) {
      setIsUseEncModalOpen(false);
    } else if (isUnlockVaultModalOpen) {
      setIsUnlockVaultModalOpen(false);
    }
    const noOtherOpen = !(isShortcutsModalOpen && isSearchModalOpen && isUseEncModalOpen && isUnlockVaultModalOpen);
    if (noOtherOpen) {
      const inTree = document.activeElement?.closest?.('.file-tree') != null;
      if (inTree) {
        // leave the file tree and bring focus back to the content area
        if (treeFocused) {
          toggleTreeFocus();
        } else {
          refocusContent();
        }
      } else if (viewMode === 'editor') {
        refocusContent();
      }
    }
  }

  // Ctrl+S: Save file
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    if (selectedFilePath && hasUnsavedChanges) {
      handleSave();
    }
    return;
  }

  // Ctrl+K: Open search modal
  if (event.ctrlKey && event.key === 'k') {
    event.preventDefault();
    setIsSearchModalOpen(true);
    return;
  }

  // Ctrl+H: Open help modal
  if (event.ctrlKey && event.key === 'h') {
    event.preventDefault();
    setIsShortcutsModalOpen(true);
    return;
  }

  // Ctrl+Tab: Switch view mode
  if (event.ctrlKey && event.key === 'Tab') {
    event.preventDefault();
    handleViewModeChange(viewMode === "reader" ? "editor" : "reader");
    return;
  }

  // Ctrl + m: Toogle zen mode
  if (event.ctrlKey && event.key === 'm') {
    event.preventDefault();
    toggleZenMode();
    return;
  }

  // Ctrl + n: Toogle sidebar
  if (event.ctrlKey && event.key === 'n') {
    event.preventDefault();
    toggleSidebar();
    return;
  }
}

export default handleKeys;
