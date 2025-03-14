
import React, { useState, useEffect } from 'react';
import { FileEntry, getFilesFromDirectory, pickFile } from '@/utils/fileSystem';
import FileExplorer from '@/components/FileExplorer';
import FileViewer from '@/components/FileViewer';
import FolderHeader from '@/components/FolderHeader';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import '../styles/markdown.css'; // We'll create this for markdown styling

const Index = () => {
  const [rootDir, setRootDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [isExplorerVisible, setIsExplorerVisible] = useState<boolean>(true);
  const [isApiSupported, setIsApiSupported] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check for File System Access API support on component mount
  useEffect(() => {
    // More robust check for File System Access API support
    const isFSASupported = 'showDirectoryPicker' in window || 
                          (navigator.userAgent.includes('Chrome') && 
                           parseInt(navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || '0', 10) >= 86);
    
    setIsApiSupported(isFSASupported);
    
    // Log information to help debug
    console.log('User Agent:', navigator.userAgent);
    console.log('showDirectoryPicker in window:', 'showDirectoryPicker' in window);
    console.log('API detected as supported:', isFSASupported);
  }, []);

  const selectFolder = async () => {
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

  const selectFile = async () => {
    try {
      const file = await pickFile();
      if (file) {
        // When picking a single file, we don't have a directory structure
        // So we'll just display that single file
        setSelectedFile(file);
        setFiles([file]); // Add the file to the explorer list
        setRootDir(null); // Clear the root directory since we're not in a folder
        
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

  return (
    <div className="h-screen flex flex-col bg-background">
      <FolderHeader
        folderName={rootDir?.name || null}
        isExplorerVisible={isExplorerVisible}
        toggleExplorer={toggleExplorer}
        onSelectFolder={selectFolder}
        onSelectFile={selectFile}
      />
      
      {isApiSupported === false && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Browser Not Supported</AlertTitle>
          <AlertDescription>
            This application requires the File System Access API, which is not supported in your browser.
            Please use Chrome 86+, Edge 86+, Opera 72+, or Brave 1.22+.
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
