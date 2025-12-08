function handleKeys(
  event: KeyboardEvent,
  setIsSearchModalOpen: (isOpen: boolean) => void,
  setIsShortcutsModalOpen: (isOpen: boolean) => void,
  actualViewMode: "editor" | "reader",
  selectedFilePath: string | null,
  hasUnsavedChanges: boolean,
  handleSave: () => void,
  handleViewModeChange: (view: "editor" | "reader") => void,
) {

  console.log("key event >>", event.key)

  if (event.ctrlKey && event.key === 'z') {
    return;
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
    handleViewModeChange(actualViewMode === "reader" ? "editor" : "reader");
    return;
  }
}

export default handleKeys;
