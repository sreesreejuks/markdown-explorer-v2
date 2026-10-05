import React, { useEffect, useState } from 'react';
import { FileEntry, isTextFile, readFileContent } from '@/utils/fileSystem';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface FolderSearchProps {
  files: FileEntry[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelectResult: (file: FileEntry, line: number, matchIndex: number) => void;
}

interface SearchResult {
  file: FileEntry;
  line: number;
  matchIndex: number;
  preview: string;
}

interface FileResults {
  file: FileEntry;
  matches: SearchResult[];
}

const getFiles = (entries: FileEntry[]): FileEntry[] =>
  entries.flatMap((entry) =>
    entry.kind === 'directory'
      ? getFiles(entry.children || [])
      : isTextFile(entry.name) && (entry.handle || entry.file)
        ? [entry]
        : [],
  );

const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query) return <>{text}</>;

  const lowerText = text.toLocaleLowerCase();
  const lowerQuery = query.toLocaleLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let index = lowerText.indexOf(lowerQuery);

  while (index !== -1) {
    if (index > cursor) parts.push(text.slice(cursor, index));
    parts.push(
      <mark key={index} className="rounded-sm bg-yellow-200 px-0.5 text-inherit">
        {text.slice(index, index + query.length)}
      </mark>,
    );
    cursor = index + query.length;
    index = lowerText.indexOf(lowerQuery, cursor);
  }

  parts.push(text.slice(cursor));
  return <>{parts}</>;
};

const FolderSearch: React.FC<FolderSearchProps> = ({
  files,
  query,
  onQueryChange,
  onSelectResult,
}) => {
  const [fileResults, setFileResults] = useState<FileResults[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [failedFiles, setFailedFiles] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return () => {
        cancelled = true;
      };
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setFileResults([]);
      setFailedFiles(0);

      const lowerQuery = trimmedQuery.toLocaleLowerCase();
      const results: FileResults[] = [];
      let failures = 0;

      for (const file of getFiles(files)) {
        if (cancelled) return;

        try {
          const content = await readFileContent(file);
          const lines = content.split(/\r?\n/);
          const matches: SearchResult[] = [];

          lines.forEach((line, lineIndex) => {
            const lowerLine = line.toLocaleLowerCase();
            let cursor = 0;
            let match = lowerLine.indexOf(lowerQuery, cursor);

            while (match !== -1) {
              matches.push({
                file,
                line: lineIndex + 1,
                matchIndex: matches.length,
                preview: line.trim() || line,
              });
              cursor = match + lowerQuery.length;
              match = lowerLine.indexOf(lowerQuery, cursor);
            }
          });

          if (matches.length) results.push({ file, matches });
        } catch (error) {
          console.error(`Failed to search ${file.path}:`, error);
          failures += 1;
        }
      }

      if (!cancelled) {
        setFileResults(results);
        setFailedFiles(failures);
        setIsSearching(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [files, onQueryChange, query]);

  const totalMatches = fileResults.reduce((total, result) => total + result.matches.length, 0);

  return (
    <div className="flex h-full flex-col border-r border-explorer-border bg-explorer">
      <div className="border-b border-explorer-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setFileResults([]);
              setFailedFiles(0);
              setIsSearching(Boolean(nextQuery.trim()));
              onQueryChange(nextQuery);
            }}
            placeholder="Search in folder"
            aria-label="Search all folder files"
            className="h-9 pl-9"
          />
        </div>
        {query.trim() && (
          <div className="mt-2 text-xs text-muted-foreground" aria-live="polite">
            {isSearching
              ? 'Searching files...'
              : `${totalMatches} result${totalMatches === 1 ? '' : 's'} in ${fileResults.length} file${fileResults.length === 1 ? '' : 's'}`}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-1">
        {!query.trim() && (
          <p className="p-3 text-sm text-muted-foreground">
            Search for text across all supported files in this folder.
          </p>
        )}
        {query.trim() && !isSearching && !fileResults.length && (
          <p className="p-3 text-sm text-muted-foreground">No matching files found.</p>
        )}
        {failedFiles > 0 && !isSearching && (
          <p className="px-3 py-2 text-xs text-destructive" role="status">
            Could not search {failedFiles} file{failedFiles === 1 ? '' : 's'}. See the console for details.
          </p>
        )}
        {fileResults.map(({ file, matches }) => (
          <section key={file.path} className="mb-1">
            <div
              className="truncate px-3 py-1.5 text-xs font-semibold text-foreground"
              title={file.path}
            >
              {file.path}
            </div>
            {matches.map((match, index) => (
              <button
                key={`${match.line}-${index}`}
                type="button"
                className="block w-full px-3 py-1 text-left text-xs hover:bg-explorer-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                onClick={() => onSelectResult(file, match.line, match.matchIndex)}
                title={`${file.path}:${match.line}`}
              >
                <span className="mr-2 select-none text-muted-foreground">{match.line}</span>
                <span className="break-all font-mono">
                  <HighlightedText text={match.preview} query={trimmedQuery} />
                </span>
              </button>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
};

export default FolderSearch;
