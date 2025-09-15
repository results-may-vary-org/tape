package main

import (
	"context"
	"encoding/json"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type FileItem struct {
	Name     string      `json:"name"`
	Path     string      `json:"path"`
	IsDir    bool        `json:"isDir"`
	Children []*FileItem `json:"children,omitempty"`
}

type Config struct {
	LastOpenedFolder string   `json:"lastOpenedFolder"`
	ViewMode         string   `json:"viewMode"`
	Theme            string   `json:"theme"`
}

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// OpenDirectoryDialog opens a directory selection dialog
func (a *App) OpenDirectoryDialog() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select directory for markdown notes",
	})
}

// OpenFileDialog opens a file selection dialog for markdown files
func (a *App) OpenFileDialog() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select markdown file",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Markdown Files",
				Pattern:     "*.md",
			},
		},
	})
}

// GetDirectoryTree returns the file tree structure for a given directory
func (a *App) GetDirectoryTree(dirPath string) (*FileItem, error) {
	info, err := os.Stat(dirPath)
	if err != nil {
		return nil, err
	}

	root := &FileItem{
		Name:  info.Name(),
		Path:  dirPath,
		IsDir: info.IsDir(),
	}

	if info.IsDir() {
		err = a.buildFileTree(root)
		if err != nil {
			return nil, err
		}
	}

	return root, nil
}

// buildFileTree recursively builds the file tree
func (a *App) buildFileTree(parent *FileItem) error {
	entries, err := os.ReadDir(parent.Path)
	if err != nil {
		return err
	}

	var children []*FileItem

	for _, entry := range entries {
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		fullPath := filepath.Join(parent.Path, entry.Name())
		child := &FileItem{
			Name:  entry.Name(),
			Path:  fullPath,
			IsDir: entry.IsDir(),
		}

		if entry.IsDir() {
			a.buildFileTree(child)
			children = append(children, child)
		} else if strings.HasSuffix(strings.ToLower(entry.Name()), ".md") {
			children = append(children, child)
		}
	}

	// Sort children: directories first, then files, all alphabetically
	sort.Slice(children, func(i, j int) bool {
		// If one is dir and other is file, dir comes first
		if children[i].IsDir != children[j].IsDir {
			return children[i].IsDir
		}
		// If both are same type, sort alphabetically (case insensitive)
		return strings.ToLower(children[i].Name) < strings.ToLower(children[j].Name)
	})

	parent.Children = children
	return nil
}

// ReadFile reads the content of a file
func (a *App) ReadFile(filePath string) (string, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// WriteFile writes content to a file
func (a *App) WriteFile(filePath, content string) error {
	return os.WriteFile(filePath, []byte(content), 0644)
}

// CreateFile creates a new markdown file
func (a *App) CreateFile(filePath string) error {
	if !strings.HasSuffix(strings.ToLower(filePath), ".md") {
		filePath += ".md"
	}

	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	return nil
}

// CreateDirectory creates a new directory
func (a *App) CreateDirectory(dirPath string) error {
	return os.MkdirAll(dirPath, 0755)
}

// DeleteFile deletes a file
func (a *App) DeleteFile(filePath string) error {
	return os.Remove(filePath)
}

// DeleteDirectory deletes a directory and all its contents
func (a *App) DeleteDirectory(dirPath string) error {
	return os.RemoveAll(dirPath)
}

// RenameFile renames a file or directory
func (a *App) RenameFile(oldPath, newPath string) error {
	return os.Rename(oldPath, newPath)
}

// FileExists checks if a file exists
func (a *App) FileExists(filePath string) bool {
	_, err := os.Stat(filePath)
	return !os.IsNotExist(err)
}

// GetFileInfo returns file information
func (a *App) GetFileInfo(filePath string) (fs.FileInfo, error) {
	return os.Stat(filePath)
}

// getConfigPath returns the path to the config file
func (a *App) getConfigPath(folderPath string) (string, error) {
	if folderPath == "" {
		// Fallback to old behavior if no folder is selected
		executable, err := os.Executable()
		if err != nil {
			return "", err
		}
		execDir := filepath.Dir(executable)
		return filepath.Join(execDir, "tape.json"), nil
	}
	return filepath.Join(folderPath, "tape.json"), nil
}

// LoadConfig loads the configuration from tape.json
func (a *App) LoadConfig(folderPath string) (*Config, error) {
	configPath, err := a.getConfigPath(folderPath)
	if err != nil {
		return &Config{}, err
	}

	// If config file doesn't exist, return empty config
	if !a.FileExists(configPath) {
		return &Config{}, nil
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return &Config{}, err
	}

	var config Config
	err = json.Unmarshal(data, &config)
	if err != nil {
		return &Config{}, err
	}

	return &config, nil
}

// SaveConfig saves the configuration to tape.json
func (a *App) SaveConfig(config *Config, folderPath string) error {
	configPath, err := a.getConfigPath(folderPath)
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, data, 0644)
}

// SaveLastOpenedFolder saves the last opened folder to config
func (a *App) SaveLastOpenedFolder(folderPath string) error {
	config, err := a.LoadConfig(folderPath)
	if err != nil {
		config = &Config{}
	}

	config.LastOpenedFolder = folderPath
	return a.SaveConfig(config, folderPath)
}

// SaveViewMode saves the view mode (editor/reader) to config
func (a *App) SaveViewMode(folderPath string, viewMode string) error {
	config, err := a.LoadConfig(folderPath)
	if err != nil {
		config = &Config{}
	}

	config.ViewMode = viewMode
	config.LastOpenedFolder = folderPath
	return a.SaveConfig(config, folderPath)
}

// SaveTheme saves the theme setting to config
func (a *App) SaveTheme(folderPath string, theme string) error {
	config, err := a.LoadConfig(folderPath)
	if err != nil {
		config = &Config{}
	}

	config.Theme = theme
	config.LastOpenedFolder = folderPath
	return a.SaveConfig(config, folderPath)
}

// LoadInitialConfig loads config from old location for initial app startup
func (a *App) LoadInitialConfig() (*Config, error) {
	// Try to load from old location first (for migration)
	executable, err := os.Executable()
	if err != nil {
		return &Config{}, err
	}
	execDir := filepath.Dir(executable)
	oldConfigPath := filepath.Join(execDir, "tape.json")

	if a.FileExists(oldConfigPath) {
		data, err := os.ReadFile(oldConfigPath)
		if err != nil {
			return &Config{}, err
		}

		var config Config
		err = json.Unmarshal(data, &config)
		if err != nil {
			return &Config{}, err
		}

		return &config, nil
	}

	return &Config{}, nil
}
