import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, X, Loader2 } from 'lucide-react';

export default function ImageUpload({ value, onChange, placeholder = "Clique para enviar uma imagem", aspectRatio = "cover" }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const response = await base44.integrations.Core.UploadFile({ file });
    onChange(response.file_url);
    setUploading(false);
  };

  const heightClass = aspectRatio === 'square' ? 'aspect-square' : 'h-36';

  return (
    <div className="space-y-2">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative w-full ${heightClass} rounded-lg overflow-hidden bg-[#2A2A2A] border-2 border-dashed border-white/10 hover:border-white/30 cursor-pointer transition-colors flex items-center justify-center`}
      >
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-sm text-white font-medium">Trocar imagem</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-[#E50914]" />
            ) : (
              <>
                <Upload className="w-8 h-8" />
                <p className="text-xs text-center px-4">{placeholder}</p>
              </>
            )}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#E50914]" />
          </div>
        )}
      </div>

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
        >
          <X className="w-3 h-3" /> Remover imagem
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}