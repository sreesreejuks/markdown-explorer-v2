
# Markdown Explorer

A web application that allows you to open folders from your local system and browse their contents. The application displays a file explorer that can be toggled on and off, and allows you to view the contents of text files with special support for Markdown files.

## Features

- Select and open folders from your local filesystem
- Browse files and folders in a hierarchical tree view
- View the contents of text files
- Toggle the file explorer visibility
- Mac OS style markdown rendering with syntax highlighting
- Copy code blocks to clipboard with notification
- Docker support for easy deployment

## Author Collaboration.

Created by Lovable and Sreeju

## Local Development

### Prerequisitesd

- Node.js 22+
- npm or yarn

### Running the application

1. Clone the repository
2. Install dependencies
```bash
npm install
```
3. Start the development server
```bash
npm run dev
```
4. Open `http://localhost:8080` in your browser

### Using a VS Code Dev Container

Open the repository in VS Code with the Dev Containers extension and choose
**Reopen in Container**. The container uses Node.js 22 and runs `npm ci` after
creation. Start the app in the integrated terminal with:

```bash
npm run dev -- --host 0.0.0.0
```

Open the forwarded port 8080 in your browser. The container isolates Node.js and
project dependencies from the host operating system; Docker and the VS Code Dev
Containers extension are required.

## Using Docker

### Building and running with Docker

```bash
# Build the Docker image
docker build -t markdown-explorer .

# Run the container
docker run -p 8080:80 markdown-explorer
```

### Using Docker Compose

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down
```

## Releases

Releases are created automatically from `main` by [semantic-release](https://github.com/semantic-release/semantic-release).

Each run:

1. Determines the next version from Conventional Commits since the last git tag
2. Writes release notes to `CHANGELOG.md` and a GitHub Release
3. Bumps `package.json` (the app is `private` and is **not** published to npm)

Use these commit prefixes on `main`:

| Prefix | Version bump |
| --- | --- |
| `feat:` | minor (`0.1.0` → `0.2.0`) |
| `fix:`, `perf:`, `refactor:` | patch (`0.1.0` → `0.1.1`) |
| `feat!:` or a `BREAKING CHANGE:` footer | major (`0.1.0` → `1.0.0`) |

`chore:`, `docs:`, `test:`, `ci:`, and `build:` do not cut a release on their own. Commits without a Conventional prefix (for example `Add folder search`) are treated as a patch.

To preview the next version and notes without publishing:

```bash
npm run release:dry-run
```

The same dry run is available as a manual **Release** workflow in GitHub Actions.

## Browser Compatibility

This application uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) which is currently supported in:

- Chrome 86+
- Edge 86+
- Opera 72+

It is not supported in Firefox or Safari as of the time of writing.

## Security Notes

- The application only requests read permissions for folders
- All file operations happen locally in the browser; no data is sent to any server
- The Docker container serves static files only
