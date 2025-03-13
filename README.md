
# Folder Finder Wizard

A web application that allows you to open folders from your local system and browse their contents. The application displays a file explorer that can be toggled on and off, and allows you to view the contents of text files.

## Features

- Select and open folders from your local filesystem
- Browse files and folders in a hierarchical tree view
- View the contents of text files
- Toggle the file explorer visibility
- Docker support for easy deployment

## Local Development

### Prerequisites

- Node.js 16+
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

## Using Docker

### Building and running with Docker

```bash
# Build the Docker image
docker build -t folder-finder-wizard .

# Run the container
docker run -p 8080:80 folder-finder-wizard
```

### Using Docker Compose

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down
```

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
