
import React, { useState, useEffect } from 'react';
import { FileEntry, getFilesFromDirectory } from '@/utils/fileSystem';
import FileExplorer from '@/components/FileExplorer';
import FileViewer from '@/components/FileViewer';
import FolderHeader from '@/components/FolderHeader';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Index = () => {
  const [rootDir, setRootDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [isExplorerVisible, setIsExplorerVisible] = useState<boolean>(true);
  const [isApiSupported, setIsApiSupported] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check for File System Access API support on component mount
  useEffect(() => {
    setIsApiSupported('showDirectoryPicker' in window);
  }, []);

  const selectFolder = async () => {
    if (!isApiSupported) {
      toast({
        title: "Browser not supported",
        description: "Your browser doesn't support the File System Access API. Please use Chrome, Edge, or Opera.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Request directory access
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read'
      });
      
      setRootDir(dirHandle);
      
      // Load files from the selected directory
      const fileEntries = await getFilesFromDirectory(dirHandle);
      setFiles(fileEntries);
      setSelectedFile(null);
      
      toast({
        title: "Folder loaded successfully",
        description: `${dirHandle.name} has been loaded with ${fileEntries.length} items at the root level.`
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

  const toggleExplorer = () => {
    setIsExplorerVisible(!isExplorerVisible);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <FolderHeader
        folderName={rootDir?.name || null}
        isExplorerVisible={isExplorerVisible}
        toggleExplorer={toggleExplorer}
        onSelectFolder={selectFolder}
      />
      
      {isApiSupported === false && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Browser Not Supported</AlertTitle>
          <AlertDescription>
            This application requires the File System Access API, which is not supported in your browser.
            Please use Chrome 86+, Edge 86+, or Opera 72+.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {isExplorerVisible && (
          <div className="w-64 h-full">
            <FileExplorer
              files={files}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
            />
          </div>
        )}
        
        <div className="flex-1 h-full overflow-hidden">
          <FileViewer file={selectedFile} />
        </div>
      </div>
    </div>
  );
};

export default Index;
