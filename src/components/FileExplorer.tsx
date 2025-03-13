
import React, { useState } from 'react';
import { Folder, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileEntry } from '@/utils/fileSystem';

interface FileExplorerProps {
  files: FileEntry[];
  selectedFile: FileEntry | null;
  onSelectFile: (file: FileEntry) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onSelectFile
}) => {
  // Track expanded directories
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDirectory = (path: string) => {
    const newExpandedDirs = new Set(expandedDirs);
    if (newExpandedDirs.has(path)) {
      newExpandedDirs.delete(path);
    } else {
      newExpandedDirs.add(path);
    }
    setExpandedDirs(newExpandedDirs);
  };

  const renderFileEntry = (entry: FileEntry, depth = 0) => {
    const isDirectory = entry.kind === 'directory';
    const isExpanded = isDirectory && expandedDirs.has(entry.path);
    const isSelected = selectedFile?.path === entry.path;
    
    return (
      <div key={entry.path}>
        <div 
          className={cn(
            "flex items-center py-1 px-2 cursor-pointer hover:bg-explorer-hover rounded truncate",
            isSelected && "bg-explorer-selected hover:bg-explorer-selected"
          )}
          style={{ paddingLeft: `${(depth * 12) + 8}px` }}
          onClick={() => {
            if (isDirectory) {
              toggleDirectory(entry.path);
            } else {
              onSelectFile(entry);
            }
          }}
        >
          {isDirectory ? (
            <Folder 
              className="h-4 w-4 mr-2 flex-shrink-0 text-explorer-icon" 
            />
          ) : (
            <FileText 
              className="h-4 w-4 mr-2 flex-shrink-0" 
            />
          )}
          <span className="truncate">{entry.name}</span>
        </div>
        
        {isDirectory && isExpanded && entry.children && (
          <div>
            {entry.children.map(child => renderFileEntry(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto bg-explorer border-r border-explorer-border">
      <div className="text-sm">
        {files.map(file => renderFileEntry(file))}
        {files.length === 0 && (
          <div className="p-4 text-muted-foreground italic text-center">
            No files found. Select a folder to start.
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
