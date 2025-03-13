
import React from 'react';
import { Button } from "@/components/ui/button";
import { Folder, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FolderHeaderProps {
  folderName: string | null;
  isExplorerVisible: boolean;
  toggleExplorer: () => void;
  onSelectFolder: () => void;
}

const FolderHeader: React.FC<FolderHeaderProps> = ({
  folderName,
  isExplorerVisible,
  toggleExplorer,
  onSelectFolder
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

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          className="gap-2" 
          onClick={handleSelectFolder}
        >
          <Folder className="h-4 w-4 text-explorer-icon" />
          {folderName ? (
            <span className="truncate max-w-[200px]">{folderName}</span>
          ) : (
            "Select Folder"
          )}
        </Button>
      </div>
      
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
    </div>
  );
};

export default FolderHeader;
