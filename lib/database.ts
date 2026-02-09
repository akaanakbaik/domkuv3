import { createClient } from '@supabase/supabase-js'
import { createClient as createTursoClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import cloudinary from 'cloudinary'
import ImageKit from 'imagekit'
import { eq, and, desc, sql } from 'drizzle-orm'
import { files, uploads, users, analytics } from './schema'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export const turso = createTursoClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
})

const neonSql = neon(process.env.NEON_DATABASE_URL!)
export const neonDb = drizzle({ client: neonSql })

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
})

export interface FileRecord {
  id: string
  originalName: string
  fileName: string
  fileSize: number
  mimeType: string
  storageProvider: 'supabase' | 'cloudinary' | 'imagekit' | 'neon' | 'turso'
  storagePath: string
  publicUrl: string
  shortUrl: string
  ipAddress: string
  country: string
  locale: string
  expiresAt: Date | null
  uploadToken: string
  isChunked: boolean
  chunkCount: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export class DatabaseManager {
  private providers: Array<'supabase' | 'cloudinary' | 'imagekit' | 'neon' | 'turso'>
  private currentIndex: number = 0
  
  constructor() {
    this.providers = ['supabase', 'cloudinary', 'imagekit', 'neon', 'turso']
  }
  
  private getNextProvider(): string {
    const provider = this.providers[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.providers.length
    return provider
  }
  
  async storeFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    ip: string,
    country: string,
    locale: string
  ): Promise<FileRecord> {
    const provider = this.getNextProvider()
    const fileId = this.generateFileId()
    const fileName = `${fileId}${this.getExtension(originalName)}`
    
    let publicUrl = ''
    let storagePath = ''
    
    switch (provider) {
      case 'supabase':
        const { data: supabaseData, error } = await supabase.storage
          .from('cdn-files')
          .upload(fileName, file, {
            contentType: mimeType,
            upsert: false
          })
        
        if (error) throw error
        
        storagePath = supabaseData.path
        publicUrl = `${supabaseUrl}/storage/v1/object/public/cdn-files/${fileName}`
        break
        
      case 'cloudinary':
        const cloudinaryResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream(
            {
              public_id: fileId,
              resource_type: 'auto'
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )
          uploadStream.end(file)
        })
        
        publicUrl = cloudinaryResult.secure_url
        storagePath = cloudinaryResult.public_id
        break
        
      case 'imagekit':
        const imagekitResult = await imagekit.upload({
          file: file,
          fileName: fileName,
          useUniqueFileName: false
        })
        
        publicUrl = imagekitResult.url
        storagePath = imagekitResult.fileId
        break
        
      case 'neon':
        const neonResult = await neonDb.insert(files).values({
          id: fileId,
          fileName,
          originalName,
          fileSize: file.length,
          mimeType,
          fileData: file,
          createdAt: new Date()
        }).returning()
        
        publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/files/${fileId}/download`
        storagePath = fileId
        break
        
      case 'turso':
        await turso.execute({
          sql: `
            INSERT INTO files (id, file_name, original_name, file_size, mime_type, file_data, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          args: [fileId, fileName, originalName, file.length, mimeType, file, new Date().toISOString()]
        })
        
        publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/files/${fileId}/download`
        storagePath = fileId
        break
    }
    
    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/files/${fileId}`
    
    const fileRecord: FileRecord = {
      id: fileId,
      originalName,
      fileName,
      fileSize: file.length,
      mimeType,
      storageProvider: provider,
      storagePath,
      publicUrl,
      shortUrl,
      ipAddress: ip,
      country,
      locale,
      expiresAt: null,
      uploadToken: this.generateToken(),
      isChunked: false,
      chunkCount: 0,
      status: 'completed',
      metadata: {
        provider,
        uploadedAt: new Date().toISOString()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await this.saveFileRecord(fileRecord)
    
    return fileRecord
  }
  
  private generateFileId(): string {
    return Math.random().toString(36).substring(2, 10) +
           Math.random().toString(36).substring(2, 10)
  }
  
  private generateToken(): string {
    return Buffer.from(Math.random().toString(36).substring(2) + 
                      Date.now().toString(36)).toString('base64')
  }
  
  private getExtension(filename: string): string {
    return filename.includes('.') 
      ? '.' + filename.split('.').pop()
      : ''
  }
  
  private async saveFileRecord(record: FileRecord): Promise<void> {
    await Promise.all([
      this.saveToSupabase(record),
      this.saveToTurso(record),
      this.saveToNeon(record)
    ])
  }
  
  private async saveToSupabase(record: FileRecord): Promise<void> {
    await supabase.from('files').insert({
      id: record.id,
      original_name: record.originalName,
      file_name: record.fileName,
      file_size: record.fileSize,
      mime_type: record.mimeType,
      storage_provider: record.storageProvider,
      storage_path: record.storagePath,
      public_url: record.publicUrl,
      short_url: record.shortUrl,
      ip_address: record.ipAddress,
      country: record.country,
      locale: record.locale,
      expires_at: record.expiresAt,
      upload_token: record.uploadToken,
      is_chunked: record.isChunked,
      chunk_count: record.chunkCount,
      status: record.status,
      metadata: record.metadata,
      created_at: record.createdAt,
      updated_at: record.updatedAt
    })
  }
  
  private async saveToTurso(record: FileRecord): Promise<void> {
    await turso.execute({
      sql: `
        INSERT INTO files (
          id, original_name, file_name, file_size, mime_type, storage_provider,
          storage_path, public_url, short_url, ip_address, country, locale,
          expires_at, upload_token, is_chunked, chunk_count, status, metadata,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        record.id, record.originalName, record.fileName, record.fileSize,
        record.mimeType, record.storageProvider, record.storagePath,
        record.publicUrl, record.shortUrl, record.ipAddress, record.country,
        record.locale, record.expiresAt, record.uploadToken, record.isChunked,
        record.chunkCount, record.status, JSON.stringify(record.metadata),
        record.createdAt.toISOString(), record.updatedAt.toISOString()
      ]
    })
  }
  
  private async saveToNeon(record: FileRecord): Promise<void> {
    await neonDb.insert(uploads).values({
      id: record.id,
      originalName: record.originalName,
      fileName: record.fileName,
      fileSize: record.fileSize,
      mimeType: record.mimeType,
      storageProvider: record.storageProvider,
      storagePath: record.storagePath,
      publicUrl: record.publicUrl,
      shortUrl: record.shortUrl,
      ipAddress: record.ipAddress,
      country: record.country,
      locale: record.locale,
      expiresAt: record.expiresAt,
      uploadToken: record.uploadToken,
      isChunked: record.isChunked,
      chunkCount: record.chunkCount,
      status: record.status,
      metadata: record.metadata,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    })
  }
  
  async getFile(id: string): Promise<FileRecord | null> {
    const queries = [
      supabase.from('files').select('*').eq('id', id).single(),
      turso.execute({ sql: 'SELECT * FROM files WHERE id = ?', args: [id] }),
      neonDb.select().from(files).where(eq(files.id, id))
    ]
    
    const results = await Promise.allSettled(queries)
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value) {
          const data = result.value
          if ('data' in data && data.data) {
            return this.mapSupabaseRecord(data.data)
          } else if ('rows' in data && data.rows.length > 0) {
            return this.mapTursoRecord(data.rows[0])
          } else if (Array.isArray(data) && data.length > 0) {
            return this.mapNeonRecord(data[0])
          }
        }
      }
    }
    
    return null
  }
  
  private mapSupabaseRecord(data: any): FileRecord {
    return {
      id: data.id,
      originalName: data.original_name,
      fileName: data.file_name,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      storageProvider: data.storage_provider,
      storagePath: data.storage_path,
      publicUrl: data.public_url,
      shortUrl: data.short_url,
      ipAddress: data.ip_address,
      country: data.country,
      locale: data.locale,
      expiresAt: data.expires_at,
      uploadToken: data.upload_token,
      isChunked: data.is_chunked,
      chunkCount: data.chunk_count,
      status: data.status,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
  
  private mapTursoRecord(data: any): FileRecord {
    return {
      id: data.id,
      originalName: data.original_name,
      fileName: data.file_name,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      storageProvider: data.storage_provider,
      storagePath: data.storage_path,
      publicUrl: data.public_url,
      shortUrl: data.short_url,
      ipAddress: data.ip_address,
      country: data.country,
      locale: data.locale,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      uploadToken: data.upload_token,
      isChunked: Boolean(data.is_chunked),
      chunkCount: data.chunk_count,
      status: data.status,
      metadata: typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
  
  private mapNeonRecord(data: any): FileRecord {
    return {
      id: data.id,
      originalName: data.originalName,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      storageProvider: data.storageProvider,
      storagePath: data.storagePath,
      publicUrl: data.publicUrl,
      shortUrl: data.shortUrl,
      ipAddress: data.ipAddress,
      country: data.country,
      locale: data.locale,
      expiresAt: data.expiresAt,
      uploadToken: data.uploadToken,
      isChunked: data.isChunked,
      chunkCount: data.chunkCount,
      status: data.status,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    }
  }
}

export const db = new DatabaseManager()