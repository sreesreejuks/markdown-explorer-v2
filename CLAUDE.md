# CLAUDE.md

Guidance for AI assistants working on **Markdown Explorer v2**.

## Project summary

Client-side markdown and text file explorer. Users pick a local folder or file; the app renders a tree view and previews content. **No backend.** Files never leave the user's machine unless they explicitly save/download.

Authors: Lovable and Sreeju.

## Tech stack

- **React 18** + **TypeScript** + **Vite**
- **React Router** (single main route `/`)
- **shadcn/ui** + **Tailwind CSS**
- **react-markdown** + **remark-gfm** + **react-syntax-highlighter**
- Path alias: `@/` → `src/`

## Commands

```bash
npm install
npm run dev      # http://localhost:8080 (secure context — FSA works)
npm run build    # output: dist/
npm run preview  # preview production build locally
npm run lint
```

Docker (optional, HTTP only — FSA fallback mode):

```bash
docker build -t markdown-explorer .
docker run -p 8080:80 markdown-explorer
```

## Architecture

```
src/
  pages/Index.tsx          # Main page: folder/file selection, layout
  utils/fileSystem.ts      # File System Access API + fallbacks (core module)
  components/
    FileExplorer.tsx       # Tree view
    FileViewer.tsx         # Text/markdown preview; passes handle to editor
    MarkdownEditor.tsx     # Edit/preview markdown; save logic
    FolderHeader.tsx       # Select folder/file, toggle explorer
  types/filesystem.d.ts    # Window FSA type augmentations
```

### Data flow

1. User clicks **Select Folder** → `pickFolderWithAccess()` in `fileSystem.ts`
2. If `showDirectoryPicker` exists (secure context + Chromium): native folder picker, directory handle stored
3. Otherwise: hidden `<input webkitdirectory>` fallback (browser may label it "Upload files")
4. File tree stored in React state (`FileEntry[]`)
5. Selecting a file → `readFileContent()` reads from handle or in-memory `File`
6. Markdown files → `MarkdownEditor` with optional `fileHandle` for in-place save

## File System Access API (critical)

The app depends on a **secure context** for full functionality:

| Environment | Protocol | FSA available | Folder picker | In-place save |
|-------------|----------|---------------|---------------|---------------|
| `npm run dev` | `http://localhost:8080` | Yes | Native | Yes |
| Vercel production | HTTPS (automatic) | Yes | Native | Yes |
| Docker / LAN IP | HTTP | No | Fallback input | Download only |

**Always use `typeof window.showDirectoryPicker === 'function'`** — never user-agent sniffing.

Key helpers in `src/utils/fileSystem.ts`:

- `isFileSystemAccessSupported()`
- `getFileSystemAccessLimitation()` — `'none' | 'insecure-context' | 'unsupported-browser'`
- `pickFolderWithAccess()` — FSA first, then `pickFolder()` fallback
- `pickFile()` — FSA first, then `<input type="file">` fallback

Do not add server upload endpoints. The app is intentionally browser-only.

## Deployment

### Vercel (production — recommended)

Vercel provides **HTTPS automatically** on `*.vercel.app` and custom domains. No SSL certificates or code changes required.

1. Connect the GitHub repo to Vercel
2. Framework preset: **Vite** (auto-detected)
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy — users get HTTPS and native folder picker

`vercel.json` only adds SPA rewrites for React Router. It does not change local dev or Docker workflows.

### Docker (local/self-hosted)

Serves static files over **HTTP**. FSA unavailable; fallback pickers still work. Document this limitation; do not treat Docker HTTP the same as Vercel HTTPS.

## Coding conventions

- Match existing patterns: functional React components, `@/` imports, shadcn UI primitives
- Keep changes minimal and scoped
- Prefer extending `fileSystem.ts` over duplicating picker logic
- Use `typeof fn === 'function'` for all FSA feature checks
- Toast errors for user-facing failures; skip toasts on `AbortError` (user cancelled)
- Do not commit unless explicitly asked

## Common pitfalls

1. **Misleading "Upload files" dialog** — Chrome wording for `webkitdirectory` fallback, not a server upload
2. **False "unsupported browser"** — Usually insecure context (HTTP), not browser choice
3. **MarkdownEditor save** — Must receive `fileHandle` from `FileViewer` for in-place save when FSA is active
4. **`index.html` gptengineer script** — Present for Lovable; leave unless user requests removal
5. **No npm in some CI/sandbox shells** — verify locally when possible

## UI notes

- Explorer panel width: `w-64`, toggle via eye icon in header
- Markdown preview uses macOS-style code blocks with copy button
- Amber compatibility banner was removed; save-time toasts explain limitations instead

## Testing checklist

- [ ] Select folder on `localhost:8080` — native picker, no "upload" dialog
- [ ] Select folder on Vercel HTTPS URL — same native picker
- [ ] Open `.md` file, edit, save — writes to original when handle exists
- [ ] Docker HTTP — fallback picker works, save downloads file
- [ ] Cancel folder picker — no error toast
