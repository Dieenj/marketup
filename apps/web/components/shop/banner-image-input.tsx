'use client';

import { useRef, useState } from 'react';
import { ImageUp, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import api, { getErrorMessage } from '@/lib/api-client';
import RemoteImage from '@/components/remote-image';
import { ACCEPTED_IMAGE_TYPES, imageFileError } from '@/lib/image-upload';

interface BannerImageInputProps {
  value: string;
  onChange: (url: string) => void;
}

// Banner chỉ nhận ảnh upload (lưu trên Cloudinary) để luôn được tối ưu qua CDN và không phụ thuộc link ngoài
export function BannerImageInput({ value, onChange }: BannerImageInputProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const fileError = imageFileError(file);
    if (fileError) {
      toast.error(fileError);
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<{ url: string }>('/upload/image', formData);
      onChange(data.url);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to upload image. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const openPicker = () => fileInputRef.current?.click();

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {value ? (
        // Đã có banner: xem trước + nút Thay ảnh / Xoá luôn hiện (dùng được trên cảm ứng)
        <div
          className={cn(
            'relative h-36 overflow-hidden rounded-xl border',
            dragOver && 'ring-2 ring-ring',
          )}
          {...dropHandlers}
        >
          <RemoteImage
            src={value}
            alt="Banner preview"
            fill
            sizes="(min-width: 768px) 600px, 100vw"
            className="object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Spinner className="size-5" />
            </div>
          )}
          <div className="absolute right-2 bottom-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={openPicker}
              disabled={uploading}
            >
              <ImageUp />
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onChange('')}
              disabled={uploading}
            >
              <X />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className={cn(
            'flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            dragOver
              ? 'border-foreground bg-muted/60'
              : 'border-border hover:border-foreground/40 hover:bg-muted/30',
            uploading && 'opacity-60',
          )}
          {...dropHandlers}
        >
          {uploading ? (
            <Spinner className="size-5 text-muted-foreground" />
          ) : (
            <>
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Upload className="size-4 text-muted-foreground" />
              </span>
              <span className="text-center text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Click to upload</span> or drag & drop
                <br />
                PNG, JPG, WebP — max 10MB
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
