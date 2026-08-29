import React, { useEffect } from 'react';
import { AlertDialog, Button, Flex, Text } from '@radix-ui/themes';

interface ProtectedKeyWarningModalProps {
  open: boolean;
  changedKeys: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

const ProtectedKeyWarningModal: React.FC<ProtectedKeyWarningModalProps> = ({ open, changedKeys, onConfirm, onCancel }) => {
  // swallow Esc in the capture phase so the app-level global handler doesn't act
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onCancel]);

  return (
    <AlertDialog.Root open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title className="important">Dangerous change detected</AlertDialog.Title>
        <AlertDialog.Description size="2">
          <Text as="div" size="2" mb="2">
            You edited or removed one of the keys that controls the encryption of your notes:
          </Text>
          <Text as="div" size="2" mb="2" weight="bold" className="important">
            {changedKeys.join(", ")}
          </Text>
          <Text as="div" size="2" mb="2">
            Changing these values can make your notes impossible to decrypt or lock you out of your
            encrypted vault. Proceed only if you are absolutely sure.
          </Text>
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" color="gray" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="solid" color="red" onClick={onConfirm}>
            Yes I'm really sure
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};

export default ProtectedKeyWarningModal;