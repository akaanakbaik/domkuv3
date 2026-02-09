import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const crypto = window.crypto || (window as any).msCrypto
  
  if (crypto && crypto.getRandomValues) {
    const values = new Uint8Array(length)
    crypto.getRandomValues(values)
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length]
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }
  
  return result
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function isValidUrl(string: string) {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (_) {
    return false
  }
}

export function sanitizeFilename(filename: string) {
  return filename
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 255)
}

export function getFileExtension(filename: string) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export function truncateString(str: string, length: number) {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

export function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text)
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

export function getBrowserInfo() {
  if (typeof window === 'undefined') return null
  
  const ua = navigator.userAgent
  let browser = 'Unknown'
  let version = ''
  let os = 'Unknown'
  
  if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox'
    version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || ''
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    browser = 'Chrome'
    version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || ''
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browser = 'Safari'
    version = ua.match(/Version\/([0-9.]+)/)?.[1] || ''
  } else if (ua.indexOf('Edg') > -1) {
    browser = 'Edge'
    version = ua.match(/Edg\/([0-9.]+)/)?.[1] || ''
  }
  
  if (ua.indexOf('Windows') > -1) {
    os = 'Windows'
  } else if (ua.indexOf('Mac') > -1) {
    os = 'macOS'
  } else if (ua.indexOf('Linux') > -1) {
    os = 'Linux'
  } else if (ua.indexOf('Android') > -1) {
    os = 'Android'
  } else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1) {
    os = 'iOS'
  }
  
  return { browser, version, os }
}