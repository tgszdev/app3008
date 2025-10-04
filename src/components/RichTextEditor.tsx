'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { 
  Bold, Italic, List, ListOrdered, Link as LinkIcon, 
  Image as ImageIcon, Heading1, Heading2, Code, Quote,
  Loader2, AlertCircle, Check, X
} from 'lucide-react'
import { useState, useCallback, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Digite / para comandos ou cole imagens diretamente...',
  className = '',
  minHeight = '300px'
}: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true, // Temporário durante upload
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto my-2 cursor-pointer hover:shadow-lg transition-shadow',
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none px-4 py-3',
      },
      handleDrop: (view, event, slice, moved) => {
        // Handle image drops
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const files = Array.from(event.dataTransfer.files)
          const imageFiles = files.filter(file => file.type.startsWith('image/'))
          
          if (imageFiles.length > 0) {
            event.preventDefault()
            imageFiles.forEach(file => handleImageUpload(file))
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        // Handle image paste
        const items = event.clipboardData?.items
        if (!items) return false

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file) {
              handleImageUpload(file)
            }
            return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const handleImageUpload = async (file: File) => {
    if (!editor) return

    // Validações básicas
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('Imagem muito grande. Tamanho máximo: 5MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF')
      return
    }

    setIsUploading(true)

    // Criar preview temporário com base64
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result && editor) {
        // Inserir imagem temporária
        editor.chain().focus().setImage({ 
          src: reader.result as string,
          alt: 'Carregando...'
        }).run()
      }
    }
    reader.readAsDataURL(file)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const { url } = response.data

      // Substituir imagem temporária pela URL real
      const { state } = editor
      const { doc } = state
      
      // Encontrar e substituir a última imagem base64 pela URL real
      let foundImage = false
      doc.descendants((node, pos) => {
        if (foundImage) return false
        if (node.type.name === 'image' && node.attrs.src?.startsWith('data:')) {
          editor.commands.setNodeSelection(pos)
          editor.commands.updateAttributes('image', {
            src: url,
            alt: file.name
          })
          foundImage = true
          return false
        }
      })

      toast.success('Imagem adicionada com sucesso!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fazer upload da imagem')
      
      // Remover imagem temporária em caso de erro
      const { state } = editor
      const { doc } = state
      
      doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src?.startsWith('data:')) {
          editor.commands.setNodeSelection(pos)
          editor.commands.deleteSelection()
        }
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    e.target.value = ''
  }

  const addLink = () => {
    const url = window.prompt('Cole a URL:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-2xl bg-gray-50 dark:bg-gray-800">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className={`relative border border-gray-300 dark:border-gray-600 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
      {/* Toolbar Minimalista - Estilo ClickUp */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            editor.isActive('bold') 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            editor.isActive('italic') 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Itálico (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            editor.isActive('bulletList') 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Lista"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            editor.isActive('orderedList') 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Lista Numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          type="button"
          onClick={addLink}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            editor.isActive('link') 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Adicionar Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          title="Adicionar Imagem"
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Input oculto para upload de imagem */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
        capture="environment" // Suporte para câmera no mobile
      />

      {/* Indicador de upload */}
      {isUploading && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-xl shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Fazendo upload...</span>
        </div>
      )}

      {/* Editor - Área principal */}
      <div 
        className="overflow-y-auto" 
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Dica de uso - Footer minimalista */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              Arraste ou cole imagens
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Code className="w-3 h-3" />
              Selecione texto para formatar
            </span>
          </div>
          {isUploading && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processando...
            </span>
          )}
        </div>
      </div>

      {/* Estilos customizados para parecer com ClickUp */}
      <style jsx global>{`
        .ProseMirror {
          min-height: ${minHeight};
        }

        .ProseMirror:focus {
          outline: none;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }

        .ProseMirror img {
          border-radius: 12px;
          max-width: 100%;
          height: auto;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ProseMirror img:hover {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          transform: scale(1.01);
        }

        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Estilo ClickUp para listas */
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .ProseMirror li {
          margin: 0.25rem 0;
        }

        /* Estilo ClickUp para headings */
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
          line-height: 1.2;
        }

        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem;
          line-height: 1.3;
        }

        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.5rem 0 0.25rem;
          line-height: 1.4;
        }

        /* Estilo para código inline */
        .ProseMirror code {
          background-color: rgba(135, 131, 120, 0.15);
          color: #eb5757;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        }

        /* Estilo para blockquote */
        .ProseMirror blockquote {
          border-left: 3px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
          font-style: italic;
        }

        /* Dark mode adjustments */
        .dark .ProseMirror code {
          background-color: rgba(255, 255, 255, 0.1);
          color: #ff6b6b;
        }

        .dark .ProseMirror blockquote {
          border-left-color: #60a5fa;
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}
