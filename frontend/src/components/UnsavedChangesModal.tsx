import { AlertDialog, Button, Flex } from '@radix-ui/themes';

type UnsavedChangesModalProps = {
  open: boolean;
  filePath: string | null;
  quitting: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
};

const UnsavedChangesModal = ({ open, filePath, quitting, onClose, onSave, onDiscard }: UnsavedChangesModalProps) => {
  return (
    <AlertDialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>Unsaved changes</AlertDialog.Title>
        <AlertDialog.Description size="2">
          {filePath
            ? <>This file has unsaved changes that will be lost.</>
            : <>The current file has unsaved changes that will be lost.</>}
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" onClick={onClose}>
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <Button variant="soft" color="red" onClick={onDiscard}>
            {quitting ? "Discard & quit" : "Discard & switch"}
          </Button>
          <Button onClick={onSave}>
            {quitting ? "Save & quit" : "Save & switch"}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};

export default UnsavedChangesModal;
