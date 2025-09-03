# Carnet

A debloated Markdown note-taking app.

<p align="center">
  <img src="./app-icon.png" alt="Carnet icon" width="100" />
</p>

<img alt="Static Badge" src="https://img.shields.io/badge/Still_maintened-Yes_%3A)-green">

---

## Why do you have made another note-taking app?

Just like my [postier](https://github.com/bouteillerAlan/postier) project (that I have to finish)
, I'm just tired of 'free' software that embark a shitload of feature, mandatory user account and creepy privacy statement.

Plus I have searched for an OSS note-taking app that is simple and not based on a "journaling" system. I just want to take notes. I just want the UI to be nice.

So I started this project. I know that developing this kind of stuff implies a lot of stuff (or maybe not if I want to keep it simple) but this is a cool adventure so - let's go :)

You can embark with me by contributing or via a [tips](https://github.com/sponsors/bouteillerAlan).

## Features

- local-first notes in Markdown
  - pick a root folder for your notes (once) and work directly in your filesystem
  - persistent last-used root (re-open where you left off)
- familiar, ergonomic editor
  - codeMirror with GitHub light/dark themes, soft wrap
  - optional line numbers and relative line numbers
  - debounced autosave with toast feedback (maybe not the best way to do that `but it works™`)
- beautiful preview
  - rendered via Markdoc
  - code blocks highlighted with Prism (oneLight/oneDark), theme-aware
- multiple view modes
  - edit only, Preview only
  - split vertical, Split horizontal (Resizable panels)
- clean tree sidebar
  - create folder and note, rename, delete
  - context menu, one-click to open
  - last opened note is remembered between sessions
- theming
  - light / dark / system, remembered across sessions
- settings per workspace
  - a `carnet.config.json` is stored next to your notes

## Tech Stack

- Tauri 2
- React, TypeScript, Vite
- Shadcn, Lucide icons
- CodeMirror 6 (Markdown), Markdoc
- Prism for syntax highlighting

## Some idea for the future

- Global search across notes
- Command palette and keyboard shortcuts

## Contributing

Contributions are welcome! Feel free to submit a PR.

## Code of conduct, license, authors, changelog, contributing

See the following file :
- [code of conduct](CODE_OF_CONDUCT.md)
- [license](LICENSE)
- [authors](AUTHORS)
- [contributing](CONTRIBUTING.md)
- [changelog](CHANGELOG)
- [security](SECURITY.md)

## Want to support my work?

- Just participate in the development :D
- Give a star on GitHub
- [Give me a tips on GitHub](https://github.com/sponsors/bouteillerAlan) or [on Ko-fi](https://ko-fi.com/a2n00)

### Thanks !
