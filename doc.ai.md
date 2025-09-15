# Tape Markdown Editor - AI Integration Guide

## Overview

Tape is a powerful markdown note-taking application built with Wails (Go + React) that includes built-in MCP (Model Context Protocol) server support. This allows any MCP-compatible AI assistant to interact with your markdown notes, providing seamless AI integration for your note-taking workflow.

## Features

### Core Application Features
- **Markdown Editor & Reader**: Switch between editing and rendered preview modes
- **File Tree Navigation**: Organized file browser with folders-first, alphabetical sorting
- **File Operations**: Create, rename, delete files and folders with existence validation
- **Auto-save**: Ctrl+S to save with visual unsaved changes indicators
- **Persistent Workspace**: Remembers last opened folder via `tape.json` config
- **Context Menus**: Right-click file operations (create, rename, delete)

### AI Integration via MCP Server
- **File Management**: AI can read, write, create, and delete markdown files
- **Content Search**: Full-text search across all markdown files
- **Workspace Navigation**: AI can explore and understand your file structure
- **Smart Organization**: AI can help organize and structure your notes

## MCP Server Capabilities

The Tape MCP server exposes the following capabilities to AI assistants:

### Tools Available

#### File Operations
- **`read_file`**: Read content from any markdown file
  - Parameters: `path` (string) - File path to read
  - Returns: File content as text

- **`write_file`**: Write content to a markdown file
  - Parameters: `path` (string), `content` (string)
  - Returns: Success confirmation

- **`create_file`**: Create a new markdown file
  - Parameters: `path` (string), `content` (string, optional)
  - Auto-adds `.md` extension if missing
  - Returns: Success confirmation

- **`delete_file`**: Delete a markdown file
  - Parameters: `path` (string)
  - Returns: Success confirmation

#### Directory Operations
- **`create_folder`**: Create a new directory
  - Parameters: `path` (string)
  - Returns: Success confirmation

- **`list_files`**: List all markdown files in workspace or specific directory
  - Parameters: `directory` (string, optional)
  - Returns: Formatted list of files with relative paths

#### Content Operations
- **`search_content`**: Search for text across all markdown files
  - Parameters: `query` (string), `case_sensitive` (boolean, optional)
  - Returns: Search results with file paths and line numbers

### Resources Available

- **`file://workspace`**: Complete file tree structure as JSON
  - Provides hierarchical view of all files and folders
  - Updates automatically when workspace changes

### Prompts Available

- **`organize_notes`**: Help organize and structure markdown notes
- **`create_outline`**: Create structured outlines for new documents
- **`summarize_notes`**: Create summaries of existing notes

## Setup Instructions

### 1. Building the Application

```bash
# Build main application
wails build

# Build MCP server (separate binary)
cd cmd/mcp
go build -o ../../build/bin/tape-mcp .
```

### 2. Running the MCP Server

```bash
# Run the MCP server (communicates via stdin/stdout)
./build/bin/tape-mcp
```

### 3. Testing the MCP Server

You can test the server manually by sending JSON-RPC messages via stdin:

```bash
# Initialize the server
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | ./build/bin/tape-mcp

# List available tools
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | ./build/bin/tape-mcp

# Test reading a file (after setting up workspace in main app)
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_files"}}' | ./build/bin/tape-mcp
```

### 3. Configuring AI Assistants

#### For Claude Desktop (MCP Configuration)

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "tape-markdown": {
      "command": "/path/to/your/tape/build/bin/tape-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

#### For Other MCP-Compatible AI Assistants

The server implements MCP protocol version `2024-11-05` and communicates via JSON-RPC over stdin/stdout. Configure your AI assistant to connect to the server executable.

## Usage Examples

### Example AI Interactions

#### Reading and Understanding Your Notes
```
AI: "What notes do I have about machine learning?"
→ Uses search_content tool to find ML-related content
→ Uses read_file to examine relevant files
→ Provides summary of your ML notes
```

#### Creating and Organizing Content
```
AI: "Create a new note about React hooks with an outline"
→ Uses create_file to make "react-hooks.md"
→ Uses write_file to add structured outline
→ Confirms creation and suggests related topics
```

#### Workspace Management
```
AI: "Organize my project notes by topic"
→ Uses list_files to see all notes
→ Uses read_file to understand content
→ Uses create_folder and write_file to reorganize
→ Provides summary of organization changes
```

## File Structure

```
tape/
├── main.go                 # Main Wails application
├── app.go                  # Core app logic
├── cmd/mcp/
│   ├── main.go            # MCP server entry point
│   └── mcp-server.go      # MCP server implementation
├── frontend/              # React frontend
├── build/bin/
│   ├── tape              # Main application
│   └── tape-mcp          # MCP server
├── tape.json             # Configuration file
└── doc.ai.md             # This documentation
```

## Configuration File (tape.json)

The application creates a `tape.json` file in the same directory as the executable:

```json
{
  "lastOpenedFolder": "/path/to/your/notes"
}
```

This allows both the main app and MCP server to work with the same workspace.

## Security Considerations

- The MCP server only operates within your configured workspace directory
- File paths are validated to prevent directory traversal attacks
- Only markdown files (`.md`) are accessible through most operations
- The server requires explicit workspace configuration before operation

## Troubleshooting

### Common Issues

1. **"No workspace configured" error**
   - Open the main Tape application first
   - Select a folder to establish the workspace
   - The `tape.json` config file will be created

2. **MCP server not responding**
   - Ensure the server executable has proper permissions
   - Check that stdin/stdout are available for communication
   - Verify the workspace path exists and is accessible

3. **File operations failing**
   - Check file permissions in the workspace directory
   - Ensure target directories exist before creating files
   - Verify paths don't contain invalid characters

### Debugging

Enable verbose logging by setting environment variables:

```bash
DEBUG=1 ./build/bin/tape-mcp
```

## Development

### Adding New MCP Tools

1. Add the tool definition to `handleToolsList()`
2. Implement the tool logic in `executeTool()`
3. Update this documentation
4. Test with an MCP-compatible AI assistant

### Extending Functionality

The MCP server can be extended to support:
- **Tagging system**: Add metadata to markdown files
- **Link analysis**: Find connections between notes
- **Export functionality**: Convert to other formats
- **Real-time collaboration**: Multi-user editing
- **Plugin system**: Custom AI workflows

## Protocol Compliance

This implementation follows the official MCP specification:
- Protocol version: `2024-11-05`
- JSON-RPC 2.0 communication
- Standard tool, resource, and prompt interfaces
- Proper error handling and response formatting

## Contributing

When contributing to the AI integration features:

1. Follow MCP protocol standards
2. Update tool schemas for any new parameters
3. Add comprehensive error handling
4. Update this documentation
5. Test with multiple AI assistants when possible

---

**Note**: This MCP integration makes your markdown notes accessible to AI assistants. Always review and understand what actions the AI is taking with your files. The server operates with full file system permissions within your workspace.