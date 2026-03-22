<p align="center">
  <a href="https://github.com/results-may-vary-org/tape">
    <img alt="Tape" src=".github/assets/screenshot.png"/>
  </a>
</p>
<h1 align="center">Tape - a <i>simple</i> markdown editor</h1>

<img alt="Static Badge" src="https://img.shields.io/badge/Still_maintained-Yes_%3A)-green">

## Yet another md app?

Tape is designed as a no-bloat markdown editor that focuses on simplicity and efficiency.

I want it to be just what I need it for: taking notes.

No paywall, no outdated ui, no journaling system, simple and plain `.md` files.

## Tape?!?

Yeah `cassette` [is already taken](https://aur.archlinux.org/packages?K=cassette) :) 

[What a tape or a cassette, you may ask.](https://en.wikipedia.org/wiki/Cassette_tape)

The design is inspired by old cassette color, the logo represents the wheel of a cassette.

## Main Features

- **Markdown editor & reader**: Switch between editing and rendered preview modes with live preview `ctrl+tab`
- **File tree**: Organized file browser with folders-first, alphabetical sorting
- **File operations**: Create, rename, delete files and folders with existence validation
- **Save**: `ctrl+s` to save with visual unsaved changes indicators
- **Persistent workspace**: Remembers last opened folder, selection and config via `tape.json` config
- **Context menus**: `right-click` for file and folder operations
- **Full-text search**: `ctrl+k` to search across all markdown files with fuzzy matching
- **Cross-platform**: Available for Linux, Windows, and macOS
- **Full keyboard integration**: You can navigate the ui with `tab` and `shift+tab`, `enter` to open
- **Shortcut help**: just hit `ctrl+h` to get the full list of shortcuts
- **Sync yourself**: because the app handle plain `.md` files and the config file is place at the root of your notes folder, you can sync your notes with any other app you want

## Installation

### Linux
- Download via [AUR](https://aur.archlinux.org/packages/tape-bin)
- Download the installer from [releases](https://github.com/results-may-vary-org/tape/releases)

### Windows
- Download the installer from [releases](https://github.com/results-may-vary-org/tape/releases)

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

## Encryption (Privacy Mode)

When privacy mode is enabled, tape encrypts both the **content** and the **names** of all your files and folders. Your password is the only thing you need to decrypt them.

### How it works

**Key derivation** — your password is processed through [Argon2id](https://en.wikipedia.org/wiki/Argon2) (2 passes, 64MB memory, 4 threads) to produce a 256-bit encryption key. This makes brute-force attacks expensive.

**Content encryption** — each file's content is encrypted with AES-256-GCM. A unique random nonce is generated for every write, so encrypting the same content twice produces different ciphertext.

**Filename & folder encryption** — names are also encrypted with AES-256-GCM. Because raw encrypted bytes contain arbitrary binary data that filesystems can't handle, the result is encoded to [Base64 URL-safe](https://en.wikipedia.org/wiki/Base64#URL_applications) before being used as the actual name on disk. Encrypted files get the `.mde` extension.

**File format** — every encrypted file starts with a `MDE1` version prefix, followed by the nonce, then the ciphertext:
```
MDE1 + nonce (12 bytes) + ciphertext
```
Filenames follow the same layout but base64-encoded:
```
MDE1 + base64url(nonce + ciphertext) + .mde
```

**Password verification** — `tape.json` stores a small encrypted blob (a random value encrypted with your key) and its nonce. On login, tape re-derives the key from your password and tries to decrypt this blob. If it succeeds, the password is correct. The key itself is never stored anywhere.

> Your password alone is sufficient to recover your files. There is no recovery key and no secondary secret to keep.

## Configuration `tape.json`

The config is mostly there to remember your last opened folder, selection and view mode.

It must be placed at the root of your notes folder.

```json
{
  "lastOpenedFolder": "path of the last selected root folder",
  "lastOpenedFile": "path of the last selected note",
  "expandedFolders": ["array of each expanded folder"],
  "viewMode": "editor",
  "theme": "light"
}
```

## Markdown flavor example

The supported flavor is the GFM one with some addons.

A example exist here: [example](./example.md).

## Code of conduct, license, authors, changelog, contributing

See the following files:
- [license](LICENSE)
- [contributing guidelines](CONTRIBUTING.md)
- [changelog](CHANGELOG.md)
- [code of conduct](CODE_OF_CONDUCT.md)

## Want to participate? Have a bug or a request feature?

Do not hesitate to open a PR or an issue. I reply when I can.

## Want to support my work?

- [Give me a tip](https://ko-fi.com/a2n00)
- [Give a star on GitHub](https://github.com/results-may-vary-org/tape)
- [Report issues or contribute](https://github.com/results-may-vary-org/tape/issues)
- Or just participate in the development :D

### Thanks!
