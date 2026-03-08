import React, { useState, useEffect, useRef, Fragment } from 'react';
import {Dialog, TextField, Text, Flex, Separator, IconButton, Button} from '@radix-ui/themes';
import {EyeClosedIcon, EyeIcon} from 'lucide-react';

interface UseEncVaultModalProps {
  isOpen: boolean;
  onSubmit: (password: string) => void;
  onClose: () => void;
  error: string;
}

const UseEncVaultModal: React.FC<UseEncVaultModalProps> = ({isOpen, onSubmit, onClose, error}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [see, setSee] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");

  // toggle the password visibility
  // and handle the cursor position
  const toggleVisibility = () => {
    const input = inputRef.current;
    if (!input) return;
    const cursorPos = input.selectionStart;
    setSee(!see);
    setTimeout(() => {
      input.setSelectionRange(cursorPos, cursorPos);
      input.focus();
    }, 0);
  };

  // reset value on open
  useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  // handle key shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onSubmit("");
          break;
        case 'Enter':
          e.preventDefault();
          onSubmit(value);
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSubmit, value]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={() => onSubmit("")}>
      <Dialog.Content className="search-modal" maxWidth="600px">

        <Dialog.Title style={{fontFamily: "vt32"}}>Do you want to create an encrypted tape box?</Dialog.Title>

        <Dialog.Description size="2" mb="4" className="vt32">
          {!error && (
            <Fragment>
              <p>
                Enter a password if you want to create a secured tape box where all the content of your files are encrypted by default.
              </p>
              <p className="important">
                If you lost your password any data can't be recovered.
              </p>
            </Fragment>
          )}
          {error && (
            <p className="important">{error}</p>
          )}
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Flex direction="row" align="center" gap="3">
            <TextField.Root
              ref={inputRef}
              autoFocus
              value={value}
              type={see ? "text" : "password"}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
              placeholder="A strong password"
              className="search-input"
              size="3"
              style={{flex: 1}}
            >
              <TextField.Slot className="hover">
                <IconButton onClick={toggleVisibility} variant="ghost">
                  {see
                    ? <EyeIcon height="16" width="16" />
                    : <EyeClosedIcon height="16" width="16" />
                  }
                </IconButton>
              </TextField.Slot>
            </TextField.Root>
            <Button onClick={() => onSubmit(value)}>Create</Button>
            <Button onClick={() => onSubmit("")}>Skip</Button>
          </Flex>
          <Separator style={{width: "100%"}}/>
        </Flex>

        <div>
          <div className="search-footer vt32">
            <Text size="1" color="gray">
              Press Enter to create, Esc to close
            </Text>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default UseEncVaultModal;
