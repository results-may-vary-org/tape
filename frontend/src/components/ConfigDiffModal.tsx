import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Text, Flex, Button } from '@radix-ui/themes';
import { GetConfigDiff, SaveConfigContent } from '../../wailsjs/go/main/App';
import MarkdownBody from './MarkdownBody';

interface ConfigDiffModalProps {
  isOpen: boolean;
  folderPath: string | null;
  originalContent: string;
  editedContent: string;
  hasChanges: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ConfigDiffModal: React.FC<ConfigDiffModalProps> = ({ isOpen, folderPath, originalContent, editedContent, hasChanges, onClose, onSaved }) => {
  const [diff, setDiff] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const onCloseRef = useRef<() => void>(() => {});
  onCloseRef.current = onClose;

  // load the diff each time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setIsLoading(true);
    setDiff('');
    GetConfigDiff(originalContent, editedContent)
      .then((value) => setDiff(value))
      .catch((err) => setError(String(err)))
      .finally(() => setIsLoading(false));
  }, [isOpen, originalContent, editedContent]);

  const handleConfirm = async () => {
    if (!folderPath || isSaving) return;
    setError('');
    setIsSaving(true);
    try {
      await SaveConfigContent(folderPath, editedContent);
      onSaved();
    } catch (err) {
      setError(String(err));
      setIsSaving(false);
    }
  };
  const handleConfirmRef = useRef(handleConfirm);
  handleConfirmRef.current = handleConfirm;

  // Esc = cancel, Ctrl+S = confirm.
  // Capture phase + stopPropagation so the app-level global shortcuts don't fire.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === 's')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'Escape') {
          onCloseRef.current();
        } else if (hasChanges) {
          handleConfirmRef.current();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, hasChanges]);

  const markdown = diff
    ? '```diff\n' + diff + '\n```'
    : '';

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content maxWidth="700px" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <Dialog.Title>Review changes</Dialog.Title>
        <Dialog.Description size="2" mb="2">
          The app will apply these changes to tape.json and reload once you confirm.
          {error && (
            <div>
              <span className="important">{error}</span>
            </div>
          )}
        </Dialog.Description>

        <Flex direction="column" gap="2" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {isLoading ? (
            <Text size="2" color="gray">Loading diff…</Text>
          ) : !diff ? (
            <Text size="2" color="gray">No changes to display.</Text>
          ) : (
            <div className="markdown-reader" style={{ overflow: 'auto' }}>
              <div className="reader-content">
                <MarkdownBody content={markdown} />
              </div>
            </div>
          )}
        </Flex>

        <Flex gap="3" mt="4" justify="end" align="center">
          <Text size="1" color="gray" style={{ marginRight: 'auto' }}>
            Esc to cancel, Ctrl+S to save
          </Text>
          <Button variant="soft" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || isSaving || !hasChanges}>
            {!hasChanges ? 'No changes' : isSaving ? 'Saving…' : 'Save'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ConfigDiffModal;