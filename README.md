<p align="center">
  <a href="https://github.com/results-may-vary-org/tape">
    <img alt="Tape" src="assets/tape-icon.png" width="220"/>
  </a>
</p>
<h1 align="center">Tape <i>- a markdown editor with no bloat</i></h1>

<img alt="Static Badge" src="https://img.shields.io/badge/Still_maintained-Yes_%3A)-green">

## Description

A powerful markdown note-taking application built with Wails that includes built-in MCP (Model Context Protocol) server support for seamless AI integration.

### Main Features

- **Markdown Editor & Reader**: Switch between editing and rendered preview modes with live preview
- **File Tree Navigation**: Organized file browser with folders-first, alphabetical sorting
- **File Operations**: Create, rename, delete files and folders with existence validation
- **Auto-save**: Ctrl+S to save with visual unsaved changes indicators
- **Persistent Workspace**: Remembers last opened folder via `tape.json` config
- **Context Menus**: Right-click file operations (create, rename, delete)
- **Full-text Search**: Search across all markdown files with fuzzy matching
- **AI Integration**: Built-in MCP server for AI assistant compatibility
- **Cross-platform**: Available for Linux, Windows, and macOS

### History

Tape is designed as a no-bloat markdown editor that focuses on simplicity and efficiency. Built with modern technologies (Go + React + Wails) to provide a native desktop experience while maintaining the flexibility of web technologies.

## Installation

### Linux
- Download via [AUR (Arch Linux)](https://aur.archlinux.org/packages/tape-bin)
- Download the `.deb`, `.rpm`, or `.apk` package from [releases](https://github.com/results-may-vary-org/tape/releases)
- Install manually:
  ```bash
  # For Debian/Ubuntu
  sudo dpkg -i tape_*.deb

  # For Red Hat/Fedora
  sudo rpm -i tape_*.rpm

  # For Alpine Linux
  sudo apk add --allow-untrusted tape_*.apk
  ```

### Windows
- Download the installer from [releases](https://github.com/results-may-vary-org/tape/releases)
- Run the `tape-windows-amd64-*.exe` installer

### macOS
- Download the `.app` bundle from [releases](https://github.com/results-may-vary-org/tape/releases)
- Drag to Applications folder

### Build from Source
```bash
# Prerequisites: Go 1.23+, Node.js, Wails v2.9.0+
git clone https://github.com/results-may-vary-org/tape.git
cd tape
wails build
```

## Configuration

| Feature | Description | Usage |
|---------|-------------|--------|
| Workspace | Root folder for your markdown notes | Select via "Open Folder" dialog |
| View Mode | Switch between editor and reader modes | Toggle button in header |
| Theme | Light/dark theme support | Auto-detected from system |
| Auto-save | Automatic saving with visual indicators | Ctrl+S or auto-save on changes |
| File Search | Full-text search across all files | Search bar with fuzzy matching |
| MCP Server | AI assistant integration | Runs automatically when configured |

![Tape Screenshot](assets/tape-screenshot.png)

## AI Integration (MCP Server)

Tape includes a built-in MCP server that allows AI assistants to interact with your markdown notes:

### Available Tools
- **File Operations**: Read, write, create, delete markdown files
- **Directory Operations**: Create folders, list files
- **Content Search**: Full-text search across all markdown files
- **Workspace Navigation**: Explore and understand file structure

### Setup for Claude Desktop
Add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "tape-markdown": {
      "command": "/path/to/tape-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

## Development

### Tech Stack
- **Backend**: Go with Wails framework
- **Frontend**: React + TypeScript with Vite
- **UI Components**: Radix UI with custom styling
- **Markdown**: Marked.js with syntax highlighting

### Building
```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Build application
wails build

# Build MCP server
cd cmd/mcp && go build -o ../../build/bin/tape-mcp .
```

### Project Structure
```
tape/
├── main.go              # Main application entry
├── app.go               # Core application logic
├── cmd/mcp/            # MCP server implementation
├── frontend/           # React frontend
├── build/              # Build outputs
└── assets/             # Icons and resources
```

## Code of conduct, license, authors, changelog, contributing

See the following files:
- [license](LICENSE)
- [contributing guidelines](CONTRIBUTING.md)
- [changelog](CHANGELOG.md)
- [code of conduct](CODE_OF_CONDUCT.md)

## Want to participate? Have a bug or a request feature?

Do not hesitate to open a PR or an issue. I reply when I can.

### Related Projects

- [Wails](https://wails.io/) - Build desktop applications using Go and web technologies
- [MCP Protocol](https://modelcontextprotocol.io/) - Model Context Protocol for AI assistant integration
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives for React

## Want to support my work?

- [Give me a tip](https://ko-fi.com/a2n00)
- [Give a star on GitHub](https://github.com/results-may-vary-org/tape)
- [Report issues or contribute](https://github.com/results-may-vary-org/tape/issues)
- Or just participate in the development :D

### Thanks!