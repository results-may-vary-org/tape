import React, { useEffect, useRef } from 'react';
import { Dialog, Text, Flex, Separator, Button } from '@radix-ui/themes';
import {Keyboard, Heart, GithubIcon, Codepen, CodeIcon} from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'file' | 'navigation' | 'editor';
}

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose, version }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const shortcuts: ShortcutItem[] = [
    // File operations
    { keys: ['Ctrl', 'S'], description: 'Save current file', category: 'file' },

    // Navigation
    { keys: ['Ctrl', 'H'], description: 'Show this shortcuts modal', category: 'navigation' },
    { keys: ['Ctrl', 'K'], description: 'Open search modal', category: 'navigation' },
    { keys: ['Ctrl', 'Tab'], description: 'Switch between Editor/Reader', category: 'navigation' },
    { keys: ['Tab'], description: 'Navigate between UI elements', category: 'navigation' },
    { keys: ['Shift', 'Tab'], description: 'Navigate between UI elements', category: 'navigation' },
    { keys: ['←↑↓→'], description: 'Navigate between search result', category: 'navigation' },
    { keys: ['Enter'], description: 'Open selected file/folder', category: 'navigation' },
    { keys: ['Esc'], description: 'Close modal', category: 'navigation' },

    // Editor
    { keys: ['Ctrl', 'm'], description: 'Zen mode', category: 'editor' },
    { keys: ['Ctrl', 'Z'], description: 'Undo change', category: 'editor' },
  ];

  // Focus content when modal opens for keyboard navigation
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formatKeys = (keys: string[]) => {
    return keys.map((key, index) => (
      <React.Fragment key={key}>
        {index > 0 && <span className="shortcut-plus">+</span>}
        <kbd className="shortcut-key">{key}</kbd>
      </React.Fragment>
    ));
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  const categoryNames = {
    file: 'File Operations',
    navigation: 'Navigation',
    editor: 'Editor'
  };

  const openGitHub = () => {
    window.open('https://github.com/results-may-vary-org/tape', '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content
        ref={contentRef}
        className="shortcuts-modal"
        maxWidth="500px"
        tabIndex={-1}
      >
        <Dialog.Title style={{ fontFamily: "vt32" }}>
          <Flex align="center" gap="2">
            <Keyboard size={20} />
            Keyboard Shortcuts
          </Flex>
        </Dialog.Title>

        <Dialog.Description size="2" mb="4" className="vt32">
          Master Tape with these keyboard shortcuts.
        </Dialog.Description>

        <div className="shortcuts-content">
          {Object.entries(groupedShortcuts).map(([category, items], index) => (
            <div key={category} className="shortcut-category">
              <Text size="3" weight="bold" mb="2" className="category-title vt32">
                {categoryNames[category as keyof typeof categoryNames]}
              </Text>

              <div className="shortcut-list">
                {items.map((shortcut, index) => (
                  <div key={index} className="shortcut-item">
                    <div className="shortcut-keys">
                      {formatKeys(shortcut.keys)}
                    </div>
                    <div className="shortcut-description vt32">
                      {shortcut.description}
                    </div>
                  </div>
                ))}
              </div>
              {index !== Object.entries(groupedShortcuts).length-1 && <Separator style={{width: "100%", margin: "16px 0"}}/>}
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <Separator style={{ width: "100%", margin: "16px 0" }} />

          <Flex direction="column" gap="3" align="center">
            <Text size="2" className="vt32" style={{ textAlign: 'center' }}>
              <Flex align="center" gap="1" justify="center">
                <Heart size={14} />
                Thanks for using Tape!
              </Flex>
            </Text>

            <Flex align="center" gap="3">
              <Text size="1" color="gray" className="vt32">
                Version {version}
              </Text>

              <Button
                variant="soft"
                size="1"
                onClick={openGitHub}
                className="github-link"
              >
                <CodeIcon size={12} />
                GitHub
              </Button>
            </Flex>
          </Flex>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ShortcutsModal;
