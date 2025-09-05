import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Verificar se o bucket 'attachments' existe
    const { data: buckets, error: listError } = await supabaseAdmin
      .storage
      .listBuckets()

    if (listError) {
      return NextResponse.json({ 
        error: 'Failed to list buckets',
        details: listError 
      }, { status: 500 })
    }

    const attachmentsBucket = buckets?.find(bucket => bucket.name === 'attachments')

    if (!attachmentsBucket) {
      // Criar o bucket se não existir
      const { data: newBucket, error: createError } = await supabaseAdmin
        .storage
        .createBucket('attachments', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
          ]
        })

      if (createError) {
        return NextResponse.json({ 
          error: 'Failed to create bucket',
          details: createError 
        }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Bucket created successfully',
        bucket: newBucket
      })
    }

    return NextResponse.json({
      message: 'Bucket already exists',
      bucket: attachmentsBucket
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}