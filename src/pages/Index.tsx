
import React, { useState } from 'react';
import { FileEntry, pickFile, pickFolderWithAccess } from '@/utils/fileSystem';
import FileExplorer from '@/components/FileExplorer';
import FileViewer from '@/components/FileViewer';
import FolderHeader from '@/components/FolderHeader';
import FolderSearch from '@/components/FolderSearch';
import { useToast } from "@/components/ui/use-toast";
import '../styles/markdown.css'; // We'll create this for markdown styling

const Index = () => {
  const [rootDir, setRootDir] = useState<{ name: string, handle?: FileSystemDirectoryHandle } | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [isExplorerVisible, setIsExplorerVisible] = useState<boolean>(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState<{ path: string; line: number; matchIndex: number } | null>(null);
  const { toast } = useToast();

  const selectFolder = async () => {
    try {
      const result = await pickFolderWithAccess();
      if (!result) {
        return;
      }

      setRootDir({ name: result.name, handle: result.handle });
      setFiles(result.entries);
      setSelectedFile(null);
      setIsSearchVisible(false);
      setSearchQuery('');
      setSearchTarget(null);

      toast({
        title: "Folder loaded successfully",
        description: `${result.name} has been loaded with ${result.entries.length} items at the root level.`
      });
    } catch (error) {
      console.error('Error selecting folder:', error);

      // Check if the error is an abort error (user canceled the folder picker)
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Failed to load folder",
          description: (error as Error).message || "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  };

  const selectFile = async () => {
    try {
      const file = await pickFile();
      if (file) {
        // When picking a single file, we don't have a directory structure
        // So we'll just display that single file
        setSelectedFile(file);
        setFiles([file]); // Add the file to the explorer list
        setRootDir(null); // Clear the root directory since we're not in a folder
        setIsSearchVisible(false);
        setSearchQuery('');
        setSearchTarget(null);

        toast({
          title: "File loaded successfully",
          description: `${file.name} has been loaded.`
        });
      }
    } catch (error) {
      console.error('Error selecting file:', error);

      // Check if the error is an abort error (user canceled the file picker)
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Failed to load file",
          description: (error as Error).message || "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  };

  const toggleExplorer = () => {
    setIsExplorerVisible(!isExplorerVisible);
  };

  const toggleSearch = () => {
    setIsSearchVisible((visible) => !visible);
    setIsExplorerVisible(true);
  };

  const selectSearchResult = (file: FileEntry, line: number, matchIndex: number) => {
    setSelectedFile(file);
    setSearchTarget({ path: file.path, line, matchIndex });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <FolderHeader
        folderName={rootDir?.name || null}
        isExplorerVisible={isExplorerVisible}
        toggleExplorer={toggleExplorer}
        onSelectFolder={selectFolder}
        onSelectFile={selectFile}
        isSearchVisible={isSearchVisible}
        canSearchFolder={rootDir !== null}
        onToggleSearch={toggleSearch}
      />

      <div className="flex flex-1 overflow-hidden">
        {isExplorerVisible && (
          <div className={`${isSearchVisible ? 'w-80' : 'w-64'} h-full shrink-0`}>
            {isSearchVisible && rootDir ? (
              <FolderSearch
                files={files}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                onSelectResult={selectSearchResult}
              />
            ) : (
              <FileExplorer
                files={files}
                selectedFile={selectedFile}
                onSelectFile={(file) => {
                  setSelectedFile(file);
                  setSearchTarget(null);
                }}
              />
            )}
          </div>
        )}

        <div className="flex-1 h-full overflow-hidden">
          <FileViewer
            key={selectedFile?.path ?? 'no-file'}
            file={selectedFile}
            searchQuery={searchQuery}
            searchLine={searchTarget?.path === selectedFile?.path ? searchTarget.line : undefined}
            searchMatchIndex={searchTarget?.path === selectedFile?.path ? searchTarget.matchIndex : 0}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
