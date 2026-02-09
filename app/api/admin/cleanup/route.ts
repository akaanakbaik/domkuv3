import { NextRequest, NextResponse } from 'next/server'
import dbManager from '@/lib/database'
import securityManager from '@/lib/security'
import { telegramBot } from '@/lib/telegram-bot'

export async function POST(request: NextRequest) {
  try {
    const ip = securityManager.getClientIP(request)
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: "Authentication required"
        },
        { status: 401, headers: securityManager.getSecurityHeaders() }
      )
    }
    
    const token = authHeader.substring(7)
    const verified = securityManager.verifyToken(token)
    
    if (!verified || (verified as any).role !== 'admin') {
      return NextResponse.json(
        {
          author: "aka",
          email: "akaanakbaik17@proton.me",
          success: false,
          error: "Invalid or expired token"
        },
        { status: 403, headers: securityManager.getSecurityHeaders() }
      )
    }
    
    const rateLimit = await securityManager.checkRateLimit(ip, 'admin_cleanup')
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
    
    const startTime = Date.now()
    
    await dbManager.cleanupExpiredFiles()
    
    const executionTime = Date.now() - startTime
    
    await telegramBot.sendOwnerNotification(
      `🧹 System cleanup completed in ${executionTime}ms\n` +
      `Initiated by admin API`
    )
    
    return NextResponse.json(
      {
        author: "aka",
        email: "akaanakbaik17@proton.me",
        success: true,
        message: "Cleanup completed successfully",
        executionTime: `${executionTime}ms`
      },
      { headers: securityManager.getSecurityHeaders() }
    )
    
  } catch (error) {
    console.error('Admin cleanup error:', error)
    
    await telegramBot.sendErrorNotification({
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/admin/cleanup',
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