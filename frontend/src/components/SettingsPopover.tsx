import { Popover, Button, Flex, Select } from "@radix-ui/themes"
import { CassetteTape, Citrus, File, Folder, GemIcon, Monitor, Moon, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { SaveTheme, SaveUITheme, TransformTreeIntoMDE1 } from "../../wailsjs/go/main/App";
import type { FileItem, ThemeMode, UIThemeMode } from "../types/types";
import EncTreeConfirmationModal from "./EncTreeConfirmationModal";
import EncTreeDoneModal from "./EncTreeDoneModal";
import UseEncVaultModal from "./UseEncVaultModal";

const SettingsPopover = ({
  fileTree,
  isVaultSecured,
  uiTheme,
  onUIThemeChange,
  onEncryptionComplete,
}: {
  fileTree: FileItem | null;
  isVaultSecured: boolean;
  uiTheme: UIThemeMode;
  onUIThemeChange: (t: UIThemeMode) => void;
  onEncryptionComplete: () => Promise<void>;
}) => {

  const {theme, setTheme} = useTheme();
  const [isSetupEncOpen, setIsSetupEncOpen] = useState<boolean>(false);
  const [setupEncError, setSetupEncError] = useState<string>("");
  const [encIsSucess, setEncIsSucess] = useState<boolean>(false);

  const handleUIThemeChange = async (newUITheme: UIThemeMode) => {
    onUIThemeChange(newUITheme);
    if (fileTree?.path) {
      try {
        await SaveUITheme(fileTree.path, newUITheme);
      } catch (error) {
        console.error("Error saving UI theme:", error);
      }
    }
  };

  const handleThemeChange = async (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (fileTree?.path) {
      try {
        await SaveTheme(fileTree.path, newTheme);
      } catch (error) {
        console.error("Error saving theme:", error);
      }
    }
  };

  const handleEncSetup = async (password: string) => {
    if (!password) {
      setIsSetupEncOpen(false);
      return;
    }

    if (!fileTree || !fileTree.path) {
      setSetupEncError("Error no file tree selected.");
      return;
    }

    const response = await TransformTreeIntoMDE1(password, fileTree.path);

    console.warn("Transform tree response:", response)

    if (typeof response === "string") {
      if (response === "error_setting_crypto") {
        setSetupEncError("Error while setting your password, please retry.");
      } else if (response === "backup_folder_already_exist") {
        setSetupEncError("Error the backup folder already exist.");
      } else {
        setSetupEncError("We encountered an error, contact us for support. Error message:" + response);
      }
    }

    if (response === null) {
      setSetupEncError("");
      setIsSetupEncOpen(false);
      setEncIsSucess(true);
      await onEncryptionComplete();
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button variant="soft">
          <Settings2 size="14"/>
          Settings
        </Button>
      </Popover.Trigger>
      <Popover.Content width="auto">
        <Flex direction="column" gap="2">
          {/* Theme selector */}
          <Select.Root value={theme} onValueChange={(value: ThemeMode) => handleThemeChange(value)}>
            <Select.Trigger className="theme-select-trigger">
              <Flex as="span" align="center" gap="2">
                {theme === "system"
                  ? <Monitor size={16}/>
                  : theme === "dark"
                    ? <Moon size={16}/>
                    : <Sun size={16}/>
                }
                {theme === "system"
                  ? "System"
                  : theme === "dark"
                    ? "Dark"
                    : "Light"
                }
              </Flex>
            </Select.Trigger>
            <Select.Content className="select-content" position="popper">
              <Select.Item value="system" className="select-item">
                <Flex as="span" align="center" gap="2">
                  <Monitor size={16} />
                  System
                </Flex>
              </Select.Item>
              <Select.Item value="light" className="select-item">
                <Flex as="span" align="center" gap="2">
                  <Sun size={16} />
                  Light
                </Flex>
              </Select.Item>
              <Select.Item value="dark" className="select-item">
                <Flex as="span" align="center" gap="2">
                  <Moon size={16} />
                  Dark
                </Flex>
              </Select.Item>
            </Select.Content>
          </Select.Root>
          {/* UI theme preset selector */}
          <Select.Root value={uiTheme} onValueChange={(value: UIThemeMode) => handleUIThemeChange(value)}>
            <Select.Trigger className="theme-select-trigger">
              <Flex as="span" align="center" gap="2">
                {uiTheme === 'original'
                  ? <CassetteTape size={16}/>
                  : uiTheme === 'agrume'
                    ? <Citrus size={16}/>
                    : <GemIcon size={16}/>
                }
                {uiTheme === 'original' ? 'Original' : uiTheme === 'modern' ? 'Modern' : 'Agrume'}
              </Flex>
            </Select.Trigger>
            <Select.Content className="select-content" position="popper">
              <Select.Item value="original" className="select-item">
                <Flex as="span" align="center" gap="2">
                  <CassetteTape size={16}/>
                  Original
                </Flex>
              </Select.Item>
              <Select.Item value="modern" className="select-item">
                <Flex as="span" align="center" gap="2">
                  <GemIcon size={16}/>
                  Modern
                </Flex>
              </Select.Item>
              <Select.Item value="agrume" className="select-item">
                <Flex as="span" align="center" gap="2">
                  <Citrus size="16"/>
                  Agrume
                </Flex>
              </Select.Item>
            </Select.Content>
          </Select.Root>

          {!isVaultSecured && <EncTreeConfirmationModal nextStep={() => setIsSetupEncOpen(true)}/>}
        </Flex>

        <UseEncVaultModal
          isOpen={isSetupEncOpen}
          onSubmit={handleEncSetup}
          error={setupEncError}
        />

        <EncTreeDoneModal isOpen={encIsSucess} onClose={() => setEncIsSucess(false)} />

      </Popover.Content>
    </Popover.Root>
  )
}

export default SettingsPopover;

