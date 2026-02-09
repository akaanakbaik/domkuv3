import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible'
import Redis from 'redis'
import geoip from 'geoip-lite'
import UAParser from 'ua-parser-js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import CryptoJS from 'crypto-js'
import { NextRequest } from 'next/server'

class SecurityManager {
  private rateLimiter
  private redis
  private blockedIPs = new Set<string>()
  private suspiciousPatterns = [
    /\.\.\//,
    /\/etc\/passwd/,
    /\/bin\/sh/,
    /union.*select/i,
    /insert.*into/i,
    /drop.*table/i,
    /script.*>/i,
    /onload=/i,
    /onerror=/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i
  ]
  
  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = Redis.createClient({ url: process.env.REDIS_URL })
      this.redis.connect()
      this.rateLimiter = new RateLimiterRedis({
        storeClient: this.redis,
        points: parseInt(process.env.API_RATE_LIMIT || '10'),
        duration: parseInt(process.env.API_RATE_WINDOW || '1')
      })
    } else {
      this.rateLimiter = new RateLimiterMemory({
        points: parseInt(process.env.API_RATE_LIMIT || '10'),
        duration: parseInt(process.env.API_RATE_WINDOW || '1')
      })
    }
    
    this.loadBlockedIPs()
    setInterval(() => this.cleanupBlockedIPs(), 60000)
  }
  
  async checkRateLimit(ip: string, endpoint: string = 'global') {
    try {
      const key = `rate_limit:${ip}:${endpoint}`
      await this.rateLimiter.consume(key)
      return { allowed: true, remaining: 0 }
    } catch (rateLimiterRes) {
      if (rateLimiterRes instanceof Error) {
        console.error('Rate limiter error:', rateLimiterRes)
        return { allowed: true, remaining: 0 }
      }
      
      const retrySecs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1
      return {
        allowed: false,
        remaining: 0,
        retryAfter: retrySecs,
        error: `Rate limit exceeded. Try again in ${retrySecs} seconds.`
      }
    }
  }
  
  async blockIP(ip: string, reason: string, duration: number = 3600000) {
    this.blockedIPs.add(ip)
    
    if (this.redis) {
      await this.redis.setEx(`blocked:${ip}`, duration, reason)
    }
    
    this.logSecurityEvent('IP_BLOCKED', { ip, reason, duration })
  }
  
  isIPBlocked(ip: string) {
    return this.blockedIPs.has(ip) || 
           (process.env.IP_BLACKLIST || '').split(',').includes(ip)
  }
  
  async loadBlockedIPs() {
    if (!this.redis) return
    
    try {
      const keys = await this.redis.keys('blocked:*')
      for (const key of keys) {
        const ip = key.replace('blocked:', '')
        this.blockedIPs.add(ip)
      }
    } catch (error) {
      console.error('Error loading blocked IPs:', error)
    }
  }
  
  async cleanupBlockedIPs() {
    if (!this.redis) return
    
    try {
      const keys = await this.redis.keys('blocked:*')
      for (const key of keys) {
        const ttl = await this.redis.ttl(key)
        if (ttl <= 0) {
          const ip = key.replace('blocked:', '')
          this.blockedIPs.delete(ip)
          await this.redis.del(key)
        }
      }
    } catch (error) {
      console.error('Error cleaning up blocked IPs:', error)
    }
  }
  
  validateInput(input: string, type: 'filename' | 'url' | 'text' | 'id') {
    if (!input || typeof input !== 'string') return false
    
    const sanitized = this.sanitize(input)
    
    switch (type) {
      case 'filename':
        return sanitized.length <= 255 && 
               !this.suspiciousPatterns.some(pattern => pattern.test(sanitized)) &&
               /^[a-zA-Z0-9._\-\s]+$/.test(sanitized)
      
      case 'url':
        try {
          const url = new URL(sanitized)
          return ['http:', 'https:'].includes(url.protocol) &&
                 url.hostname.length <= 253 &&
                 !this.suspiciousPatterns.some(pattern => pattern.test(sanitized))
        } catch {
          return false
        }
      
      case 'id':
        return /^[a-zA-Z0-9]{8,32}$/.test(sanitized)
      
      case 'text':
        return sanitized.length <= 1000 &&
               !this.suspiciousPatterns.some(pattern => pattern.test(sanitized))
      
      default:
        return false
    }
  }
  
  sanitize(input: string) {
    if (typeof input !== 'string') return ''
    
    let sanitized = input
      .replace(/[<>]/g, '') 
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim()
    
    this.suspiciousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })
    
    return sanitized
  }
  
  detectAttack(request: NextRequest) {
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const parser = new UAParser(userAgent)
    const ua = parser.getResult()
    
    const attackIndicators = []
    
    if (this.isIPBlocked(ip)) {
      attackIndicators.push('BLOCKED_IP')
    }
    
    if (userAgent.includes('curl') || userAgent.includes('wget')) {
      attackIndicators.push('CLI_TOOL')
    }
    
    if (ua.browser.name === 'Unknown' || !ua.browser.name) {
      attackIndicators.push('UNKNOWN_BROWSER')
    }
    
    const referer = request.headers.get('referer')
    if (referer && !this.validateInput(referer, 'url')) {
      attackIndicators.push('SUSPICIOUS_REFERER')
    }
    
    const url = request.nextUrl.toString()
    if (url.includes('..') || url.includes('//')) {
      attackIndicators.push('PATH_TRAVERSAL')
    }
    
    const contentType = request.headers.get('content-type')
    if (contentType && !['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'].some(t => contentType.includes(t))) {
      attackIndicators.push('UNSUPPORTED_CONTENT_TYPE')
    }
    
    if (attackIndicators.length > 0) {
      this.logSecurityEvent('ATTACK_DETECTED', {
        ip,
        userAgent,
        attackIndicators,
        url
      })
      
      if (attackIndicators.includes('BLOCKED_IP') || 
          attackIndicators.includes('PATH_TRAVERSAL')) {
        this.blockIP(ip, `Attack detected: ${attackIndicators.join(', ')}`)
      }
      
      return {
        isAttack: true,
        indicators: attackIndicators,
        severity: attackIndicators.includes('BLOCKED_IP') ? 'HIGH' : 'MEDIUM'
      }
    }
    
    return { isAttack: false, indicators: [], severity: 'LOW' }
  }
  
  getClientIP(request: NextRequest) {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    const realIP = request.headers.get('x-real-ip')
    if (realIP) return realIP
    
    return request.ip || 'unknown'
  }
  
  getGeoLocation(ip: string) {
    const geo = geoip.lookup(ip)
    if (!geo) return null
    
    return {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      timezone: geo.timezone,
      ll: geo.ll
    }
  }
  
  async hashPassword(password: string) {
    return await bcrypt.hash(password, 12)
  }
  
  async verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash)
  }
  
  generateToken(payload: object, expiresIn: string = '7d') {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn })
  }
  
  verifyToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!)
    } catch {
      return null
    }
  }
  
  encrypt(text: string) {
    return CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_KEY!).toString()
  }
  
  decrypt(ciphertext: string) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.ENCRYPTION_KEY!)
    return bytes.toString(CryptoJS.enc.Utf8)
  }
  
  generateSecureId(length: number = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    let result = ''
    const crypto = require('crypto')
    
    const randomBytes = crypto.randomBytes(length)
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length]
    }
    
    return result
  }
  
  async logSecurityEvent(event: string, data: any) {
    const logEntry = {
      event,
      timestamp: new Date().toISOString(),
      data: typeof data === 'object' ? JSON.stringify(data) : data
    }
    
    console.log(`[SECURITY] ${event}:`, data)
    
    if (this.redis) {
      await this.redis.lPush('security_logs', JSON.stringify(logEntry))
      await this.redis.lTrim('security_logs', 0, 999)
    }
  }
  
  getSecurityHeaders() {
    return {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }
  }
}

export const securityManager = new SecurityManager()
export default securityManager