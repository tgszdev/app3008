'use client'

import { useState } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface RichTextRendererProps {
  content: string
  className?: string
}

export default function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement
      setLightboxImage(img.src)
      setZoom(1) // Reset zoom ao abrir
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  return (
    <>
      <div
        className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none overflow-hidden break-words ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
        onClick={handleImageClick}
      />

      {/* Lightbox com Zoom */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => { setLightboxImage(null); setZoom(1); }}
        >
          {/* Botão Fechar */}
          <button
            onClick={() => { setLightboxImage(null); setZoom(1); }}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            aria-label="Fechar"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Controles de Zoom */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Aumentar zoom"
              title="Zoom In (+ ou scroll do mouse)"
            >
              <ZoomIn className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Diminuir zoom"
              title="Zoom Out (- ou scroll do mouse)"
            >
              <ZoomOut className="w-6 h-6 text-white" />
            </button>
            <div className="px-3 py-2 bg-white/10 rounded-full text-white text-sm font-medium text-center">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Container da Imagem com Scroll */}
          <div 
            className="relative w-full h-full overflow-auto flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
          >
            <img
              src={lightboxImage}
              alt="Visualização em tela cheia"
              className="rounded-xl transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom})`,
                maxWidth: zoom > 1 ? 'none' : '90vw',
                maxHeight: zoom > 1 ? 'none' : '90vh',
                objectFit: 'contain'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .prose {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .prose img {
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 12px;
          max-width: 100% !important;
          width: auto !important;
          height: auto !important;
          display: block;
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

