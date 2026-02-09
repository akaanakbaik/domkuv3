import { NextRequest, NextResponse } from 'next/server'
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import geoip from 'geoip-lite'
import securityManager from './lib/security'

const locales = ['en', 'id']
const defaultLocale = 'en'

function getLocale(request: NextRequest): string {
  const ip = getClientIP(request)
  const geo = geoip.lookup(ip)
  
  if (geo && geo.country === 'ID') {
    return 'id'
  }
  
  const headers = { 'accept-language': request.headers.get('accept-language') || 'en' }
  const languages = new Negotiator({ headers }).languages()
  
  return match(languages, locales, defaultLocale)
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP
  
  return request.ip || 'unknown'
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  const securityCheck = securityManager.detectAttack(request)
  if (securityCheck.isAttack && securityCheck.severity === 'HIGH') {
    return NextResponse.json(
      { error: 'Access denied', code: 'BLOCKED_IP' },
      { status: 403, headers: securityManager.getSecurityHeaders() }
    )
  }
  
  const rateLimit = await securityManager.checkRateLimit(getClientIP(request), pathname)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.error, retryAfter: rateLimit.retryAfter },
      { 
        status: 429,
        headers: {
          ...securityManager.getSecurityHeaders(),
          'Retry-After': rateLimit.retryAfter?.toString() || '1',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '1',
        }
      }
    )
  }
  
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)
    
    const newUrl = new URL(
      `/${locale}${pathname === '/' ? '/~' : pathname}`,
      request.url
    )
    
    const response = NextResponse.redirect(newUrl)
    
    Object.entries(securityManager.getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  }
  
  const response = NextResponse.next()
  
  Object.entries(securityManager.getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|files/|robots.txt|sitemap.xml).*)',
  ],
}