import { Popover, Button, Flex, Select } from "@radix-ui/themes"
import { KeyIcon, Monitor, Moon, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { SaveTheme, TransformTreeIntoMDE1 } from "../../wailsjs/go/main/App";
import type { FileItem, ThemeMode } from "../types/types";
import UseEncVaultModal from "./UseEncVaultModal";

const SettingsPopover = ({fileTree, isVaultSecured}: {fileTree: FileItem | null, isVaultSecured: boolean}) => {

  const {theme, setTheme} = useTheme();
  const [isSetupEncOpen, setIsSetupEncOpen] = useState<boolean>(false);
  const [setupEncError, setSetupEncError] = useState<string>("");

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
    }
    if (!fileTree || !fileTree.path) {
      setSetupEncError("Error no file tree selected.");
      return;
    }
    const response = await TransformTreeIntoMDE1(password, fileTree.path);
    if (typeof response === "string" && response === "error_setting_crypto") {
      setSetupEncError("Error while setting your password, please retry.");
      return;
    } else {
      console.log("@@@@", response)
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
          {!isVaultSecured &&
            <Button onClick={() => setIsSetupEncOpen(true)}>
              <KeyIcon size={16} />
              Encrypt your tape box
            </Button>
          }
        </Flex>

        <UseEncVaultModal
          isOpen={isSetupEncOpen}
          onSubmit={handleEncSetup}
          error={setupEncError}
        />

      </Popover.Content>
    </Popover.Root>
  )
}

export default SettingsPopover;

