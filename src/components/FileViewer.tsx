
import React, { useState, useEffect } from 'react';
import { FileEntry, readFileContent, isTextFile } from '@/utils/fileSystem';

interface FileViewerProps {
  file: FileEntry | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFileContent() {
      if (!file || file.kind !== 'file' || !file.handle) {
        setContent(null);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Check if it's a text file
        if (!isTextFile(file.name)) {
          setError('This file type cannot be previewed.');
          setLoading(false);
          return;
        }
        
        // Ensure we're only passing a FileSystemFileHandle
        if (file.handle.kind === 'file') {
          const text = await readFileContent(file.handle);
          setContent(text);
        } else {
          setError('Cannot read content from a directory.');
        }
      } catch (err) {
        console.error('Error loading file:', err);
        setError('Failed to load file content.');
      } finally {
        setLoading(false);
      }
    }

    loadFileContent();
  }, [file]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-white text-muted-foreground">
        <p>Select a file to view its contents</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white overflow-auto">
      <div className="sticky top-0 bg-white border-b p-2 text-sm font-medium z-10">
        {file.path}
      </div>
      <pre className="p-4 text-sm whitespace-pre-wrap font-mono">
        {content}
      </pre>
    </div>
  );
};

export default FileViewer;
