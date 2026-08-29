import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Text, Flex, Button } from '@radix-ui/themes';
import { GetConfigContent, GetConfigProtectedKeyChanges, HasConfigChanges } from '../../wailsjs/go/main/App';
import ConfigEditor from './ConfigEditor';
import ConfigDiffModal from './ConfigDiffModal';
import ProtectedKeyWarningModal from './ProtectedKeyWarningModal';
import type { LineNumberMode } from '../types/types';

interface ConfigEditorModalProps {
  isOpen: boolean;
  folderPath: string | null;
  vimMode: boolean;
  lineNumberMode: LineNumberMode;
  onClose: () => void;
  onSave: () => void;
}

const ConfigEditorModal: React.FC<ConfigEditorModalProps> = ({ isOpen, folderPath, vimMode, lineNumberMode, onClose, onSave }) => {
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<number>(0);
  const [editorReady, setEditorReady] = useState<boolean>(false);

  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [warningKeys, setWarningKeys] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState<boolean>(false);

  const [validation, setValidation] = useState<{ errors: number; warnings: number }>({ errors: 0, warnings: 0 });

  const handleSaveRef = useRef<() => void>(() => {});
  const onCloseRef = useRef<() => void>(() => {});
  onCloseRef.current = onClose;

  // load the config content each time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setIsLoading(true);
    setEditorReady(false);
    setContent('');
    setOriginalContent('');
    setHasChanges(false);
    setShowWarning(false);
    setShowDiff(false);
    setWarningKeys([]);
    setValidation({ errors: 0, warnings: 0 });
    setSessionId((id) => id + 1);
    if (!folderPath) {
      setIsLoading(false);
      return;
    }
    GetConfigContent(folderPath)
      .then((value) => {
        setContent(value);
        setOriginalContent(value);
        setEditorReady(true);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setIsLoading(false));
  }, [isOpen, folderPath]);

  // recompute whether the config semantically changed (drives the disabled Save button)
  useEffect(() => {
    if (!editorReady) return;
    const id = window.setTimeout(async () => {
      try {
        const changed = await HasConfigChanges(originalContent, content);
        setHasChanges(changed);
      } catch (err) {
        console.error('Error checking config changes:', err);
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [originalContent, content, editorReady]);

  const beginSave = async () => {
    if (!folderPath) return;
    setError('');
    try {
      const [changed, changedKeys] = await Promise.all([
        HasConfigChanges(originalContent, content),
        GetConfigProtectedKeyChanges(originalContent, content),
      ]);
      setHasChanges(changed);
      if (changedKeys.length > 0) {
        setWarningKeys(changedKeys);
        setShowWarning(true);
      } else {
        setShowDiff(true);
      }
    } catch (err) {
      setError(String(err));
    }
  };
  handleSaveRef.current = beginSave;

  // handle Esc to close without saving and Ctrl+S to save.
// Capture phase + stopPropagation so the app-level global shortcuts don't fire.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (!showWarning && !showDiff && (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === 's'))) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'Escape') {
          onCloseRef.current();
        } else {
          handleSaveRef.current();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, showWarning, showDiff]);

  const handleAbort = () => {
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content maxWidth="700px" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <Dialog.Title>Edit configuration</Dialog.Title>
        <Dialog.Description size="2" mb="2">
          Edit the tape.json file. The app will reload to apply your changes.
          <span className="important" style={{ display: 'block', marginTop: 8, fontWeight: 500 }}>
            Be careful when editing: some values control how your data is encrypted. Do not modify the
            <code style={{ fontWeight: 600 }}> check </code>,
            <code style={{ fontWeight: 600 }}> nonceCheck </code> or
            <code style={{ fontWeight: 600 }}> privacyMode </code>
            keys, as changing them can make your notes impossible to decrypt or lock you out of your vault.
          </span>
          {error && (
            <span className="important">{error}</span>
          )}
        </Dialog.Description>

        <Flex direction="column" gap="2" style={{ flex: 1, minHeight: 0 }}>
          {editorReady && folderPath && (
            <ConfigEditor
              key={sessionId}
              content={content}
              onChange={setContent}
              vimMode={vimMode}
              lineNumberMode={lineNumberMode}
              initialContent={originalContent}
              onValidation={setValidation}
            />
          )}
        </Flex>

        <Flex gap="3" mt="4" justify="end" align="center">
          <Text size="1" color="gray" style={{ marginRight: 'auto' }}>
            Esc to abort, Ctrl+S to save
          </Text>
          {validation.errors > 0 && (
            <Text size="1" color="red">
              {validation.errors} error{validation.errors === 1 ? '' : 's'} — cannot save
            </Text>
          )}
          {validation.errors === 0 && validation.warnings > 0 && (
            <Text size="1" color="orange">
              {validation.warnings} warning{validation.warnings === 1 ? '' : 's'}
            </Text>
          )}
          <Button variant="soft" color="gray" onClick={handleAbort}>
            Abort
          </Button>
          <Button onClick={beginSave} disabled={isLoading || !hasChanges || validation.errors > 0}>
            {!hasChanges ? 'No changes' : 'Save'}
          </Button>
        </Flex>
      </Dialog.Content>

      <ProtectedKeyWarningModal
        open={showWarning}
        changedKeys={warningKeys}
        onConfirm={() => {
          setShowWarning(false);
          setShowDiff(true);
        }}
        onCancel={() => setShowWarning(false)}
      />

      <ConfigDiffModal
        isOpen={showDiff}
        folderPath={folderPath}
        originalContent={originalContent}
        editedContent={content}
        hasChanges={hasChanges}
        onClose={() => setShowDiff(false)}
        onSaved={onSave}
      />
    </Dialog.Root>
  );
};

export default ConfigEditorModal;