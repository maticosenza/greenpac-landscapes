import { useState, useRef } from "react";
import { Paperclip, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileUploadFieldProps {
  files: string[];
  onFilesChange: (files: string[]) => void;
  maxFiles?: number;
  acceptedTypes?: string;
}

const FileUploadField = ({
  files,
  onFilesChange,
  maxFiles = 5,
  acceptedTypes = ".pdf,.doc,.docx,.xls,.xlsx",
}: FileUploadFieldProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(selectedFiles)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} excede el tamaño máximo de 10MB`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("quotation-attachments")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Error al subir ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("quotation-attachments")
          .getPublicUrl(filePath);

        uploadedUrls.push(filePath);
      }

      if (uploadedUrls.length > 0) {
        onFilesChange([...files, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} archivo(s) adjuntado(s)`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error al subir archivos");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = async (filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from("quotation-attachments")
        .remove([filePath]);

      if (error) {
        console.error("Delete error:", error);
      }

      onFilesChange(files.filter((f) => f !== filePath));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const getFileName = (path: string) => {
    const parts = path.split("/");
    const fileName = parts[parts.length - 1];
    // Remove the timestamp prefix for display
    return fileName.replace(/^\d+-[a-z0-9]+\./, "archivo.");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || files.length >= maxFiles}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4 mr-2" />
          )}
          Adjuntar archivo
        </Button>
        <span className="text-xs text-muted-foreground">
          PDF, DOC, XLS (máx. 10MB c/u)
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((filePath, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md text-sm"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="max-w-[150px] truncate">{getFileName(filePath)}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(filePath)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadField;
