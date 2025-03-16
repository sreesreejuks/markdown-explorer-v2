
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // Light theme for code blocks
import { FileEntry, readFileContent, isTextFile, getLanguageFromFileName } from '@/utils/fileSystem';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FileText, Eye, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FileViewerProps {
  file: FileEntry | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'preview'>('preview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const isMarkdown = file?.name.toLowerCase().endsWith('.md') || false;
  const { toast } = useToast();

  useEffect(() => {
    async function loadFileContent() {
      if (!file || file.kind !== 'file' || !file.handle) {
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
        
        // Ensure we're only passing a FileSystemFileHandle
        if (file.handle.kind === 'file') {
          const text = await readFileContent(file.handle);
          setContent(text);
        } else {
          setError('Cannot read content from a directory.');
        }
      } catch (err) {
        console.error('Error loading file:', err);
        setError('Failed to load file content.');
      } finally {
        setLoading(false);
      }
    }

    loadFileContent();
  }, [file]);

  // Reset view mode to preview when changing files
  useEffect(() => {
    if (file) {
       setViewMode(file.name.toLowerCase().endsWith('.md') ? 'preview' : 'raw');
     }
  }, [file?.path]);

  // Reset copied state after a delay
  useEffect(() => {
    if (copiedCode) {
      const timer = setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedCode]);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Copied to clipboard",
        description: "Code has been copied successfully",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy failed",
        description: "Could not copy code to clipboard",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  // Add line numbers to source view
  const renderSourceWithLineNumbers = () => {
    if (!content) return null;
    
    const lines = content.split('\n');
    return (
      <div className="font-mono text-sm">
        {lines.map((line, index) => (
          <div key={index} className="flex">
            <div className="text-gray-400 select-none w-10 text-right pr-2 mr-2 border-r border-gray-200">
              {index + 1}
            </div>
            <div className="whitespace-pre-wrap flex-1">{line}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full bg-white overflow-auto flex flex-col">
      <div className="sticky top-0 bg-white border-b p-2 text-sm font-medium z-10 flex justify-between items-center">
        <div className="truncate">{file.path}</div>
        
        {isMarkdown && (
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'raw' | 'preview')}>
            <ToggleGroupItem value="raw" aria-label="View raw markdown">
              <FileText className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Source</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="preview" aria-label="View rendered markdown">
              <Eye className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Preview</span>
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
      
      {isMarkdown && viewMode === 'preview' ? (
        <div className="p-6 markdown-body">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeHighlight]}
            components={{
              // This wrapper div applies our custom styles
              div: ({node, ...props}) => <div className="prose max-w-none" {...props} />,
              // Add data-language attribute to the pre tag for Mac OS style window title
              pre: ({node, children, className, ...props}) => {
                const language = className ? className.replace('language-', '') : '';
                return (
                  <div className="relative">
                    <pre data-language={language || 'Code'} {...props}>
                      {children}
                    </pre>
                    <button 
                      onClick={() => {
                        // Extract the code text from the pre element
                        const codeElement = (children as React.ReactElement)?.props?.children?.[0];
                        const codeText = codeElement?.props?.children?.[0] || '';
                        copyToClipboard(codeText);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                      title="Copy code"
                      aria-label="Copy code to clipboard"
                    >
                      {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                );
              },
              // Add anchor links to headings
              h1: ({node, children, ...props}) => {
                const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return <h1 id={id} {...props}><a href={`#${id}`} className="no-underline">{children}</a></h1>;
              },
              h2: ({node, children, ...props}) => {
                const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return <h2 id={id} {...props}><a href={`#${id}`} className="no-underline">{children}</a></h2>;
              },
              h3: ({node, children, ...props}) => {
                const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return <h3 id={id} {...props}><a href={`#${id}`} className="no-underline">{children}</a></h3>;
              },
              h4: ({node, children, ...props}) => {
                const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return <h4 id={id} {...props}><a href={`#${id}`} className="no-underline">{children}</a></h4>;
              },
              h5: ({node, children, ...props}) => {
                const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return <h5 id={id} {...props}><a href={`#${id}`} className="no-underline">{children}</a></h5>;
              },
              h6: ({node, children, ...props}) => {
                const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return <h6 id={id} {...props}><a href={`#${id}`} className="no-underline">{children}</a></h6>;
              },
              // Handle anchor links in table of contents
              a: ({node, href, children, ...props}) => {
                if (href?.startsWith('#')) {
                  return (
                    <a 
                      href={href} 
                      onClick={(e) => {
                        e.preventDefault();
                        const targetId = href.substring(1);
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                          targetElement.scrollIntoView({ behavior: 'smooth' });
                        }
                      }} 
                      {...props}
                    >
                      {children}
                    </a>
                  );
                }
                return <a href={href} {...props}>{children}</a>;
              }
            }}
          >
            {content || ''}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="p-4">
          {renderSourceWithLineNumbers()}
        </div>
      )}
    </div>
  );
};

export default FileViewer;
