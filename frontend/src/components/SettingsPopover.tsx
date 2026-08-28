import { Popover, Button, Flex, Select, Switch, Text } from "@radix-ui/themes"
import { Hash, Monitor, Moon, Rows3, Scan, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { SaveTheme, SaveUITheme, SaveShowFileMTime, SaveShowVim, SaveLineNumberMode, TransformTreeIntoMDE1 } from "../../wailsjs/go/main/App";
import type { FileItem, ThemeMode, UIThemeMode, LineNumberMode } from "../types/types";
import { getThemeModeForUITheme, getUIThemePreset, UI_THEMES } from "../services/themeService";
import EncTreeConfirmationModal from "./EncTreeConfirmationModal";
import EncTreeDoneModal from "./EncTreeDoneModal";
import UseEncVaultModal from "./UseEncVaultModal";

const SettingsPopover = ({
  fileTree,
  isVaultSecured,
  uiTheme,
  showFileMTime,
  vimMode,
  lineNumberMode,
  onShowFileMTimeChange,
  onVimModeChange,
  onLineNumberModeChange,
  onUIThemeChange,
  onEncryptionComplete,
}: {
  fileTree: FileItem | null;
  isVaultSecured: boolean;
  uiTheme: UIThemeMode;
  showFileMTime: boolean;
  vimMode: boolean;
  lineNumberMode: LineNumberMode;
  onShowFileMTimeChange: (show: boolean) => void;
  onVimModeChange: (vim: boolean) => void;
  onLineNumberModeChange: (mode: LineNumberMode) => void;
  onUIThemeChange: (t: UIThemeMode) => void;
  onEncryptionComplete: () => Promise<void>;
}) => {

  const {theme, setTheme} = useTheme();
  const [isSetupEncOpen, setIsSetupEncOpen] = useState<boolean>(false);
  const [setupEncError, setSetupEncError] = useState<string>("");
  const [encIsSucess, setEncIsSucess] = useState<boolean>(false);

  const handleUIThemeChange = async (newUITheme: UIThemeMode) => {
    onUIThemeChange(newUITheme);
    setTheme(getThemeModeForUITheme(newUITheme));
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

  const handleShowFileMTimeChange = async (show: boolean) => {
    onShowFileMTimeChange(show);
    if (fileTree?.path) {
      try {
        await SaveShowFileMTime(fileTree.path, show);
      } catch (error) {
        console.error("Error saving last edited date setting:", error);
      }
    }
  };

  const handleVimModeChange = async (vim: boolean) => {
    onVimModeChange(vim);
    if (fileTree?.path) {
      try {
        await SaveShowVim(fileTree.path, vim);
      } catch (error) {
        console.error("Error saving vim mode setting:", error);
      }
    }
  };

  const handleLineNumberModeChange = async (mode: LineNumberMode) => {
    onLineNumberModeChange(mode);
    if (fileTree?.path) {
      try {
        await SaveLineNumberMode(fileTree.path, mode);
      } catch (error) {
        console.error("Error saving line number mode setting:", error);
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
                {uiTheme === 'default'
                  ? <Monitor size={16}/>
                  : getUIThemePreset(uiTheme).appearance === 'dark'
                    ? <Moon size={16}/>
                    : <Sun size={16}/>
                }
                {getUIThemePreset(uiTheme).label}
              </Flex>
            </Select.Trigger>
            <Select.Content className="select-content" position="popper">
              {UI_THEMES.map((preset) => (
                <Select.Item key={preset.id} value={preset.id} className="select-item">
                  <Flex as="span" align="center" gap="2">
                    {preset.id === 'default'
                      ? <Monitor size={16}/>
                      : preset.appearance === 'dark'
                        ? <Moon size={16}/>
                        : <Sun size={16}/>
                    }
                    {preset.label}
                  </Flex>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          {/* Line number mode selector */}
          <Select.Root value={lineNumberMode} onValueChange={(value: LineNumberMode) => handleLineNumberModeChange(value)}>
            <Select.Trigger className="theme-select-trigger">
              <Flex as="span" align="center" gap="2">
                {lineNumberMode === 'normal'
                  ? <Hash size={16}/>
                  : lineNumberMode === 'relative'
                    ? <Rows3 size={16}/>
                    : <Scan size={16}/>
                }
                {lineNumberMode === 'normal' ? 'Normal' : lineNumberMode === 'relative' ? 'Relative' : 'None'}
              </Flex>
            </Select.Trigger>
            <Select.Content className="select-content" position="popper">
              <Select.Item value="none" className="select-item">
                <Flex as="span" align="center" gap="2">
                  <Scan size={16}/>
                  None
                </Flex>
              </Select.Item>
              <Select.Item value="normal" className="select-item">
                <Flex as="span" align="center" gap="2">
                  <Hash size={16}/>
                  Normal
                </Flex>
              </Select.Item>
              <Select.Item value="relative" className="select-item">
                <Flex as="span" align="center" gap="2">
                  <Rows3 size={16}/>
                  Relative
                </Flex>
              </Select.Item>
            </Select.Content>
          </Select.Root>

          <Flex align="center" justify="between" gap="3">
            <Text size="2">Show last edited date in the file tree</Text>
            <Switch
              checked={showFileMTime}
              onCheckedChange={handleShowFileMTimeChange}
            />
          </Flex>

          <Flex align="center" justify="between" gap="3">
            <Text size="2">Vim keybindings</Text>
            <Switch
              checked={vimMode}
              onCheckedChange={handleVimModeChange}
            />
          </Flex>

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

