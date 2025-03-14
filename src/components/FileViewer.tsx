
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // Light theme for code blocks
import { FileEntry, readFileContent, isTextFile, getLanguageFromFileName } from '@/utils/fileSystem';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FileText, Eye } from "lucide-react";

interface FileViewerProps {
  file: FileEntry | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'preview'>('raw');
  const isMarkdown = file?.name.toLowerCase().endsWith('.md') || false;

  useEffect(() => {
    async function loadFileContent() {
      if (!file || file.kind !== 'file' || !file.handle) {
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

  // Reset view mode to raw when changing files
  useEffect(() => {
    setViewMode('raw');
  }, [file?.path]);

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
    <div className="h-full bg-white overflow-auto flex flex-col">
      <div className="sticky top-0 bg-white border-b p-2 text-sm font-medium z-10 flex justify-between items-center">
        <div className="truncate">{file.path}</div>
        
        {isMarkdown && (
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'raw' | 'preview')}>
            <ToggleGroupItem value="raw" aria-label="View raw markdown">
              <FileText className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Source</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="preview" aria-label="View rendered markdown">
              <Eye className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Preview</span>
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
      
      {isMarkdown && viewMode === 'preview' ? (
        <div className="p-6 markdown-body">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeHighlight]}
            components={{
              // This wrapper div applies our custom styles
              div: ({node, ...props}) => <div className="prose max-w-none" {...props} />
            }}
          >
            {content || ''}
          </ReactMarkdown>
        </div>
      ) : (
        <pre className="p-4 text-sm whitespace-pre-wrap font-mono">
          {content}
        </pre>
      )}
    </div>
  );
};

export default FileViewer;
