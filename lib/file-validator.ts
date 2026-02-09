import { fromBuffer } from 'file-type'
import { lookup } from 'mime-types'

interface ValidationResult {
  isValid: boolean
  error?: string
  mimeType?: string
  extension?: string
}

class FileValidator {
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  private readonly ALLOWED_MIME_TYPES = new Set([
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/x-flv',
    'video/matroska',
    'video/3gpp',
    'video/3gpp2',
    
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/flac',
    'audio/aac',
    'audio/x-m4a',
    'audio/webm',
    
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-bzip2',
    'application/x-xz',
    
    // Text
    'text/plain',
    'text/csv',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'application/xml',
    'text/xml',
    
    // Fonts
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    
    // Other
    'application/octet-stream',
  ])
  
  private readonly DANGEROUS_EXTENSIONS = new Set([
    '.exe', '.bat', '.cmd', '.sh', '.php', '.asp', '.aspx', '.jsp',
    '.pl', '.py', '.rb', '.jar', '.class', '.js', '.vbs', '.ps1',
    '.msi', '.com', '.scr', '.pif', '.application', '.gadget',
    '.msp', '.hta', '.cpl', '.msc', '.vb', '.vbe', '.ws', '.wsf',
    '.wsc', '.wsh', '.psc1', '.psc2', '.msh', '.msh1', '.msh2',
    '.mshxml', '.msh1xml', '.msh2xml', '.scf', '.lnk', '.inf',
    '.reg', '.docm', '.dotm', '.xlsm', '.xltm', '.xlam', '.pptm',
    '.potm', '.ppam', '.sldm', '.sldx'
  ])
  
  async validateFile(file: File): Promise<ValidationResult> {
    try {
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          isValid: false,
          error: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`
        }
      }
      
      const buffer = Buffer.from(await file.arrayBuffer())
      const fileTypeResult = await fromBuffer(buffer)
      
      let detectedMimeType = fileTypeResult?.mime
      const fileName = file.name.toLowerCase()
      const fileExtension = '.' + fileName.split('.').pop()
      
      if (this.DANGEROUS_EXTENSIONS.has(fileExtension)) {
        return {
          isValid: false,
          error: 'File type is not allowed for security reasons'
        }
      }
      
      if (!detectedMimeType) {
        const mimeFromExtension = lookup(fileName)
        if (mimeFromExtension) {
          detectedMimeType = mimeFromExtension
        } else {
          detectedMimeType = 'application/octet-stream'
        }
      }
      
      if (!this.ALLOWED_MIME_TYPES.has(detectedMimeType)) {
        return {
          isValid: false,
          error: `File type "${detectedMimeType}" is not supported`
        }
      }
      
      const declaredMimeType = file.type
      if (declaredMimeType && declaredMimeType !== 'application/octet-stream') {
        if (declaredMimeType !== detectedMimeType) {
          return {
            isValid: false,
            error: 'File type mismatch detected'
          }
        }
      }
      
      await this.scanForMaliciousContent(buffer, fileName)
      
      return {
        isValid: true,
        mimeType: detectedMimeType,
        extension: fileExtension
      }
      
    } catch (error) {
      console.error('File validation error:', error)
      return {
        isValid: false,
        error: 'Failed to validate file'
      }
    }
  }
  
  private async scanForMaliciousContent(buffer: Buffer, filename: string): Promise<void> {
    const content = buffer.toString('utf8', 0, 1024)
    
    const maliciousPatterns = [
      /<\s*script\s*>.*<\s*\/script\s*>/i,
      /javascript:/i,
      /vbscript:/i,
      /data:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i,
      /\.\.\//,
      /\/etc\/passwd/i,
      /\/bin\/sh/i,
      /union.*select/i,
      /insert.*into/i,
      /drop.*table/i,
      /delete.*from/i,
      /update.*set/i,
      /create.*table/i,
      /alter.*table/i,
      /exec\(/i,
      /system\(/i,
      /shell_exec\(/i,
      /passthru\(/i
    ]
    
    for (const pattern of maliciousPatterns) {
      if (pattern.test(content)) {
        throw new Error('File contains potentially malicious content')
      }
    }
    
    const hex = buffer.toString('hex', 0, 4)
    const dangerousMagicNumbers = [
      '4d5a', // EXE
      '5a4d', // EXE
      '7f454c46', // ELF
      '2321', // Shebang
      '4d534346', // MS Cabinet
      '504b0304', // ZIP
      '526172211a07', // RAR
      '377abcaf271c', // 7z
    ]
    
    for (const magic of dangerousMagicNumbers) {
      if (hex.startsWith(magic)) {
        const allowedWithMagic = ['.zip', '.rar', '.7z']
        if (!allowedWithMagic.some(ext => filename.endsWith(ext))) {
          throw new Error('File has executable signature but wrong extension')
        }
      }
    }
  }
  
  isExtensionAllowed(filename: string): boolean {
    const extension = '.' + filename.toLowerCase().split('.').pop()
    return !this.DANGEROUS_EXTENSIONS.has(extension)
  }
  
  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE
  }
  
  getAllowedMimeTypes(): string[] {
    return Array.from(this.ALLOWED_MIME_TYPES)
  }
  
  async getFileInfo(file: File): Promise<{
    size: number
    name: string
    type: string
    lastModified: number
  }> {
    return {
      size: file.size,
      name: file.name,
      type: file.type,
      lastModified: file.lastModified
    }
  }
}

export const fileValidator = new FileValidator()
export default fileValidator