'use client'

import { useState, useEffect } from 'react'
import { X, Download, ExternalLink, AlertCircle } from 'lucide-react'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  fileName: string
  fileSize?: number
  fileType?: string
}

export default function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  fileName, 
  fileSize,
  fileType 
}: ImageModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div 
        className="relative max-w-[90vw] max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-900 bg-opacity-90 backdrop-blur-sm p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[300px]">
              {fileName}
            </h3>
            {fileSize && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(fileSize)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex items-center justify-center p-16 pt-20">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-gray-900 dark:text-white font-semibold mb-2">
                Erro ao carregar imagem
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                A imagem não pôde ser carregada. Tente fazer o download.
              </p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Baixar arquivo
              </button>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={fileName}
              className="max-w-full max-h-[70vh] object-contain"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false)
                setError(true)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}