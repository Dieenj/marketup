'use client';

import { useState, useRef } from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProductStep3Props {
  images: File[];
  onAddImages: (files: File[]) => void;
  onRemoveImage: (idx: number) => void;
  onClearAll: () => void;
}

export default function ImagesStep({
  images,
  onAddImages,
  onRemoveImage,
  onClearAll,
}: CreateProductStep3Props) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    const imgFiles = files.filter((f) => f.type.startsWith('image/'));
    onAddImages(imgFiles);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
      <div>
        <p className="text-sm font-medium">Product Images</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upload photos to show your product. First image will be the cover.
        </p>
      </div>

      {/* Khu vực kéo thả hoặc click chọn hình ảnh */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer py-10 gap-3',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200',
            isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          <Upload className="h-5 w-5" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragging ? 'Drop images here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB each</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
        />
      </div>

      {/* Xem trước các hình ảnh sản phẩm đã chọn */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              {images.length} image{images.length !== 1 ? 's' : ''} selected
            </p>
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
              >
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Preview ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 text-[9px] font-semibold bg-black/70 text-white rounded px-1.5 py-0.5">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(idx);
                  }}
                  className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {/* Thêm nhiều ảnh khác */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
