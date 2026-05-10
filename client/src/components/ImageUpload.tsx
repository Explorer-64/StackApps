import { useState, useRef, useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';

interface Props {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
}

export function ImageUpload({ onImageUploaded, currentImageUrl }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentImageUrl) {
      setPreviewUrl(currentImageUrl);
    }
  }, [currentImageUrl]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setPreviewUrl(data.url);
      onImageUploaded(data.url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to process image. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging ? 'border-neon-blue bg-neon-blue/10' : 'border-cyber-light hover:border-neon-blue/50'}
          ${isUploading ? 'opacity-50 cursor-wait' : ''}
        `}
        data-testid="input-image-upload"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
          data-agent-id="listing-thumbnail-file"
        />

        {previewUrl ? (
          <div className="space-y-3">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-40 mx-auto rounded"
            />
            <p className="text-sm text-gray-400">
              Click or drag to replace image
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <svg className="w-12 h-12 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="text-gray-300 font-medium">
                {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-500">PNG, JPG, WebP up to 10MB — auto-optimized on upload</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
