export interface FileEntry {
  name: string;
  kind: 'file' | 'directory';
  children?: FileEntry[];
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
  path: string;
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

export async function readFileContent(fileHandle: FileSystemFileHandle): Promise<string> {
  const file = await fileHandle.getFile();
  return await file.text();
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
    return null;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Error picking file:', error);
    }
    return null;
  }
}
