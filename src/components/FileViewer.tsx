import React, { useEffect, useRef, useState } from 'react';
import { FileEntry, readFileContent, isTextFile } from '@/utils/fileSystem';
import { highlightTextMatches } from '@/utils/searchHighlight';
import { useToast } from "@/components/ui/use-toast";
import MarkdownEditor from './MarkdownEditor';

interface FileViewerProps {
  file: FileEntry | null;
  searchQuery?: string;
  searchLine?: number;
  searchMatchIndex?: number;
}

const FileViewer: React.FC<FileViewerProps> = ({
  file,
  searchQuery = '',
  searchLine,
  searchMatchIndex = 0,
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const root = viewerRef.current;
    if (!root || loading || error || isMarkdown) return;

    const searchRoot = root.querySelector('.file-search-content');
    if (searchRoot instanceof HTMLElement) {
      highlightTextMatches(searchRoot, searchQuery, searchMatchIndex, searchLine);
    }
  }, [content, error, isMarkdown, loading, searchLine, searchMatchIndex, searchQuery]);

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

  let viewerContent: React.ReactNode;
  if (loading) {
    viewerContent = (
      <div className="flex items-center justify-center h-full bg-white">
        <p>Loading...</p>
      </div>
    );
  } else if (error) {
    viewerContent = (
      <div className="flex items-center justify-center h-full bg-white text-destructive">
        <p>{error}</p>
      </div>
    );
  } else if (isMarkdown) {
    viewerContent = (
      <MarkdownEditor
        initialContent={content || ''}
        onSave={handleSave}
        fileHandle={file.handle?.kind === 'file' ? file.handle : undefined}
        fileName={file.name}
        searchQuery={searchQuery}
        searchMatchIndex={searchMatchIndex}
      />
    );
  } else {
    const lines = content?.split('\n') || [];
    viewerContent = (
      <div className="file-search-content font-mono text-sm p-4">
        {lines.map((line, index) => (
          <div key={index} className="flex">
            <div aria-hidden="true" className="text-gray-400 select-none w-10 text-right pr-2 mr-2 border-r border-gray-200">
              {index + 1}
            </div>
            <div className="whitespace-pre-wrap flex-1">{line}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={viewerRef} className="h-full min-h-0 overflow-auto">
      {viewerContent}
    </div>
  );
};

export default FileViewer;
