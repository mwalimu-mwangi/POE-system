import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileUp, X } from "lucide-react";

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  acceptedFileTypes?: string;
  maxFileSizeMB?: number;
  multiple?: boolean;
  maxFiles?: number;
}

export function FileUploader({
  onFilesChange,
  acceptedFileTypes,
  maxFileSizeMB = 20,
  multiple = false,
  maxFiles = 10
}: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newFiles = [...selectedFiles];

    for (const file of fileList) {
      // Check file size
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        continue;
      }

      if (!multiple) {
        // Replace existing file
        newFiles.splice(0, newFiles.length, file);
        break;
      } else if (newFiles.length < maxFiles) {
        // Add file to the list
        newFiles.push(file);
      }
    }

    setSelectedFiles(newFiles);
    onFilesChange(newFiles);
    
    // Reset the input value to enable selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    onFilesChange(newFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newFiles = [...selectedFiles];

    for (const file of fileList) {
      // Check file size
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        continue;
      }

      if (!multiple) {
        // Replace existing file
        newFiles.splice(0, newFiles.length, file);
        break;
      } else if (newFiles.length < maxFiles) {
        // Add file to the list
        newFiles.push(file);
      }
    }

    setSelectedFiles(newFiles);
    onFilesChange(newFiles);
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        className="hidden"
        accept={acceptedFileTypes}
        onChange={handleFileChange}
        multiple={multiple}
        ref={fileInputRef}
      />
      
      <Card
        className={`border-2 border-dashed p-6 text-center ${
          isDragging ? "border-primary bg-primary/5" : "border-neutral-200"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <FileUp className="h-10 w-10 text-neutral-400" />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Drag and drop {multiple ? "files" : "a file"} here
            </h3>
            <p className="text-xs text-neutral-500">
              or
            </p>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBrowseClick}
            >
              Browse Files
            </Button>
          </div>
        </div>
      </Card>

      {selectedFiles.length > 0 && (
        <ul className="mt-4 space-y-2">
          {selectedFiles.map((file, index) => (
            <li key={index} className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-md border border-neutral-200">
              <div className="flex items-center overflow-hidden">
                <span className="text-sm font-medium truncate">{file.name}</span>
                <span className="ml-2 text-xs text-neutral-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleRemoveFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
