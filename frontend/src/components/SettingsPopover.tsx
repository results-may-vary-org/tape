import { Popover, Button, Flex, Select } from "@radix-ui/themes"
import { Monitor, Moon, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { SaveTheme } from "../../wailsjs/go/main/App";
import type { FileItem, ThemeMode } from "../types/types";

const SettingsPopover = ({fileTree} : {fileTree: FileItem | null}) => {

  const { theme, setTheme } = useTheme();

  const handleThemeChange = async (newTheme: ThemeMode) => {
    setTheme(newTheme);

    // Save to config if we have a selected folder
    if (fileTree?.path) {
      try {
        await SaveTheme(fileTree.path, newTheme);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
  };


  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button variant="soft">
          <Settings2 size="14"/>
          Settings
        </Button>
      </Popover.Trigger>
      <Popover.Content width="auto">
       {/* Theme selector */}
        <Select.Root value={theme} onValueChange={(value: ThemeMode) => handleThemeChange(value)}>
          <Select.Trigger className="theme-select-trigger">
            <Flex as="span" align="center" gap="2">
              {theme === 'system'
                ? <Monitor size={16}/>
                : theme === 'dark'
                  ? <Moon size={16}/>
                  : <Sun size={16}/>
              }
              {theme === 'system'
                ? "System"
                : theme === 'dark'
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
      </Popover.Content>
    </Popover.Root>
  )
}

export default SettingsPopover;

