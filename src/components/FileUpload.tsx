import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  className?: string;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'complete' | 'error';
}

const FileUpload: React.FC<FileUploadProps> = ({ className }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'uploading' as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload process
    newFiles.forEach((uploadFile) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'complete' as const } : f
          )
        );
      }, Math.random() * 2000 + 1000);
    });

    toast({
      title: "Files Added",
      description: `${newFiles.length} file(s) added to upload queue.`,
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      
      const { files: droppedFiles } = e.dataTransfer;
      if (droppedFiles?.length) {
        handleFiles(droppedFiles);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files: selectedFiles } = e.target;
      if (selectedFiles?.length) {
        handleFiles(selectedFiles);
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const handleSubmit = useCallback(() => {
    const completeFiles = files.filter((f) => f.status === 'complete');
    
    if (completeFiles.length === 0) {
      toast({
        title: "No Files Ready",
        description: "Please wait for files to finish uploading or add new files.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Processing Files",
      description: `Processing ${completeFiles.length} file(s) to generate course requirements graph.`,
    });

    // Here you would process the files and update the course graph
    console.log('Processing files:', completeFiles.map(f => f.file.name));
  }, [files]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={cn("academic-card", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Course Files
        </CardTitle>
        <CardDescription>
          Upload course catalog files, transcripts, or requirement documents to generate your graduation path.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop files here, or click to select
          </p>
          <p className="text-xs text-muted-foreground">
            Supports PDF, TXT, CSV, and other document formats
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept=".pdf,.txt,.csv,.doc,.docx,.xlsx,.xls"
        />

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Files ({files.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'uploading' && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    )}
                    {uploadFile.status === 'complete' && (
                      <CheckCircle className="h-4 w-4 text-accent" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="academic"
            onClick={handleSubmit}
            disabled={files.filter((f) => f.status === 'complete').length === 0}
            className="flex-1"
          >
            Generate Course Graph
          </Button>
          <Button
            variant="outline"
            onClick={() => setFiles([])}
            disabled={files.length === 0}
          >
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;