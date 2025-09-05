// Configuração dos buckets do Supabase Storage
export const STORAGE_BUCKETS = {
  TICKET_ATTACHMENTS: 'TICKET-ATTACHMENTS', // Nome exato como no Supabase
  ATTACHMENTS: 'ATTACHMENTS', 
  AVATARS: 'AVATARS'
} as const

// Função para obter a URL pública de um arquivo
export function getPublicUrl(bucketName: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL não está configurada')
    return ''
  }
  
  // Remover barras iniciais do path se houver
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cleanPath}`
}

// Função para obter URL de anexo de ticket
export function getAttachmentUrl(attachment: {
  file_url?: string
  storage_path?: string
  bucket_name?: string
}): string {
  // Se já tem uma URL completa, retornar ela
  if (attachment.file_url?.startsWith('http')) {
    return attachment.file_url
  }
  
  // Determinar o bucket (preferência: bucket_name > ticket-attachments > attachments)
  const bucket = attachment.bucket_name || 
                 STORAGE_BUCKETS.TICKET_ATTACHMENTS // Use ticket-attachments como padrão
  
  // Se tem storage_path, construir a URL
  if (attachment.storage_path) {
    return getPublicUrl(bucket, attachment.storage_path)
  }
  
  // Fallback para file_url se existir
  return attachment.file_url || ''
}

// Função para verificar se um arquivo é uma imagem
export function isImageFile(fileName: string, mimeType?: string): boolean {
  if (mimeType?.startsWith('image/')) {
    return true
  }
  
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i
  return imageExtensions.test(fileName)
}