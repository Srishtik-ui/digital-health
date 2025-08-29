"use client";

import type { FC } from 'react';
import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { RawLog } from '@/lib/types';

interface UploadDataButtonProps {
  onDataUploaded: (data: RawLog[]) => void;
}

export const UploadDataButton: FC<UploadDataButtonProps> = ({ onDataUploaded }) => {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // The data is stored as a JSON string in the `logs` property.
          const parsed = JSON.parse(content);
          const logs = (parsed.logs || parsed).map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          }));
          onDataUploaded(logs);
          toast({
            title: "Success",
            description: "Your data has been uploaded and analyzed.",
          });
        } catch (error) {
          console.error("Failed to parse uploaded file:", error);
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "The uploaded file is not valid JSON. Please try again.",
          });
        }
      };
      reader.readAsText(file);
    }
    // Reset file input to allow uploading the same file again
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        Upload Data
      </Button>
      <Input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="application/json"
      />
    </>
  );
};
