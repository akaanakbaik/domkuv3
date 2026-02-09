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
    
    const rateLimit = await securityManager.checkRateLimit(ip, 'file_status')
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
          success: true,
          data: {
            id,
            name: "Unknown",
            size: 0,
            status: "not_found",
            message: "File not found or not yet processed",
            chunked: false,
            chunkCount: 0
          }
        },
        { headers: securityManager.getSecurityHeaders() }
      )
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kabox.my.id'
    
    const responseData = {
      id: fileMetadata.id,
      name: fileMetadata.filename,
      size: parseInt(fileMetadata.size),
      status: "completed",
      message: "Upload completed successfully",
      chunked: false,
      chunkCount: 0,
      downloadUrl: `${baseUrl}/files/${id}/download`
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
    console.error('File status route error:', error)
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