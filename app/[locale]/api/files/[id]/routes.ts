import { NextRequest, NextResponse } from 'next/server'
import dbManager from '@/lib/database'
import securityManager from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ip = securityManager.getClientIP(request)
    
    if (!securityManager.validateInput(id, 'id')) {
      await securityManager.blockIP(ip, "Invalid file ID format", 3600000)
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
    
    const rateLimit = await securityManager.checkRateLimit(ip, 'file_info')
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
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kabox.my.id'
    
    const responseData = {
      id: fileMetadata.id,
      name: fileMetadata.filename,
      size: parseInt(fileMetadata.size),
      mimeType: fileMetadata.mime_type,
      chunked: false,
      chunkCount: 0,
      checksum: fileMetadata.hash,
      createdAt: fileMetadata.created_at,
      downloads: fileMetadata.downloads || 0,
      downloadUrl: `${baseUrl}/files/${id}/download`,
      dbType: fileMetadata.db_type,
      url: fileMetadata.url
    }
    
    return NextResponse.json(
      {
        author: "aka",
        email: "akaanakbaik17@proton.me",
        success: true,
        data: responseData
      },
      { headers: securityManager.getSecurityHeaders() }
    )
    
  } catch (error) {
    console.error('File info route error:', error)
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