import React from 'react';
import { Button } from "@/components/ui/button";
import { Folder, Eye, EyeOff, File } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import HelpModal from './HelpModal';
import { pickFile } from '@/utils/fileSystem';
import { Link } from 'react-router-dom';

interface FolderHeaderProps {
  folderName: string | null;
  isExplorerVisible: boolean;
  toggleExplorer: () => void;
  onSelectFolder: () => void;
  onSelectFile: () => void;
}

const FolderHeader: React.FC<FolderHeaderProps> = ({
  folderName,
  isExplorerVisible,
  toggleExplorer,
  onSelectFolder,
  onSelectFile
}) => {
  const { toast } = useToast();

  const handleSelectFolder = async () => {
    try {
      await onSelectFolder();
    } catch (error) {
      console.error('Error selecting folder:', error);
      toast({
        title: "Error selecting folder",
        description: (error as Error).message || "Failed to select folder",
        variant: "destructive"
      });
    }
  };

  const handleSelectFile = async () => {
    try {
      await onSelectFile();
    } catch (error) {
      console.error('Error selecting file:', error);
      toast({
        title: "Error selecting file",
        description: (error as Error).message || "Failed to select file",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleSelectFolder}
          >
            <Folder className="h-4 w-4 text-explorer-icon" />
            {folderName ? (
              <span className="truncate max-w-[150px] hidden sm:inline">{folderName}</span>
            ) : (
              <span className="hidden sm:inline">Select Folder</span>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleSelectFile}
          >
            <File className="h-4 w-4" />
            <span className="hidden sm:inline">Select File</span>
          </Button>
        </div>
      </div>

      <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
        <h1 className="text-xl font-medium flex items-center">
          <span className="text-gray-400">Markdown</span>
          <span className="text-black ml-1">Explorer</span>
          <span className="text-xs text-gray-400 ml-1.5 mt-0.5 font-normal bg-gray-100 px-1.5 py-0.5 rounded-full">v2</span>
        </h1>
      </Link>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleExplorer}
          title={isExplorerVisible ? "Hide Explorer" : "Show Explorer"}
        >
          {isExplorerVisible ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </Button>
        
        <HelpModal />
      </div>
    </div>
  );
};

export default FolderHeader;
