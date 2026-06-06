"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import api from "@/lib/api";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface LotImage {
  id: string;
  fileName: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

interface ImageUploadProps {
  lotId: string;
  existingImages?: LotImage[];
  onImagesChange?: (images: LotImage[]) => void;
}

export default function ImageUpload({ lotId, existingImages = [], onImagesChange }: ImageUploadProps) {
  const [images, setImages] = useState<LotImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    setError(null);
    setProgress(0);
    setUploading(true);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 10 * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        setError(`Формат ${file.name} не поддерживается`);
        setUploading(false);
        setProgress(0);
        return;
      }
      if (file.size > maxSize) {
        setError(`Файл ${file.name} превышает 10МБ`);
        setUploading(false);
        setProgress(0);
        return;
      }
    }

    try {
      const uploadedImages: LotImage[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post(`/api/lots/${lotId}/images`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const fileProgress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            const overallProgress = Math.round(((i + fileProgress / 100) / totalFiles) * 100);
            setProgress(overallProgress);
          },
        });

        if (Array.isArray(response.data)) {
          uploadedImages.push(...response.data);
        }
      }

      setProgress(100);
      const newImages = [...images, ...uploadedImages];
      setImages(newImages);
      onImagesChange?.(newImages);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { errors?: { generalErrors?: string[] } } } };
      const errors = axiosError.response?.data?.errors?.generalErrors;
      setError(errors?.[0] || "Ошибка загрузки изображений");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, [lotId, images, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleDelete = useCallback(async (imageId: string) => {
    try {
      await api.delete(`/api/lots/${lotId}/images/${imageId}`);
      const newImages = images.filter((img) => img.id !== imageId);
      setImages(newImages);
      onImagesChange?.(newImages);
    } catch (err) {
      console.error(`Failed to delete image ${imageId}:`, err);
      setError("Ошибка удаления изображения");
    }
  }, [lotId, images, onImagesChange]);

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-[10px] p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-gold bg-gold/5"
            : "border-border hover:border-gold/50 hover:bg-gold/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <Upload className="w-8 h-8 mx-auto mb-3 text-text3" />
        <p className="text-[14px] text-text2 font-light">
          {uploading ? "Загрузка..." : "Перетащите изображения или нажмите для выбора"}
        </p>
        <p className="text-[12px] text-text3 mt-1">
          JPEG, PNG, WebP, GIF (макс. 10МБ)
        </p>
      </div>

      {error && (
        <p className="text-[13px] text-red-400 font-light">{error}</p>
      )}

      {uploading && progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-[12px] text-text2">
            <span>Загрузка...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-bg2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="relative aspect-square bg-bg2 border border-border rounded-[8px] overflow-hidden">
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={image.fileName}
                    fill
                    sizes="(max-width: 640px) 50vw, 160px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-text3" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image.id);
                }}
                className="absolute top-2 right-2 p-1 bg-bg/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
              >
                <X className="w-4 h-4 text-text" />
              </button>
              <p className="text-[11px] text-text3 mt-1 truncate">{image.fileName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
