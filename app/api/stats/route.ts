import { NextRequest, NextResponse } from 'next/server'
import dbManager from '@/lib/database'
import securityManager from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const ip = securityManager.getClientIP(request)
    
    const rateLimit = await securityManager.checkRateLimit(ip, 'stats')
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
    
    const stats = await dbManager.getStats()
    const geo = securityManager.getGeoLocation(ip)
    
    const now = new Date()
    const uptime = process.uptime()
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    
    const formattedStats = {
      totalFiles: stats.totalFiles,
      totalSize: formatBytes(stats.totalSize),
      uptime: `${days}d ${hours}h ${minutes}m`,
      databases: Object.keys(stats.databases).length,
      activeUploads: 0,
      countries: geo?.country ? 1 : 0,
      databaseBreakdown: stats.databases,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      timestamp: now.toISOString(),
      version: '1.0.0'
    }
    
    return NextResponse.json(
      {
        author: "aka",
        email: "akaanakbaik17@proton.me",
        success: true,
        data: formattedStats
      },
      { headers: securityManager.getSecurityHeaders() }
    )
    
  } catch (error) {
    console.error('Stats route error:', error)
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