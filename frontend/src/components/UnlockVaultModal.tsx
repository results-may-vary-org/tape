import React, { useState, useEffect, useRef} from 'react';
import {Dialog, TextField, Text, Flex, Separator, IconButton, Button} from '@radix-ui/themes';
import {EyeClosedIcon, EyeIcon} from 'lucide-react';

interface UnlockVaultModalProps {
  isOpen: boolean;
  onSubmit: (password: string) => void;
  error: string;
}

const UnlockVaultModal: React.FC<UnlockVaultModalProps> = ({isOpen, onSubmit, error}) => {
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
    <Dialog.Root open={isOpen} onOpenChange={() => null}>
      <Dialog.Content className="search-modal" maxWidth="600px">

        <Dialog.Title style={{fontFamily: "vt32"}}>Unlock your tape box.</Dialog.Title>

        <Dialog.Description size="2" mb="4" className="vt32">
          {!error && (
            <p>Enter your password to unlock your tape box.</p>
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
              placeholder="Your password"
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
            <Button onClick={() => onSubmit(value)}>Unlock</Button>
          </Flex>
          <Separator style={{width: "100%"}}/>
        </Flex>

        <div>
          <div className="search-footer vt32">
            <Text size="1" color="gray">
              Press Enter to unlock, Esc to close
            </Text>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default UnlockVaultModal;
