import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileText, Eye, Split, Save, Copy, Check, FolderOpen, LayoutTemplate, Plus, Image as ImageIcon, Table, Bold, Italic, List, ListOrdered, Quote, Link, Heading1, Heading2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface MarkdownEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  fileHandle?: FileSystemFileHandle;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface TableDialogProps {
  onInsert: (tableMarkdown: string) => void;
}

const TableDialog: React.FC<TableDialogProps> = ({ onInsert }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hasHeader, setHasHeader] = useState(true);
  const [alignment, setAlignment] = useState<string[]>([]); // Array of alignments for each column

  const generateTable = () => {
    let table = '\n';
    // Header if enabled
    if (hasHeader) {
      table += '|' + ' Header '.repeat(cols) + '|\n';
      // Alignment row with selected alignments
      table += '|' + Array(cols).fill(0).map((_, i) => {
        switch(alignment[i] || 'left') {
          case 'center': return ' :---: |';
          case 'right': return ' ---: |';
          default: return ' :--- |';
        }
      }).join('') + '\n';
    } else {
      // Simple separator row if no header
      table += '|' + ' --- |'.repeat(cols) + '\n';
    }
    // Data rows
    for (let i = 0; i < rows; i++) {
      table += '|' + ' Cell |'.repeat(cols) + '\n';
    }
    table += '\n';
    onInsert(table);
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Insert Table</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rows">Rows</Label>
            <Input
              id="rows"
              type="number"
              min="1"
              value={rows}
              onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div>
            <Label htmlFor="cols">Columns</Label>
            <Input
              id="cols"
              type="number"
              min="1"
              value={cols}
              onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasHeader"
            checked={hasHeader}
            onCheckedChange={(checked) => setHasHeader(!!checked)}
          />
          <Label htmlFor="hasHeader">Include header row</Label>
        </div>
        {hasHeader && (
          <div>
            <Label>Column Alignments</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Array(cols).fill(0).map((_, i) => (
                <Select
                  key={i}
                  value={alignment[i] || 'left'}
                  onValueChange={(value) => {
                    const newAlignment = [...alignment];
                    newAlignment[i] = value;
                    setAlignment(newAlignment);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Align" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              ))}
            </div>
          </div>
        )}
        <Button onClick={generateTable}>Insert Table</Button>
      </div>
    </DialogContent>
  );
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialContent = '',
  onSave,
  fileHandle: initialFileHandle,
}): JSX.Element => {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'edit'>('preview');
  const [fileName, setFileName] = useState('untitled.md');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | undefined>(initialFileHandle);
  const [isEdited, setIsEdited] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsEdited(true);
  }, []);

  const handleSave = async () => {
    try {
      let handle = fileHandle;
      
      if (!handle) {
        handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Markdown files',
            accept: {
              'text/markdown': ['.md']
            }
          }]
        });
        setFileHandle(handle);
        setFileName(handle.name);
      }

      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();

      if (onSave) {
        onSave(content);
      }

      setIsEdited(false);
      toast({
        title: "Success",
        description: "File saved successfully!",
        duration: 2000
      });
    } catch (err) {
      console.error('Failed to save file:', err);
      toast({
        title: "Error",
        description: "Failed to save file. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleNewFile = useCallback(() => {
    if (isEdited && !confirm('Are you sure you want to create a new file? Any unsaved changes will be lost.')) {
      return;
    }
    setContent('');
    setFileName('untitled.md');
    setFileHandle(undefined);
    setIsEdited(false);
  }, [isEdited]);

  const handleOpenFile = async () => {
    try {
      if (content && !confirm('Are you sure you want to open a file? Any unsaved changes will be lost.')) {
        return;
      }

      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Markdown files',
          accept: {
            'text/markdown': ['.md']
          }
        }]
      });

      const file = await handle.getFile();
      const text = await file.text();
      
      setContent(text);
      setFileName(handle.name);
      setFileHandle(handle);
    } catch (err) {
      console.error('Failed to open file:', err);
      alert('Failed to open file. Please try again.');
    }
  };

  const copyToClipboard = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: "Copied",
        description: "Code copied to clipboard",
        duration: 1500
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
        duration: 2000
      });
    }
  }, []);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items || !textareaRef.current) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        try {
          // Convert image to base64
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            const imageMarkdown = `\n![Image](${base64})\n`;
            
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            
            textarea.value = text.substring(0, start) + imageMarkdown + text.substring(end);
            setContent(textarea.value);
            setIsEdited(true);
            
            // Update cursor position
            textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
          };
          reader.readAsDataURL(file);
        } catch (err) {
          console.error('Failed to process pasted image:', err);
          toast({
            title: "Error",
            description: "Failed to process pasted image",
            variant: "destructive",
          });
        }
      }
    }
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !textareaRef.current) return;

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const imageMarkdown = `\n![Image](${base64})\n`;
        
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        textarea.value = text.substring(0, start) + imageMarkdown + text.substring(end);
        setContent(textarea.value);
        setIsEdited(true);
        
        // Update cursor position
        textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to process uploaded image:', err);
      toast({
        title: "Error",
        description: "Failed to process uploaded image",
        variant: "destructive",
      });
    }
  }, []);

  const insertTable = useCallback((tableMarkdown: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    textarea.value = text.substring(0, start) + tableMarkdown + text.substring(end);
    setContent(textarea.value);
    setIsEdited(true);
    
    // Update cursor position
    textarea.selectionStart = textarea.selectionEnd = start + tableMarkdown.length;
  }, []);

  const insertMarkdownSyntax = useCallback((syntax: { prefix: string, suffix?: string }) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const newText = syntax.suffix 
      ? `${text.substring(0, start)}${syntax.prefix}${selectedText}${syntax.suffix}${text.substring(end)}`
      : `${text.substring(0, start)}${syntax.prefix}${text.substring(end)}`;
    
    setContent(newText);
    setIsEdited(true);
    
    // Update cursor position
    textarea.focus();
    const newCursorPos = start + syntax.prefix.length;
    textarea.selectionStart = newCursorPos;
    textarea.selectionEnd = newCursorPos + selectedText.length;
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.addEventListener('paste', handlePaste);
    return () => {
      textarea.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const CodeBlock = ({ inline, className, children }: CodeProps) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    const code = String(children).replace(/\n$/, '');
    const lines = code.split('\n').length;

    return !inline && match ? (
      <div className="relative rounded-lg overflow-hidden my-4 border border-gray-200">
        {/* MacOS-style header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center flex-1">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <div className="flex-1 text-center text-xs text-gray-500 font-medium">
              {language}
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(code)}
            className="p-1.5 rounded-md bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            title="Copy code"
            aria-label="Copy code to clipboard"
          >
            {copiedCode === code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <div className="relative">
          {/* Line numbers */}
          <div className="absolute left-0 top-[0.75rem] bottom-[0.75rem] w-[3.5rem] bg-gray-50 border-r border-gray-200 text-gray-400 text-xs select-none overflow-hidden font-mono">
            {Array.from({ length: lines }, (_, i) => (
              <div key={i} className="px-2 leading-[1.5rem] text-center">
                {i + 1}
              </div>
            ))}
          </div>
          <SyntaxHighlighter
            style={oneLight}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '0.75rem 0.75rem 0.75rem 4rem',
              borderRadius: '0 0 0.5rem 0.5rem',
              background: '#ffffff',
              fontSize: '0.875rem',
              lineHeight: '1.5rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            }}
            showLineNumbers={false}
            wrapLines={true}
            wrapLongLines={true}
            codeTagProps={{
              style: {
                display: 'block',
                lineHeight: '1.5rem',
                fontSize: '0.875rem',
                fontFamily: 'inherit'
              }
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    ) : (
      <code className={className}>
        {children}
      </code>
    );
  };

  const renderToolbar = () => {
    if (viewMode === 'preview') return null;

    return (
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => insertMarkdownSyntax({ prefix: '**', suffix: '**' })}
                aria-label="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold (Ctrl+B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => insertMarkdownSyntax({ prefix: '_', suffix: '_' })}
                aria-label="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic (Ctrl+I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => insertMarkdownSyntax({ prefix: '# ' })}
                aria-label="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => insertMarkdownSyntax({ prefix: '## ' })}
                aria-label="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => insertMarkdownSyntax({ prefix: '- ' })}
                aria-label="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => insertMarkdownSyntax({ prefix: '1. ' })}
                aria-label="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => insertMarkdownSyntax({ prefix: '> ' })}
                aria-label="Quote"
              >
                <Quote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quote</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => insertMarkdownSyntax({ prefix: '[', suffix: '](url)' })}
                aria-label="Link"
              >
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Link</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col" role="application" aria-label="Markdown Editor">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b" role="toolbar" aria-label="Editor Toolbar">
        {viewMode !== 'preview' && (
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNewFile}
                    aria-label="Create new file"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create New File (Ctrl+N)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload image"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload Image</TooltipContent>
              </Tooltip>

              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    aria-label="Insert table"
                  >
                    <Table className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <TableDialog onInsert={insertTable} />
              </Dialog>
            </TooltipProvider>
            <span className="text-sm text-gray-500 ml-2" role="status" aria-label="File name">
              {fileName}{isEdited && '*'}
            </span>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as typeof viewMode)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="edit" aria-label="Edit mode">
                    <FileText className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Edit Mode</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="split" aria-label="Split view">
                    <Split className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Split View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="preview" aria-label="Preview mode">
                    <LayoutTemplate className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Preview Mode</TooltipContent>
              </Tooltip>
            </ToggleGroup>
            {viewMode !== 'preview' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSave}
                    disabled={!isEdited}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Changes (Ctrl+S)</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      {renderToolbar()}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
        aria-hidden="true"
      />

      {/* Editor and Preview */}
      <div className="flex-1 flex overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} p-4`}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              className="w-full h-full p-4 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Write your markdown here..."
              aria-label="Markdown input"
              role="textbox"
              aria-multiline="true"
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div 
            className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} p-4 overflow-auto`}
            role="region"
            aria-label="Preview"
          >
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock,
                  h1: ({ children, ...props }) => {
                    const text = Array.isArray(children) ? children.join('') : String(children);
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <h1 
                        id={id} 
                        className="scroll-mt-20 text-3xl font-bold text-gray-900 border-b border-gray-200 pb-4 mb-6 mt-8 first:mt-2" 
                        {...props}
                      >
                        {children}
                      </h1>
                    );
                  },
                  h2: ({ children, ...props }) => {
                    const text = Array.isArray(children) ? children.join('') : String(children);
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <h2 
                        id={id} 
                        className="scroll-mt-20 text-2xl font-semibold text-gray-800 mt-8 mb-4" 
                        {...props}
                      >
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children, ...props }) => {
                    const text = Array.isArray(children) ? children.join('') : String(children);
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <h3 
                        id={id} 
                        className="scroll-mt-20 text-xl font-medium text-gray-800 mt-6 mb-3" 
                        {...props}
                      >
                        {children}
                      </h3>
                    );
                  },
                  h4: ({ children, ...props }) => {
                    const text = Array.isArray(children) ? children.join('') : String(children);
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <h4 
                        id={id} 
                        className="scroll-mt-20 text-lg font-medium text-gray-700 mt-6 mb-3" 
                        {...props}
                      >
                        {children}
                      </h4>
                    );
                  },
                  h5: ({ children, ...props }) => {
                    const text = Array.isArray(children) ? children.join('') : String(children);
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <h5 
                        id={id} 
                        className="scroll-mt-20 text-base font-medium text-gray-700 mt-4 mb-2" 
                        {...props}
                      >
                        {children}
                      </h5>
                    );
                  },
                  h6: ({ children, ...props }) => {
                    const text = Array.isArray(children) ? children.join('') : String(children);
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <h6 
                        id={id} 
                        className="scroll-mt-20 text-sm font-medium text-gray-600 mt-4 mb-2" 
                        {...props}
                      >
                        {children}
                      </h6>
                    );
                  },
                  p: ({ children }) => (
                    <p className="text-gray-600 leading-7 mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 my-4 space-y-2 text-gray-600">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 my-4 space-y-2 text-gray-600">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-7">
                      {children}
                    </li>
                  ),
                  a: ({ href, children }) => {
                    // Handle both relative and absolute URLs
                    if (href?.startsWith('#')) {
                      return (
                        <a 
                          href={href} 
                          className="text-primary hover:text-primary/80 underline"
                          onClick={(e) => {
                            e.preventDefault();
                            const targetId = href.slice(1); // Remove the # symbol
                            const text = decodeURIComponent(targetId);
                            // Generate ID in the same way as headers
                            const processedId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                            const element = document.getElementById(processedId);
                            
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                        >
                          {children}
                        </a>
                      );
                    }
                    // For external links
                    return (
                      <a 
                        href={href}
                        className="text-primary hover:text-primary/80 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor; 