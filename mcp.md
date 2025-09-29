# Tape MCP Server

This document explains what the MCP (Model Context Protocol) server does and how to use it with your Tape markdown editor.

## What is MCP?

MCP (Model Context Protocol) is a protocol that enables AI assistants to securely access external data sources and tools. The Tape MCP server allows AI assistants to interact with your markdown notes directly.

## What does the Tape MCP Server do?

The Tape MCP server provides AI assistants with the ability to:

### 📁 File Operations
- **Read files**: Access content from your markdown files
- **Write files**: Create or modify markdown files
- **Create files**: Generate new markdown documents
- **Delete files**: Remove unwanted files
- **List files**: Browse your markdown file structure

### 🗂️ Folder Operations
- **Create folders**: Organize your notes with new directories
- **List directories**: Navigate your folder structure
- **Get file tree**: Access the complete workspace hierarchy

### 🔍 Search Capabilities
- **Content search**: Find specific text across all your markdown files
- **Case-sensitive search**: Option for precise text matching
- **Context retrieval**: Get surrounding text for better understanding

### 🔗 Workspace Integration
- **Root directory access**: Work within your current Tape workspace
- **Relative path support**: Use paths relative to your workspace
- **Configuration integration**: Uses your current Tape folder settings

## Available MCP Tools

### `read_file`
Read content from a markdown file.
```json
{
  "path": "notes/project.md"
}
```

### `write_file`
Write content to a markdown file.
```json
{
  "path": "notes/project.md",
  "content": "# Project Notes\n\nThis is my project documentation."
}
```

### `create_file`
Create a new markdown file with optional initial content.
```json
{
  "path": "new-document",
  "content": "# New Document\n\nStarting content here."
}
```
*Note: .md extension is automatically added if missing*

### `delete_file`
Delete a markdown file.
```json
{
  "path": "notes/old-file.md"
}
```

### `create_folder`
Create a new folder for organizing notes.
```json
{
  "path": "projects/new-project"
}
```

### `list_files`
List all markdown files in the workspace or a specific directory.
```json
{
  "directory": "projects"
}
```
*Note: Directory parameter is optional, defaults to workspace root*

### `search_content`
Search for text across all markdown files.
```json
{
  "query": "project deadline",
  "case_sensitive": false
}
```

## MCP Resources

### `file://workspace`
Provides a JSON representation of your current workspace file tree, including all folders and markdown files with their hierarchical structure.

## How to Use

### 1. Start the MCP Server
In the Tape application:
- Look for the **MCP** button in the header (next to theme selection)
- Click the button to start/stop the server
- When running, you'll see a green "Running" badge
- When stopped, you'll see a gray "Stopped" badge

### 2. Connect Your AI Assistant
Configure your AI assistant to use the Tape MCP server:

**Example with claude desktop:**
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "tape": {
      "command": "/path/to/tape-mcp",
      "args": []
    }
  }
}
```

### 3. Interact Through AI
Once connected, you can ask your AI assistant to:

**Examples:**
- "Read my project notes and summarize them"
- "Create a new file called 'meeting-notes.md' with today's agenda"
- "Search for all mentions of 'deadline' in my files"
- "Organize my notes by creating a folder structure"
- "List all my markdown files in the projects folder"

## Server Information

### Technical Details
- **Protocol Version**: MCP 2024-11-05
- **Communication**: stdin/stdout (not HTTP)
- **Server Name**: tape-markdown-editor
- **Version**: 1.0.0

### Capabilities
- ✅ Tools (7 available)
- ✅ Resources (workspace file tree)
- ✅ Prompts (3 organizational prompts)
- ❌ Sampling (not implemented)
- ❌ Logging (not implemented)

### Prompts Available
The server includes helpful prompts for:
1. **organize_notes**: Help organize and structure markdown notes
2. **create_outline**: Create structured outlines for new documents
3. **summarize_notes**: Create summaries of existing notes

## Security & Privacy

### What the MCP Server Can Access
- ✅ Your current Tape workspace folder and all its contents
- ✅ Only markdown (.md) files for most operations
- ✅ Folder structure within your workspace

### What the MCP Server Cannot Access
- ❌ Files outside your workspace directory
- ❌ System files or directories
- ❌ Hidden files (starting with .)
- ❌ Non-markdown files (except for folder operations)

### Data Privacy
- All Tape communication happens locally
- Tape do not send data to external servers
- By default your files remain on your computer

## Troubleshooting

### Server Won't Start
- Check that you have a workspace folder open in Tape
- Ensure the `tape-mcp` binary exists in your Tape installation directory
- Look at the MCP status button for error information

### AI Assistant Can't Connect
- Verify the MCP server is running (green "Running" status)
- Check your AI assistant's MCP configuration
- Ensure the path to `tape-mcp` is correct in your configuration

### Commands Not Working
- Make sure you have a workspace folder selected in Tape
- Verify file paths are relative to your workspace
- Check that target directories exist for file operations

### Performance Issues
- The server indexes files on demand, so large workspaces might be slower
- Search operations scan all markdown files, which may take time with many files
- Consider organizing files into subfolders for better performance

## Best Practices

### File Organization
- Use descriptive file names for better AI understanding
- Organize related notes in folders
- Keep a consistent naming convention

### Working with AI
- Be specific about file paths when requesting operations
- Use descriptive content when creating new files
- Take advantage of search to help AI find relevant context

### Workspace Management
- Keep your workspace focused on related documents
- Regularly organize files using the AI assistant's help
- Use the file tree resource to help AI understand your structure

---

The Tape MCP server bridges your markdown notes with AI assistants, enabling powerful workflows for note-taking, organization, and content creation. Start the server from the Tape interface and begin enhancing your productivity with AI assistance!
