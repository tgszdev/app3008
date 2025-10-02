import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import sharp from 'sharp'

// Configurações
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_WIDTH = 1920
const MAX_HEIGHT = 1920
const QUALITY = 80

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter dados do usuário
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', session.user.email)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF' },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Processar imagem com sharp
    let processedBuffer: Buffer
    let contentType = 'image/webp' // Converter tudo para WebP para melhor compressão

    try {
      // Se for GIF, não processar (manter animação)
      if (file.type === 'image/gif') {
        processedBuffer = buffer
        contentType = 'image/gif'
      } else {
        // Otimizar e redimensionar
        processedBuffer = await sharp(buffer)
          .resize(MAX_WIDTH, MAX_HEIGHT, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: QUALITY })
          .toBuffer()
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
      return NextResponse.json(
        { error: 'Erro ao processar imagem' },
        { status: 500 }
      )
    }

    // Gerar nome único
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = contentType === 'image/gif' ? 'gif' : 'webp'
    const fileName = `ticket-${timestamp}-${randomString}.${extension}`
    const filePath = `${userData.id}/${fileName}`

    console.log('[Upload API] Uploading file:', {
      originalName: file.name,
      originalSize: file.size,
      originalType: file.type,
      processedSize: processedBuffer.length,
      processedType: contentType,
      filePath
    })

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('ticket-images')
      .upload(filePath, processedBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[Upload API] Error uploading to Supabase:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao fazer upload da imagem' },
        { status: 500 }
      )
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('ticket-images')
      .getPublicUrl(filePath)

    console.log('[Upload API] Upload successful:', {
      path: uploadData.path,
      url: publicUrl
    })

    // Retornar URL
    return NextResponse.json({
      url: publicUrl,
      path: filePath,
      size: processedBuffer.length,
      originalSize: file.size,
      type: contentType
    })

  } catch (error: any) {
    console.error('[Upload API] Error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error?.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

