package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type MCPServer struct {
	app *App
}

type MCPRequest struct {
	JSONRPC string                 `json:"jsonrpc"`
	ID      interface{}            `json:"id"`
	Method  string                 `json:"method"`
	Params  map[string]interface{} `json:"params,omitempty"`
}

type MCPResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id,omitempty"`
	Result  interface{} `json:"result,omitempty"`
	Error   *MCPError   `json:"error,omitempty"`
}

type MCPError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type MCPTool struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	InputSchema map[string]interface{} `json:"inputSchema"`
}

type MCPResource struct {
	URI         string `json:"uri"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	MimeType    string `json:"mimeType,omitempty"`
}

func NewMCPServer(app *App) *MCPServer {
	return &MCPServer{app: app}
}

func (s *MCPServer) Start() {
	for {
		var request MCPRequest
		decoder := json.NewDecoder(os.Stdin)
		if err := decoder.Decode(&request); err != nil {
			if err == io.EOF {
				break
			}
			s.sendError(request.ID, -32700, "Parse error", nil)
			continue
		}

		s.handleRequest(request)
	}
}

func (s *MCPServer) handleRequest(request MCPRequest) {
	switch request.Method {
	case "initialize":
		s.handleInitialize(request)
	case "tools/list":
		s.handleToolsList(request)
	case "tools/call":
		s.handleToolsCall(request)
	case "resources/list":
		s.handleResourcesList(request)
	case "resources/read":
		s.handleResourcesRead(request)
	case "prompts/list":
		s.handlePromptsList(request)
	default:
		s.sendError(request.ID, -32601, "Method not found", nil)
	}
}

func (s *MCPServer) handleInitialize(request MCPRequest) {
	result := map[string]interface{}{
		"protocolVersion": "2024-11-05",
		"serverInfo": map[string]interface{}{
			"name":    "tape-markdown-editor",
			"version": "1.0.0",
		},
		"capabilities": map[string]interface{}{
			"tools": map[string]interface{}{
				"listChanged": false,
			},
			"resources": map[string]interface{}{
				"subscribe":   false,
				"listChanged": false,
			},
			"prompts": map[string]interface{}{
				"listChanged": false,
			},
		},
	}
	s.sendResponse(request.ID, result)
}

func (s *MCPServer) handleToolsList(request MCPRequest) {
	tools := []MCPTool{
		{
			Name:        "read_file",
			Description: "Read the content of a markdown file",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"path": map[string]interface{}{
						"type":        "string",
						"description": "Path to the markdown file to read",
					},
				},
				"required": []string{"path"},
			},
		},
		{
			Name:        "write_file",
			Description: "Write content to a markdown file",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"path": map[string]interface{}{
						"type":        "string",
						"description": "Path to the markdown file to write",
					},
					"content": map[string]interface{}{
						"type":        "string",
						"description": "Content to write to the file",
					},
				},
				"required": []string{"path", "content"},
			},
		},
		{
			Name:        "create_file",
			Description: "Create a new markdown file",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"path": map[string]interface{}{
						"type":        "string",
						"description": "Path for the new markdown file (will add .md extension if missing)",
					},
					"content": map[string]interface{}{
						"type":        "string",
						"description": "Initial content for the file",
						"default":     "",
					},
				},
				"required": []string{"path"},
			},
		},
		{
			Name:        "delete_file",
			Description: "Delete a markdown file",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"path": map[string]interface{}{
						"type":        "string",
						"description": "Path to the markdown file to delete",
					},
				},
				"required": []string{"path"},
			},
		},
		{
			Name:        "list_files",
			Description: "List all markdown files in the current workspace",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"directory": map[string]interface{}{
						"type":        "string",
						"description": "Directory to list files from (optional, uses current workspace if not provided)",
					},
				},
			},
		},
		{
			Name:        "create_folder",
			Description: "Create a new folder",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"path": map[string]interface{}{
						"type":        "string",
						"description": "Path for the new folder",
					},
				},
				"required": []string{"path"},
			},
		},
		{
			Name:        "search_content",
			Description: "Search for text content across all markdown files",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"query": map[string]interface{}{
						"type":        "string",
						"description": "Text to search for",
					},
					"case_sensitive": map[string]interface{}{
						"type":        "boolean",
						"description": "Whether search should be case sensitive",
						"default":     false,
					},
				},
				"required": []string{"query"},
			},
		},
	}

	result := map[string]interface{}{
		"tools": tools,
	}
	s.sendResponse(request.ID, result)
}

func (s *MCPServer) handleToolsCall(request MCPRequest) {
	toolName, ok := request.Params["name"].(string)
	if !ok {
		s.sendError(request.ID, -32602, "Invalid params: missing tool name", nil)
		return
	}

	arguments, ok := request.Params["arguments"].(map[string]interface{})
	if !ok {
		arguments = make(map[string]interface{})
	}

	result, err := s.executeTool(toolName, arguments)
	if err != nil {
		s.sendError(request.ID, -32603, err.Error(), nil)
		return
	}

	response := map[string]interface{}{
		"content": []map[string]interface{}{
			{
				"type": "text",
				"text": result,
			},
		},
	}
	s.sendResponse(request.ID, response)
}

func (s *MCPServer) executeTool(toolName string, arguments map[string]interface{}) (string, error) {
	// Get current workspace from config
	config, err := s.app.LoadConfig()
	if err != nil || config.LastOpenedFolder == "" {
		return "", fmt.Errorf("no workspace configured. Please open a folder first")
	}
	workspace := config.LastOpenedFolder

	switch toolName {
	case "read_file":
		path, ok := arguments["path"].(string)
		if !ok {
			return "", fmt.Errorf("path parameter is required")
		}

		// Make path absolute if relative
		if !filepath.IsAbs(path) {
			path = filepath.Join(workspace, path)
		}

		content, err := s.app.ReadFile(path)
		if err != nil {
			return "", fmt.Errorf("failed to read file: %v", err)
		}
		return content, nil

	case "write_file":
		path, ok := arguments["path"].(string)
		if !ok {
			return "", fmt.Errorf("path parameter is required")
		}
		content, ok := arguments["content"].(string)
		if !ok {
			return "", fmt.Errorf("content parameter is required")
		}

		// Make path absolute if relative
		if !filepath.IsAbs(path) {
			path = filepath.Join(workspace, path)
		}

		err := s.app.WriteFile(path, content)
		if err != nil {
			return "", fmt.Errorf("failed to write file: %v", err)
		}
		return fmt.Sprintf("Successfully wrote content to %s", path), nil

	case "create_file":
		path, ok := arguments["path"].(string)
		if !ok {
			return "", fmt.Errorf("path parameter is required")
		}
		content, _ := arguments["content"].(string)

		// Make path absolute if relative
		if !filepath.IsAbs(path) {
			path = filepath.Join(workspace, path)
		}

		// Ensure .md extension
		if !strings.HasSuffix(strings.ToLower(path), ".md") {
			path += ".md"
		}

		// Check if file exists
		if s.app.FileExists(path) {
			return "", fmt.Errorf("file already exists: %s", path)
		}

		err := s.app.CreateFile(path)
		if err != nil {
			return "", fmt.Errorf("failed to create file: %v", err)
		}

		if content != "" {
			err = s.app.WriteFile(path, content)
			if err != nil {
				return "", fmt.Errorf("failed to write initial content: %v", err)
			}
		}

		return fmt.Sprintf("Successfully created file: %s", path), nil

	case "delete_file":
		path, ok := arguments["path"].(string)
		if !ok {
			return "", fmt.Errorf("path parameter is required")
		}

		// Make path absolute if relative
		if !filepath.IsAbs(path) {
			path = filepath.Join(workspace, path)
		}

		err := s.app.DeleteFile(path)
		if err != nil {
			return "", fmt.Errorf("failed to delete file: %v", err)
		}
		return fmt.Sprintf("Successfully deleted file: %s", path), nil

	case "create_folder":
		path, ok := arguments["path"].(string)
		if !ok {
			return "", fmt.Errorf("path parameter is required")
		}

		// Make path absolute if relative
		if !filepath.IsAbs(path) {
			path = filepath.Join(workspace, path)
		}

		err := s.app.CreateDirectory(path)
		if err != nil {
			return "", fmt.Errorf("failed to create folder: %v", err)
		}
		return fmt.Sprintf("Successfully created folder: %s", path), nil

	case "list_files":
		directory, ok := arguments["directory"].(string)
		if !ok || directory == "" {
			directory = workspace
		} else if !filepath.IsAbs(directory) {
			directory = filepath.Join(workspace, directory)
		}

		files, err := s.listMarkdownFiles(directory)
		if err != nil {
			return "", fmt.Errorf("failed to list files: %v", err)
		}

		var result strings.Builder
		result.WriteString(fmt.Sprintf("Markdown files in %s:\n\n", directory))
		for _, file := range files {
			relPath, _ := filepath.Rel(workspace, file)
			result.WriteString(fmt.Sprintf("- %s\n", relPath))
		}

		return result.String(), nil

	case "search_content":
		query, ok := arguments["query"].(string)
		if !ok {
			return "", fmt.Errorf("query parameter is required")
		}
		caseSensitive, _ := arguments["case_sensitive"].(bool)

		results, err := s.searchContent(workspace, query, caseSensitive)
		if err != nil {
			return "", fmt.Errorf("failed to search content: %v", err)
		}

		return results, nil

	default:
		return "", fmt.Errorf("unknown tool: %s", toolName)
	}
}

func (s *MCPServer) listMarkdownFiles(directory string) ([]string, error) {
	var files []string

	err := filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && strings.HasSuffix(strings.ToLower(info.Name()), ".md") {
			files = append(files, path)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	sort.Strings(files)
	return files, nil
}

func (s *MCPServer) searchContent(directory, query string, caseSensitive bool) (string, error) {
	files, err := s.listMarkdownFiles(directory)
	if err != nil {
		return "", err
	}

	var results strings.Builder
	results.WriteString(fmt.Sprintf("Search results for \"%s\":\n\n", query))

	matchCount := 0
	searchQuery := query
	if !caseSensitive {
		searchQuery = strings.ToLower(query)
	}

	for _, filePath := range files {
		content, err := s.app.ReadFile(filePath)
		if err != nil {
			continue
		}

		searchContent := content
		if !caseSensitive {
			searchContent = strings.ToLower(content)
		}

		if strings.Contains(searchContent, searchQuery) {
			relPath, _ := filepath.Rel(directory, filePath)
			results.WriteString(fmt.Sprintf("📄 **%s**\n", relPath))

			// Show context around matches
			lines := strings.Split(content, "\n")
			for i, line := range lines {
				searchLine := line
				if !caseSensitive {
					searchLine = strings.ToLower(line)
				}

				if strings.Contains(searchLine, searchQuery) {
					results.WriteString(fmt.Sprintf("  Line %d: %s\n", i+1, line))
					matchCount++
				}
			}
			results.WriteString("\n")
		}
	}

	if matchCount == 0 {
		results.WriteString("No matches found.\n")
	} else {
		results.WriteString(fmt.Sprintf("Found %d matches.\n", matchCount))
	}

	return results.String(), nil
}

func (s *MCPServer) handleResourcesList(request MCPRequest) {
	// Get current workspace
	config, err := s.app.LoadConfig()
	if err != nil || config.LastOpenedFolder == "" {
		s.sendError(request.ID, -32603, "No workspace configured", nil)
		return
	}

	resources := []MCPResource{
		{
			URI:         "file://workspace",
			Name:        "Current Workspace",
			Description: fmt.Sprintf("File tree of the current workspace: %s", config.LastOpenedFolder),
			MimeType:    "application/json",
		},
	}

	result := map[string]interface{}{
		"resources": resources,
	}
	s.sendResponse(request.ID, result)
}

func (s *MCPServer) handleResourcesRead(request MCPRequest) {
	uri, ok := request.Params["uri"].(string)
	if !ok {
		s.sendError(request.ID, -32602, "Invalid params: missing uri", nil)
		return
	}

	if uri == "file://workspace" {
		config, err := s.app.LoadConfig()
		if err != nil || config.LastOpenedFolder == "" {
			s.sendError(request.ID, -32603, "No workspace configured", nil)
			return
		}

		fileTree, err := s.app.GetDirectoryTree(config.LastOpenedFolder)
		if err != nil {
			s.sendError(request.ID, -32603, fmt.Sprintf("Failed to get file tree: %v", err), nil)
			return
		}

		treeJSON, err := json.MarshalIndent(fileTree, "", "  ")
		if err != nil {
			s.sendError(request.ID, -32603, "Failed to serialize file tree", nil)
			return
		}

		result := map[string]interface{}{
			"contents": []map[string]interface{}{
				{
					"uri":      uri,
					"mimeType": "application/json",
					"text":     string(treeJSON),
				},
			},
		}
		s.sendResponse(request.ID, result)
		return
	}

	s.sendError(request.ID, -32602, "Unknown resource URI", nil)
}

func (s *MCPServer) handlePromptsList(request MCPRequest) {
	prompts := []map[string]interface{}{
		{
			"name":        "organize_notes",
			"description": "Help organize and structure markdown notes",
			"arguments": []map[string]interface{}{
				{
					"name":        "topic",
					"description": "The topic or theme to organize notes around",
					"required":    false,
				},
			},
		},
		{
			"name":        "create_outline",
			"description": "Create a structured outline for a new document",
			"arguments": []map[string]interface{}{
				{
					"name":        "title",
					"description": "Title of the document",
					"required":    true,
				},
				{
					"name":        "type",
					"description": "Type of document (article, report, notes, etc.)",
					"required":    false,
				},
			},
		},
		{
			"name":        "summarize_notes",
			"description": "Create a summary of existing notes",
			"arguments": []map[string]interface{}{
				{
					"name":        "files",
					"description": "Specific files to summarize (optional)",
					"required":    false,
				},
			},
		},
	}

	result := map[string]interface{}{
		"prompts": prompts,
	}
	s.sendResponse(request.ID, result)
}

func (s *MCPServer) sendResponse(id interface{}, result interface{}) {
	response := MCPResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  result,
	}
	json.NewEncoder(os.Stdout).Encode(response)
}

func (s *MCPServer) sendError(id interface{}, code int, message string, data interface{}) {
	response := MCPResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error: &MCPError{
			Code:    code,
			Message: message,
			Data:    data,
		},
	}
	json.NewEncoder(os.Stdout).Encode(response)
}