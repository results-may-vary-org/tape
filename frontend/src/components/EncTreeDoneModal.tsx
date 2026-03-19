import React, { useEffect} from 'react';
import {Dialog, Separator, Text} from '@radix-ui/themes';

interface props {
  isOpen: boolean;
  onClose: () => void
}

const EncTreeDoneModal: React.FC<props> = ({isOpen, onClose}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Content className="search-modal" maxWidth="600px">

        <Dialog.Title style={{fontFamily: "vt32"}} color="gold">
          Your tape box is not fully encrypted!
        </Dialog.Title>

        <Dialog.Description size="2" mb="4" className="vt32">
          <Text>All your notes are now encrypted, including new ones – by default!</Text>
          <br/>
          <Text>
            Don’t lose your password: we won’t be able to help you decrypt your 
            notes if you’ve lost it.
          </Text>
          <br/>
          <Text>
            A backup folder has been created alongside your encrypted notes;
            it contains your original, unencrypted notes. If everything looks
            in order, you can delete it.
          </Text>
          <Separator my="3" size="4" />
          <Text>Learn more <a href="https://github.com/results-may-vary-org/tape/blob/main/README.md" rel="noreferrer">here</a>.</Text>
        </Dialog.Description>

        <Separator style={{width: "100%"}}/>

        <div>
          <div className="search-footer vt32">
            <Text size="1" color="gray">
              Press Enter or Esc to close
            </Text>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default EncTreeDoneModal;

