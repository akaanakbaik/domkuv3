import { NextRequest, NextResponse } from 'next/server'
import dbManager from '@/lib/database'
import securityManager from '@/lib/security'
import { telegramBot } from '@/lib/telegram-bot'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ip = securityManager.getClientIP(request)
    
    if (!securityManager.validateInput(id, 'id')) {
      await securityManager.blockIP(ip, "Invalid file ID in download", 3600000)
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: "Invalid file ID"
        },
        { status: 400, headers: securityManager.getSecurityHeaders() }
      )
    }
    
    const rateLimit = await securityManager.checkRateLimit(ip, 'file_download')
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
    
    const fileMetadata = await dbManager.getFileMetadata(id)
    
    if (!fileMetadata) {
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: "File not found"
        },
        { status: 404, headers: securityManager.getSecurityHeaders() }
      )
    }
    
    await dbManager.incrementDownloadCount(id)
    
    await telegramBot.sendDownloadNotification({
      ip,
      fileId: id,
      filename: fileMetadata.filename,
      size: fileMetadata.size,
      timestamp: new Date().toISOString()
    })
    
    let fileUrl = fileMetadata.url
    let shouldRedirect = true
    
    if (fileMetadata.db_type === 'supabase' || 
        fileMetadata.db_type === 'neon' || 
        fileMetadata.db_type === 'turso') {
      shouldRedirect = false
    }
    
    if (shouldRedirect) {
      return NextResponse.redirect(fileUrl, {
        headers: {
          ...securityManager.getSecurityHeaders(),
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
    } else {
      let fileData: Buffer | null = null
      
      try {
        switch (fileMetadata.db_type) {
          case 'supabase':
            const supabase = await dbManager.getDatabase('supabase')
            const { data, error } = await supabase.storage
              .from('files')
              .download(`${id}.${fileMetadata.filename.split('.').pop()}`)
            
            if (error) throw error
            fileData = Buffer.from(await data.arrayBuffer())
            break
            
          default:
            return NextResponse.redirect(fileUrl, {
              headers: securityManager.getSecurityHeaders()
            })
        }
        
        if (fileData) {
          const headers = new Headers(securityManager.getSecurityHeaders())
          headers.set('Content-Type', fileMetadata.mime_type)
          headers.set('Content-Length', fileMetadata.size.toString())
          headers.set('Content-Disposition', `attachment; filename="${fileMetadata.filename}"`)
          headers.set('Cache-Control', 'public, max-age=31536000, immutable')
          
          return new NextResponse(fileData, {
            status: 200,
            headers
          })
        }
        
      } catch (error) {
        console.error('Download error:', error)
        return NextResponse.json(
          {
            author: "aka",
            email: "akaanakbaik17@proton.me",
            success: false,
            error: "Failed to download file"
          },
          { status: 500, headers: securityManager.getSecurityHeaders() }
        )
      }
    }
    
    return NextResponse.redirect(fileUrl, {
      headers: securityManager.getSecurityHeaders()
    })
    
  } catch (error) {
    console.error('Download route error:', error)
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