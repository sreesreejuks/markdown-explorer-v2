import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileEntry, readFileContent, isTextFile } from '@/utils/fileSystem';
import { useToast } from "@/components/ui/use-toast";
import MarkdownEditor from './MarkdownEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';

interface FileViewerProps {
  file: FileEntry | null;
}

type SearchMatch = { start: number; end: number } | { range: Range };

const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMarkdown = file?.name.toLowerCase().endsWith('.md') || false;
  const { toast } = useToast();

  const getSearchMatches = useCallback((queryValue = searchQuery): SearchMatch[] => {
    const root = viewerRef.current;
    if (!root || !queryValue) return [];

    const markdownPreview = root.querySelector('.prose');
    const textArea = markdownPreview ? null : root.querySelector('textarea');
    const searchRoot = markdownPreview || root.querySelector('.file-search-content');
    const query = queryValue.toLocaleLowerCase();

    if (textArea) {
      const text = textArea.value.toLocaleLowerCase();
      const matches: SearchMatch[] = [];
      let start = 0;
      while ((start = text.indexOf(query, start)) !== -1) {
        matches.push({ start, end: start + query.length });
        start += query.length;
      }
      return matches;
    }

    if (!searchRoot) return [];

    const matches: SearchMatch[] = [];
    const walker = document.createTreeWalker(searchRoot, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.parentElement?.closest('[aria-hidden="true"]')
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
    });
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.toLocaleLowerCase() || '';
      let start = 0;
      while ((start = text.indexOf(query, start)) !== -1) {
        const range = document.createRange();
        range.setStart(node, start);
        range.setEnd(node, start + query.length);
        matches.push({ range });
        start += query.length;
      }
    }
    return matches;
  }, [searchQuery]);

  const navigateToMatch = useCallback((index: number, queryValue = searchQuery) => {
    const matches = getSearchMatches(queryValue);
    setMatchCount(matches.length);
    if (!matches.length) {
      setMatchIndex(0);
      return;
    }

    const nextIndex = ((index % matches.length) + matches.length) % matches.length;
    const match = matches[nextIndex];
    setMatchIndex(nextIndex + 1);

    if ('range' in match) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(match.range);
      match.range.commonAncestorContainer.parentElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    const textArea = viewerRef.current?.querySelector('textarea');
    if (textArea) {
      textArea.setSelectionRange(match.start, match.end);
      const lineNumber = textArea.value.slice(0, match.start).split('\n').length;
      textArea.scrollTop = Math.max(0, (lineNumber - 1) * 24);
    }
  }, [getSearchMatches, searchQuery]);

  useEffect(() => {
    if (!isSearchOpen) return;
    searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    const handleFindShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f' && file) {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleFindShortcut);
    return () => window.removeEventListener('keydown', handleFindShortcut);
  }, [file]);

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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-end gap-2 border-b px-2 py-1.5">
        {isSearchOpen && (
          <div className="flex items-center gap-1">
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => {
                const query = event.target.value;
                const matches = getSearchMatches(query);
                setSearchQuery(query);
                setMatchCount(matches.length);
                if (matches.length) {
                  navigateToMatch(0, query);
                } else {
                  setMatchIndex(0);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  navigateToMatch(matchIndex + (event.shiftKey ? -2 : 0));
                } else if (event.key === 'Escape') {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }
              }}
              placeholder="Find in file"
              aria-label="Find text in file"
              className="h-8 w-52"
            />
            <span className="min-w-12 text-center text-xs text-muted-foreground" aria-live="polite">
              {searchQuery ? `${matchIndex || (matchCount ? 1 : 0)} / ${matchCount}` : '0 / 0'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateToMatch(matchIndex - 2)}
              disabled={!matchCount}
              title="Previous match (Shift+Enter)"
              aria-label="Previous match"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateToMatch(matchIndex)}
              disabled={!matchCount}
              title="Next match (Enter)"
              aria-label="Next match"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              title="Close search (Escape)"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!isSearchOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsSearchOpen(true)}
            title="Find in file (Ctrl+F)"
            aria-label="Find in file"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div ref={viewerRef} className="min-h-0 flex-1 overflow-auto">
        {viewerContent}
      </div>
    </div>
  );
};

export default FileViewer;
