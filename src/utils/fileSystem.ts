export interface FileEntry {
  name: string;
  kind: 'file' | 'directory';
  children?: FileEntry[];
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
  file?: File;
  path: string;
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window.showDirectoryPicker === 'function';
}

export type FolderPickResult = {
  name: string;
  handle?: FileSystemDirectoryHandle;
  entries: FileEntry[];
};

export async function pickFolderWithAccess(): Promise<FolderPickResult | null> {
  if (isFileSystemAccessSupported()) {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      const entries = await getFilesFromDirectory(dirHandle);
      return { name: dirHandle.name, handle: dirHandle, entries };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }

  const result = await pickFolder();
  if (!result) {
    return null;
  }

  if (Array.isArray(result)) {
    return { name: 'Selected Folder', entries: result };
  }

  return { name: result.name, entries: result.entries };
}

export async function getFilesFromDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  path = ''
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];

  for await (const entry of directoryHandle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;

    if (entry.kind === 'file') {
      entries.push({
        name: entry.name,
        kind: 'file',
        handle: entry as FileSystemFileHandle,
        path: entryPath
      });
    } else if (entry.kind === 'directory') {
      const dirHandle = entry as FileSystemDirectoryHandle;
      const children = await getFilesFromDirectory(dirHandle, entryPath);
      entries.push({
        name: entry.name,
        kind: 'directory',
        children,
        handle: dirHandle,
        path: entryPath
      });
    }
  }

  return entries.sort((a, b) => {
    if (a.kind === b.kind) {
      return a.name.localeCompare(b.name);
    }
    return a.kind === 'directory' ? -1 : 1;
  });
}

export async function readFileContent(fileEntry: FileEntry): Promise<string> {
  if (fileEntry.handle && fileEntry.kind === 'file') {
    const file = await (fileEntry.handle as FileSystemFileHandle).getFile();
    return await file.text();
  } else if (fileEntry.file) {
    return await fileEntry.file.text();
  }
  return '';
}

export function isTextFile(fileName: string): boolean {
  const textExtensions = [
    '.txt', '.md', '.markdown', '.html', '.htm', '.css', '.scss', '.less',
    '.js', '.jsx', '.ts', '.tsx', '.json', '.xml', '.svg', '.yml', '.yaml',
    '.ini', '.conf', '.cfg', '.config', '.sh', '.bash', '.py', '.rb', '.java',
    '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.go', '.rs', '.swift',
    '.kt', '.kts', '.dart', '.lua', '.pl', '.sql', '.r', '.gitignore',
    '.env', '.editorconfig', '.babelrc', '.eslintrc', '.prettierrc', '.dockerignore',
    'Dockerfile', 'Makefile', 'LICENSE'
  ];

  const lowerFileName = fileName.toLowerCase();
  return textExtensions.some(ext =>
    lowerFileName.endsWith(ext) ||
    lowerFileName === ext.slice(1) // For files without extensions that match the extension name
  );
}

export function getLanguageFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'svg': 'xml',
    'dockerfile': 'dockerfile'
  };

  if (fileName.toLowerCase() === 'dockerfile') {
    return 'dockerfile';
  }

  return languageMap[extension] || 'plaintext';
}

export async function pickFile(): Promise<FileEntry | null> {
  if (isFileSystemAccessSupported() && typeof window.showOpenFilePicker === 'function') {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'Text Files',
            accept: {
              'text/*': ['.txt', '.md', '.markdown', '.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.json', '.xml', '.yml', '.yaml', '.csv']
            }
          }
        ]
      });

      if (fileHandle) {
        return {
          name: fileHandle.name,
          kind: 'file',
          handle: fileHandle,
          path: fileHandle.name
        };
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error picking file:', error);
      }
      return null;
    }
  }

  // Fallback for browsers without File System Access API
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.markdown,.html,.css,.js,.ts,.jsx,.tsx,.json,.xml,.yml,.yaml,.csv';

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        resolve({
          name: file.name,
          kind: 'file',
          file: file,
          path: file.name
        });
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function pickFolder(): Promise<FileEntry[] | { entries: FileEntry[], name: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    // @ts-ignore - webkitdirectory is a non-standard attribute but widely supported
    input.webkitdirectory = true;

    input.onchange = () => {
      if (!input.files || input.files.length === 0) {
        resolve(null);
        return;
      }

      const files = Array.from(input.files);
      const root: FileEntry[] = [];
      const folderName = files[0].webkitRelativePath.split('/')[0];

      // Map to keep track of created directory entries
      const dirMap = new Map<string, FileEntry>();

      files.forEach(file => {
        const parts = file.webkitRelativePath.split('/');
        // Skip the root folder name itself if we want a flat list or handle it properly
        // Relative path is like "folder/sub/file.txt"

        let currentPath = '';
        let currentLevel = root;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          const partPath = currentPath ? `${currentPath}/${part}` : part;

          if (isLast) {
            // It's a file
            currentLevel.push({
              name: part,
              kind: 'file',
              file: file,
              path: partPath
            });
          } else {
            // It's a directory
            let dirEntry = dirMap.get(partPath);
            if (!dirEntry) {
              dirEntry = {
                name: part,
                kind: 'directory',
                children: [],
                path: partPath
              };
              dirMap.set(partPath, dirEntry);
              currentLevel.push(dirEntry);
            }
            currentLevel = dirEntry.children!;
          }
          currentPath = partPath;
        }
      });

      // Sort entries
      const sortEntries = (entries: FileEntry[]) => {
        entries.sort((a, b) => {
          if (a.kind === b.kind) return a.name.localeCompare(b.name);
          return a.kind === 'directory' ? -1 : 1;
        });
        entries.forEach(entry => {
          if (entry.children) sortEntries(entry.children);
        });
      };

      sortEntries(root);

      // Return both the entries and the root folder name
      // Since it's webkitdirectory, the first element of root is the selected folder
      if (root.length === 1 && root[0].kind === 'directory') {
        resolve({
          entries: root[0].children || [],
          name: root[0].name
        });
      } else {
        resolve({
          entries: root,
          name: folderName
        });
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}
