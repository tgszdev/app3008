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

    // Buckets necessários
    const requiredBuckets = [
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

    // Configurar políticas RLS se necessário
    if (results.created.includes('attachments')) {
      // Permitir leitura pública
      await supabaseAdmin.rpc('create_storage_policy', {
        bucket_name: 'attachments',
        policy_name: 'Public read access',
        definition: 'true',
        operation: 'SELECT'
      }).catch(() => {
        // Ignorar erro se a política já existir
      })

      // Permitir upload para usuários autenticados
      await supabaseAdmin.rpc('create_storage_policy', {
        bucket_name: 'attachments',
        policy_name: 'Authenticated users can upload',
        definition: 'auth.uid() IS NOT NULL',
        operation: 'INSERT'
      }).catch(() => {
        // Ignorar erro se a política já existir
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Storage initialization complete',
      results,
      instructions: results.errors.length > 0 
        ? 'Alguns buckets não puderam ser criados. Verifique o Supabase Dashboard.'
        : 'Todos os buckets foram configurados com sucesso!'
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Verifique se as variáveis de ambiente do Supabase estão configuradas corretamente'
    }, { status: 500 })
  }
}