
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const HelpModal = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="Help">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Getting Started</SheetTitle>
          <SheetDescription>
            How to use the Markdown Explorer
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="font-medium mb-1">Opening Files</h3>
            <p className="text-sm text-muted-foreground">
              Click "Select Folder" to browse and open a folder from your computer, or "Select File" to open an individual file.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">Viewing Files</h3>
            <p className="text-sm text-muted-foreground">
              Click on any file in the explorer to view its contents. For Markdown files, you can toggle between the source code and rendered preview.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">Navigating</h3>
            <p className="text-sm text-muted-foreground">
              Use the folder structure in the explorer panel to navigate through your files. You can collapse and expand folders as needed.
            </p>
          </div>
          
          <div className="pt-2 text-xs text-muted-foreground">
            <p className="font-medium">Browser Compatibility</p>
            <p>This app requires the File System Access API, which is supported in:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Chrome 86+</li>
              <li>Edge 86+</li>
              <li>Opera 72+</li>
              <li>Brave 1.22+</li>
            </ul>
            <p className="mt-2">Note for Brave users: Make sure you've enabled "File System Access API" in brave://flags</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HelpModal;
