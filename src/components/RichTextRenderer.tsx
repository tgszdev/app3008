'use client'

import { useState } from 'react'
import { X, ZoomIn } from 'lucide-react'

interface RichTextRendererProps {
  content: string
  className?: string
}

export default function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement
      setLightboxImage(img.src)
    }
  }

  return (
    <>
      <div
        className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
        onClick={handleImageClick}
        style={{
          // Estilos para imagens
          cursor: 'pointer',
        }}
      />

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative max-w-7xl max-h-full">
            <img
              src={lightboxImage}
              alt="Visualização em tela cheia"
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm flex items-center gap-2">
              <ZoomIn className="w-4 h-4" />
              Clique fora para fechar
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .prose img {
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 12px;
          max-width: 100%;
          height: auto;
        }
        
        .prose img:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .prose a {
          color: #2563eb;
          text-decoration: underline;
        }

        .prose a:hover {
          color: #1d4ed8;
        }

        .dark .prose a {
          color: #60a5fa;
        }

        .dark .prose a:hover {
          color: #93c5fd;
        }
      `}</style>
    </>
  )
}

