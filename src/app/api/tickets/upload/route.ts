import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const ticketId = formData.get('ticketId') as string
    const userId = formData.get('userId') as string

    if (!file || !ticketId || !userId) {
      return NextResponse.json(
        { error: 'Arquivo, ticket ID e user ID são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo permitido: 10MB' },
        { status: 400 }
      )
    }

    // Criar nome único para o arquivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const fileExt = file.name.split('.').pop()
    const fileName = `${ticketId}/${timestamp}-${randomString}.${fileExt}`

    // Converter arquivo para buffer
    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('ticket-attachments')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      
      // Se o bucket não existir, tentar criar
      if (uploadError.message?.includes('Bucket not found')) {
        // Criar bucket
        const { error: bucketError } = await supabaseAdmin
          .storage
          .createBucket('ticket-attachments', {
            public: false,
          })
        
        if (bucketError) {
          console.error('Erro ao criar bucket:', bucketError)
          return NextResponse.json(
            { error: 'Erro ao configurar armazenamento. Configure o bucket "ticket-attachments" no Supabase.' },
            { status: 500 }
          )
        }

        // Tentar upload novamente
        const { data: retryData, error: retryError } = await supabaseAdmin
          .storage
          .from('ticket-attachments')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false
          })

        if (retryError) {
          return NextResponse.json(
            { error: 'Erro ao fazer upload do arquivo' },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Erro ao fazer upload do arquivo' },
          { status: 500 }
        )
      }
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabaseAdmin
      .storage
      .from('ticket-attachments')
      .getPublicUrl(fileName)

    // Salvar informações do anexo no banco
    const { data: attachment, error: dbError } = await supabaseAdmin
      .from('ticket_attachments')
      .insert({
        ticket_id: ticketId,
        uploaded_by: userId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: urlData.publicUrl,
        storage_path: fileName,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError)
      
      // Se a tabela não existir, retornar instrução
      if (dbError.message?.includes('relation') && dbError.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Tabela de anexos não existe. Execute o script de criação no Supabase.',
          uploaded: true,
          url: urlData.publicUrl,
          needsTable: true
        }, { status: 500 })
      }
      
      // Mesmo com erro no banco, o arquivo foi uploaded
      return NextResponse.json({
        warning: 'Arquivo enviado mas não registrado no banco',
        url: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size
      })
    }

    return NextResponse.json({
      success: true,
      attachment: attachment || {
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type
      }
    })

  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Listar anexos de um ticket
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticketId')

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID é obrigatório' },
        { status: 400 }
      )
    }

    const { data: attachments, error } = await supabaseAdmin
      .from('ticket_attachments')
      .select(`
        *,
        uploader:users!ticket_attachments_uploaded_by_fkey(id, name, email)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar anexos:', error)
      
      // Se for erro de foreign key, buscar sem a relação
      if (error.message?.includes('relationship')) {
        const { data: simpleAttachments } = await supabaseAdmin
          .from('ticket_attachments')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false })
        
        return NextResponse.json(simpleAttachments || [])
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(attachments || [])
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir anexo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('id')
    const storagePath = searchParams.get('path')

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'ID do anexo é obrigatório' },
        { status: 400 }
      )
    }

    // Excluir do Storage se o path foi fornecido
    if (storagePath) {
      const { error: storageError } = await supabaseAdmin
        .storage
        .from('ticket-attachments')
        .remove([storagePath])

      if (storageError) {
        console.error('Erro ao excluir do storage:', storageError)
      }
    }

    // Excluir do banco
    const { error: dbError } = await supabaseAdmin
      .from('ticket_attachments')
      .delete()
      .eq('id', attachmentId)

    if (dbError) {
      console.error('Erro ao excluir do banco:', dbError)
      return NextResponse.json(
        { error: 'Erro ao excluir anexo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}