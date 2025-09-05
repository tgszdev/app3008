import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Verificar buckets existentes
    const { data: buckets, error: listError } = await supabaseAdmin
      .storage
      .listBuckets()

    if (listError) {
      return NextResponse.json({ 
        error: 'Failed to list buckets',
        details: listError.message,
        hint: 'Verifique se o Supabase Storage está habilitado no seu projeto'
      }, { status: 500 })
    }

    const results = {
      existingBuckets: buckets?.map(b => b.name) || [],
      created: [] as string[],
      errors: [] as any[]
    }

    // Buckets necessários (usando os nomes que já existem no Supabase)
    const requiredBuckets = [
      {
        name: 'ticket-attachments',
        options: {
          public: false, // Controlaremos acesso via políticas
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            'image/*',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
          ]
        }
      },
      {
        name: 'attachments',
        options: {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            'image/*',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
          ]
        }
      },
      {
        name: 'avatars',
        options: {
          public: true,
          fileSizeLimit: 2097152, // 2MB
          allowedMimeTypes: ['image/*']
        }
      }
    ]

    // Criar buckets que não existem
    for (const bucket of requiredBuckets) {
      const exists = buckets?.some(b => b.name === bucket.name)
      
      if (!exists) {
        const { data, error } = await supabaseAdmin
          .storage
          .createBucket(bucket.name, bucket.options)
        
        if (error) {
          results.errors.push({
            bucket: bucket.name,
            error: error.message
          })
        } else {
          results.created.push(bucket.name)
        }
      }
    }

    // Nota: As políticas RLS devem ser configuradas diretamente no Supabase Dashboard
    // ou através de SQL migrations, não através da API JavaScript

    return NextResponse.json({
      success: true,
      message: 'Storage initialization complete',
      results,
      instructions: results.errors.length > 0 
        ? 'Alguns buckets não puderam ser criados. Verifique o Supabase Dashboard.'
        : results.created.length > 0
        ? 'Buckets criados com sucesso! Configure as políticas RLS no Supabase Dashboard se necessário.'
        : 'Todos os buckets já existem.',
      nextSteps: results.created.includes('attachments') 
        ? [
            '1. Acesse o Supabase Dashboard',
            '2. Vá em Storage > Policies',
            '3. Para o bucket "attachments", adicione:',
            '   - Policy para SELECT: true (permite leitura pública)',
            '   - Policy para INSERT: auth.uid() IS NOT NULL (permite upload para usuários autenticados)'
          ]
        : null
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Verifique se as variáveis de ambiente do Supabase estão configuradas corretamente'
    }, { status: 500 })
  }
}