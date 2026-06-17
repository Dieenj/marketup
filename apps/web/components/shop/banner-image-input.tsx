'use client';

import { useRef, useState } from 'react';
import { ImageIcon, Link2, Upload, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import api from '@/lib/api-client';

interface BannerImageInputProps {
  value: string;
  onChange: (url: string) => void;
}

type Mode = 'upload' | 'url';

export function BannerImageInput({ value, onChange }: BannerImageInputProps) {
  const [mode, setMode] = useState<Mode>('upload');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {([['upload', Upload, 'Upload file'], ['url', Link2, 'Enter URL']] as const).map(
          ([m, Icon, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === m
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ),
        )}
      </div>

      {mode === 'upload' ? (
        <div className="space-y-2">
          {/* Drop zone */}
          <div
            className={cn(
              'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors cursor-pointer',
              dragOver ? 'border-foreground bg-muted/60' : 'border-border hover:border-foreground/40 hover:bg-muted/30',
              uploading && 'pointer-events-none opacity-60',
              'h-28',
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : (
              <>
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  <span className="font-medium text-foreground">Click to upload</span> or drag & drop
                  <br />
                  PNG, JPG, WebP — max 10MB
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>

          {/* Preview */}
          {value && (
            <div className="relative group rounded-xl overflow-hidden border border-border h-32">
              <img src={value} alt="Banner preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/90 hover:bg-white text-foreground text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  <X className="h-3 w-3" />
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/banner.jpg"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {value && (
            <div className="relative rounded-xl overflow-hidden border border-border h-32">
              <img
                src={value}
                alt="Banner preview"
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}
          {!value && (
            <div className="flex items-center justify-center h-20 rounded-xl border border-dashed border-border bg-muted/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                Preview will appear here
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
