package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// App struct for MCP server (includes needed methods)
type App struct {
	ctx context.Context
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Config struct for configuration management
type Config struct {
	LastOpenedFolder string `json:"lastOpenedFolder"`
}

type FileItem struct {
	Name     string      `json:"name"`
	Path     string      `json:"path"`
	IsDir    bool        `json:"isDir"`
	Children []*FileItem `json:"children,omitempty"`
}

// LoadConfig loads the configuration from tape.json
func (a *App) LoadConfig() (*Config, error) {
	configPath, err := a.getConfigPath()
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

func (a *App) getConfigPath() (string, error) {
	executable, err := os.Executable()
	if err != nil {
		return "", err
	}
	execDir := filepath.Dir(executable)
	return filepath.Join(execDir, "tape.json"), nil
}

// FileExists checks if a file exists
func (a *App) FileExists(filePath string) bool {
	_, err := os.Stat(filePath)
	return !os.IsNotExist(err)
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

func main() {
	app := &App{}
	app.startup(context.Background())

	// Create and start MCP server
	mcpServer := NewMCPServer(app)

	// Add error handling for stdin/stdout
	if _, err := os.Stdin.Stat(); err != nil {
		log.Fatal("MCP server requires stdin/stdout for communication")
	}

	log.Println("Starting Tape MCP Server...")
	mcpServer.Start()
}