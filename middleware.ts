import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { i18nRouter } from 'next-i18n-router'
import i18nConfig from './i18n/config'
import geoip from 'geoip-lite'
import rateLimit from './lib/rate-limit'
import securityHeaders from './lib/security-headers'

const limiter = rateLimit({
  interval: 1000,
  uniqueTokenPerInterval: 500,
})

export async function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const pathname = request.nextUrl.pathname
  const userAgent = request.headers.get('user-agent') || ''

  try {
    await limiter.check(10, ip)
  } catch {
    const telegram = (await import('./lib/telegram')).default
    await telegram.sendAlert(`🚨 Rate limit exceeded: ${ip} - ${pathname}`)
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later.'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      }
    )
  }

  const securityResponse = securityHeaders(request)
  if (securityResponse) return securityResponse

  const geo = geoip.lookup(ip)
  const country = geo?.country || 'US'
  const locale = country === 'ID' ? 'id' : 'en'

  if (pathname === '/' || pathname === '') {
    return NextResponse.redirect(new URL(`/${locale}/~`, request.url))
  }

  const response = i18nRouter(request, i18nConfig)

  response.headers.set('X-IP-Address', ip)
  response.headers.set('X-Country', country)
  response.headers.set('X-Locale', locale)

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    '/api/(.*)',
  ]
}