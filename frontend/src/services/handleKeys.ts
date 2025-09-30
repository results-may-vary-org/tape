function handleKeys(
  event: KeyboardEvent,
  setIsSearchModalOpen: (isOpen: boolean) => void,
  setIsShortcutsModalOpen: (isOpen: boolean) => void,
  setViewMode: (mode: "editor" | "reader") => void,
  actualViewMode: "editor" | "reader",
  selectedFilePath: string | null,
  hasUnsavedChanges: boolean,
  handleSave: () => void
) {

  console.log("key event >>", event.key)

  // Ctrl+S: Save file
  if (event.ctrlKey && event.key === 's' && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    if (selectedFilePath && hasUnsavedChanges) {
      handleSave();
    }
    return;
  }

  // Ctrl+K: Open search modal
  if (event.ctrlKey && event.key === 'k' && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    setIsSearchModalOpen(true);
    return;
  }

  // Ctrl+H: Open help modal
  if (event.ctrlKey && event.key === 'h' && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    setIsShortcutsModalOpen(true);
    return;
  }

  // Ctrl+Tab: Switch view mode
  if (event.ctrlKey && event.key === 'Tab' && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    setViewMode(actualViewMode === "reader" ? "editor" : "reader");
    return;
  }
}

export default handleKeys;
