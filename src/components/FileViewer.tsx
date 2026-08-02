import React, { useState, useEffect } from 'react';
import { FileEntry, readFileContent, isTextFile } from '@/utils/fileSystem';
import { useToast } from "@/components/ui/use-toast";
import MarkdownEditor from './MarkdownEditor';

interface FileViewerProps {
  file: FileEntry | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMarkdown = file?.name.toLowerCase().endsWith('.md') || false;
  const { toast } = useToast();

  useEffect(() => {
    async function loadFileContent() {
      if (!file || file.kind !== 'file' || (!file.handle && !file.file)) {
        setContent(null);
        setError(null);
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

        const text = await readFileContent(file);
        setContent(text);
      } catch (err) {
        console.error('Error loading file:', err);
        setError('Failed to load file content.');
      } finally {
        setLoading(false);
      }
    }

    loadFileContent();
  }, [file]);

  const handleSave = async (newContent: string) => {
    if (!file?.handle || file.handle.kind !== 'file') return;

    try {
      const writable = await file.handle.createWritable();
      await writable.write(newContent);
      setContent(newContent);
      toast({
        title: "File saved",
        description: "Changes have been saved successfully",
      });
    } catch (err) {
      console.error('Failed to save:', err);
      toast({
        title: "Save failed",
        description: "Could not save changes to file",
        variant: "destructive",
      });
    }
  };

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

  if (isMarkdown) {
    return (
      <MarkdownEditor
        initialContent={content || ''}
        onSave={handleSave}
        fileHandle={file.handle?.kind === 'file' ? file.handle : undefined}
        fileName={file.name}
      />
    );
  }

  // For non-markdown files, show line numbers
  const lines = content?.split('\n') || [];
  return (
    <div className="font-mono text-sm p-4">
      {lines.map((line, index) => (
        <div key={index} className="flex">
          <div className="text-gray-400 select-none w-10 text-right pr-2 mr-2 border-r border-gray-200">
            {index + 1}
          </div>
          <div className="whitespace-pre-wrap flex-1">{line}</div>
        </div>
      ))}
    </div>
  );
};

export default FileViewer;
