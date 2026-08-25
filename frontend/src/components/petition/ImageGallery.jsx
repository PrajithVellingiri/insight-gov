import { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/api/petitions.api';

export default function ImageGallery({ images, title = "Attached Photos" }) {
  const [lightbox, setLightbox] = useState(null);
  if (!images?.length) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        <ImageIcon size={13} className="inline mr-1" /> {title} ({images.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setLightbox(img)}
            className="aspect-square rounded-xl overflow-hidden border border-border hover:opacity-90 transition-opacity bg-muted"
          >
            <img
              src={getImageUrl(img.stored_path)}
              alt={img.filename}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-black/40"
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>
          <img
            src={getImageUrl(lightbox.stored_path)}
            alt={lightbox.filename}
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
