import { NextRequest, NextResponse } from 'next/server'
import dbManager from '@/lib/database'
import securityManager from '@/lib/security'
import { telegramBot } from '@/lib/telegram-bot'

export async function POST(request: NextRequest) {
  try {
    const ip = securityManager.getClientIP(request)
    
    const securityCheck = securityManager.detectAttack(request)
    if (securityCheck.isAttack) {
      await securityManager.blockIP(ip, `Attack detected in URL upload: ${securityCheck.indicators.join(', ')}`)
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
    
    const rateLimit = await securityManager.checkRateLimit(ip, 'upload_url')
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
    
    const body = await request.json().catch(() => null)
    
    if (!body || !body.url) {
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: "URL parameter is required"
        },
        { status: 400, headers: securityManager.getSecurityHeaders() }
      )
    }
    
    const url = body.url.toString()
    
    if (!securityManager.validateInput(url, 'url')) {
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: "Invalid URL format"
        },
        { status: 400, headers: securityManager.getSecurityHeaders() }
      )
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Kabox-CDN/1.0'
      }
    })
    
    if (!response.ok) {
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`
        },
        { status: 400, headers: securityManager.getSecurityHeaders() }
      )
    }
    
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentLength = response.headers.get('content-length')
    const fileSize = contentLength ? parseInt(contentLength) : 0
    
    if (fileSize > 100 * 1024 * 1024) {
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: "File size exceeds 100MB limit"
        },
        { status: 413, headers: securityManager.getSecurityHeaders() }
      )
    }
    
    const fileBuffer = Buffer.from(await response.arrayBuffer())
    const fileHash = require('crypto').createHash('sha256').update(fileBuffer).digest('hex')
    const fileId = require('uuid').v4().replace(/-/g, '').substring(0, 12)
    
    const urlParts = new URL(url)
    const originalFilename = urlParts.pathname.split('/').pop() || 'file.bin'
    const fileExtension = originalFilename.split('.').pop() || 'bin'
    const finalFilename = `${fileId}.${fileExtension}`
    
    const optimalDb = await dbManager.selectOptimalDatabase(contentType, fileSize)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kabox.my.id'
    
    let fileUrl = ''
    
    try {
      switch (optimalDb) {
        case 'cloudinary':
          const cloudinary = await dbManager.getDatabase('cloudinary')
          const cloudinaryResult = await cloudinary.uploader.upload(
            `data:${contentType};base64,${fileBuffer.toString('base64')}`,
            {
              public_id: fileId,
              folder: 'kabox',
              resource_type: 'auto'
            }
          )
          fileUrl = cloudinaryResult.secure_url
          break
          
        case 'imagekit':
          const imagekit = await dbManager.getDatabase('imagekit')
          const imagekitResult = await imagekit.upload({
            file: fileBuffer,
            fileName: finalFilename,
            useUniqueFileName: false
          })
          fileUrl = imagekitResult.url
          break
          
        default:
          fileUrl = `${baseUrl}/files/${finalFilename}`
          break
      }
      
      const fileMetadata = {
        id: fileId,
        name: originalFilename,
        size: fileSize,
        mimeType: contentType,
        hash: fileHash,
        dbType: optimalDb,
        url: fileUrl,
        sourceUrl: url
      }
      
      await dbManager.storeFileMetadata(fileMetadata)
      
      await telegramBot.sendUploadNotification({
        ip,
        files: [{
          filename: originalFilename,
          size: formatBytes(fileSize),
          db: optimalDb,
          status: 'success'
        }],
        totalFiles: 1,
        successfulUploads: 1,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: true,
          data: {
            id: fileId,
            filename: originalFilename,
            size: fileSize,
            mimeType: contentType,
            url: fileUrl,
            dbType: optimalDb,
            createdAt: new Date().toISOString()
          }
        },
        { headers: securityManager.getSecurityHeaders() }
      )
      
    } catch (error) {
      console.error('URL upload error:', error)
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: "Failed to process URL upload"
        },
        { status: 500, headers: securityManager.getSecurityHeaders() }
      )
    }
    
  } catch (error) {
    console.error('URL upload route error:', error)
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}