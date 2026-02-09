import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { v4 as uuidv4 } from 'uuid'
import { hash } from 'crypto'
import dbManager from '@/lib/database'
import securityManager from '@/lib/security'
import { telegramBot } from '@/lib/telegram-bot'
import { sanitizeFilename, formatBytes } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const ip = securityManager.getClientIP(request)
    
    const securityCheck = securityManager.detectAttack(request)
    if (securityCheck.isAttack) {
      await securityManager.blockIP(ip, `Attack detected: ${securityCheck.indicators.join(', ')}`)
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: "Security violation detected"
        },
        { status: 403, headers: securityManager.getSecurityHeaders() }
      )
    }
    
    const rateLimit = await securityManager.checkRateLimit(ip, 'upload')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: rateLimit.error
        },
        {
          status: 429,
          headers: {
            ...securityManager.getSecurityHeaders(),
            'Retry-After': rateLimit.retryAfter?.toString() || '1'
          }
        }
      )
    }
    
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (files.length === 0) {
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: "No files provided"
        },
        { status: 400, headers: securityManager.getSecurityHeaders() }
      )
    }
    
    if (files.length > 5) {
      await securityManager.blockIP(ip, "Too many files attempted", 3600000)
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: "Maximum 5 files allowed per request"
        },
        { status: 400, headers: securityManager.getSecurityHeaders() }
      )
    }
    
    const uploads = []
    const uploadedFiles = []
    
    for (const file of files) {
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const fileSize = fileBuffer.length
      
      if (fileSize > 100 * 1024 * 1024) {
        return NextResponse.json(
          {
            author: "aka",
            email: "akaanakbaik17@proton.me",
            success: false,
            error: `File ${file.name} exceeds 100MB limit`
          },
          { status: 413, headers: securityManager.getSecurityHeaders() }
        )
      }
      
      const fileHash = hash('sha256', fileBuffer).digest('hex')
      const fileId = uuidv4().replace(/-/g, '').substring(0, 12)
      const sanitizedName = sanitizeFilename(file.name)
      const fileExtension = sanitizedName.split('.').pop() || 'bin'
      const finalFilename = `${fileId}.${fileExtension}`
      
      const optimalDb = await dbManager.selectOptimalDatabase(file.type, fileSize)
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kabox.my.id'
      
      let fileUrl = ''
      let dbResponse: any
      
      try {
        switch (optimalDb) {
          case 'cloudinary':
            const cloudinary = await dbManager.getDatabase('cloudinary')
            const cloudinaryResult = await cloudinary.uploader.upload(
              `data:${file.type};base64,${fileBuffer.toString('base64')}`,
              {
                public_id: fileId,
                folder: 'kabox',
                resource_type: 'auto'
              }
            )
            fileUrl = cloudinaryResult.secure_url
            dbResponse = cloudinaryResult
            break
            
          case 'imagekit':
            const imagekit = await dbManager.getDatabase('imagekit')
            const imagekitResult = await imagekit.upload({
              file: fileBuffer,
              fileName: finalFilename,
              useUniqueFileName: false
            })
            fileUrl = imagekitResult.url
            dbResponse = imagekitResult
            break
            
          case 'supabase':
            const supabase = await dbManager.getDatabase('supabase')
            const supabaseResult = await supabase.storage
              .from('files')
              .upload(finalFilename, fileBuffer, {
                contentType: file.type,
                upsert: false
              })
            
            if (supabaseResult.error) throw supabaseResult.error
            
            const supabaseUrl = supabase.storage
              .from('files')
              .getPublicUrl(finalFilename)
            
            fileUrl = supabaseUrl.data.publicUrl
            dbResponse = supabaseResult
            break
            
          case 'neon':
          case 'turso':
          default:
            const tempPath = join(tmpdir(), finalFilename)
            await writeFile(tempPath, fileBuffer)
            
            const storageUrl = `${baseUrl}/files/${finalFilename}`
            fileUrl = storageUrl
            dbResponse = { path: tempPath }
            break
        }
        
        const fileMetadata = {
          id: fileId,
          name: sanitizedName,
          size: fileSize,
          mimeType: file.type,
          hash: fileHash,
          dbType: optimalDb,
          url: fileUrl
        }
        
        await dbManager.storeFileMetadata(fileMetadata)
        
        uploadedFiles.push({
          id: fileId,
          filename: sanitizedName,
          size: fileSize,
          mimeType: file.type,
          url: fileUrl,
          dbType: optimalDb,
          createdAt: new Date().toISOString()
        })
        
        uploads.push({
          filename: sanitizedName,
          size: formatBytes(fileSize),
          db: optimalDb,
          status: 'success'
        })
        
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error)
        uploads.push({
          filename: sanitizedName,
          size: formatBytes(fileSize),
          db: optimalDb,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    await telegramBot.sendUploadNotification({
      ip,
      files: uploads,
      totalFiles: files.length,
      successfulUploads: uploadedFiles.length,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      {
        author: "aka",
        email: "akaanakbaik17@proton.me",
        success: true,
        data: uploadedFiles,
        message: `Successfully uploaded ${uploadedFiles.length} of ${files.length} files`
      },
      { headers: securityManager.getSecurityHeaders() }
    )
    
  } catch (error) {
    console.error('Upload route error:', error)
    
    await telegramBot.sendErrorNotification({
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/upload',
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      {
        author: "aka",
        email: "akaanakbaik17@proton.me",
        success: false,
        error: "Internal server error"
      },
      { status: 500, headers: securityManager.getSecurityHeaders() }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}