import { createClient } from '@supabase/supabase-js'
import { neon } from '@neondatabase/serverless'
import { createClient as createTursoClient } from '@libsql/client'
import { v2 as cloudinary } from 'cloudinary'
import ImageKit from 'imagekit'
import Redis from 'redis'

class DatabaseManager {
  private supabase
  private neonPool
  private turso
  private cloudinary
  private imagekit
  private redis
  
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )
    
    this.neonPool = neon(process.env.NEON_DB_URL!)
    
    this.turso = createTursoClient({
      url: process.env.TURSO_DB_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!
    })
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    })
    
    this.imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
    })
    
    if (process.env.REDIS_URL) {
      this.redis = Redis.createClient({
        url: process.env.REDIS_URL
      })
      this.redis.connect()
    }
  }
  
  async getDatabase(type: 'supabase' | 'neon' | 'turso' | 'cloudinary' | 'imagekit' = 'supabase') {
    switch (type) {
      case 'supabase':
        return this.supabase
      case 'neon':
        return this.neonPool
      case 'turso':
        return this.turso
      case 'cloudinary':
        return cloudinary
      case 'imagekit':
        return this.imagekit
      default:
        return this.supabase
    }
  }
  
  async selectOptimalDatabase(fileType?: string, fileSize?: number) {
    const databases = [
      { type: 'supabase', priority: 1, maxSize: 100 * 1024 * 1024 },
      { type: 'cloudinary', priority: 2, maxSize: 100 * 1024 * 1024, 
        supportedTypes: ['image', 'video', 'raw'] },
      { type: 'imagekit', priority: 3, maxSize: 50 * 1024 * 1024,
        supportedTypes: ['image', 'video'] },
      { type: 'neon', priority: 4, maxSize: 10 * 1024 * 1024 },
      { type: 'turso', priority: 5, maxSize: 5 * 1024 * 1024 }
    ]
    
    const available = databases.filter(db => {
      if (fileSize && fileSize > db.maxSize) return false
      if (fileType && db.supportedTypes) {
        const category = this.getFileCategory(fileType)
        return db.supportedTypes.includes(category)
      }
      return true
    })
    
    available.sort((a, b) => a.priority - b.priority)
    
    return available[0]?.type || 'supabase'
  }
  
  getFileCategory(mimeType: string) {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'raw'
  }
  
  async storeFileMetadata(fileData: any) {
    const { id, name, size, mimeType, hash, dbType, url } = fileData
    
    const metadata = {
      id,
      filename: name,
      size,
      mime_type: mimeType,
      hash,
      db_type: dbType,
      url,
      created_at: new Date().toISOString(),
      downloads: 0,
      last_accessed: null
    }
    
    await Promise.allSettled([
      this.supabase.from('files').insert(metadata),
      this.turso.execute({
        sql: `INSERT INTO files (id, filename, size, mime_type, hash, db_type, url, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, name, size, mimeType, hash, dbType, url, metadata.created_at]
      }),
      this.neonPool(`INSERT INTO files (id, filename, size, mime_type, hash, db_type, url, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, name, size, mimeType, hash, dbType, url, metadata.created_at]
      )
    ])
    
    if (this.redis) {
      await this.redis.set(`file:${id}`, JSON.stringify(metadata))
      await this.redis.expire(`file:${id}`, 86400)
    }
    
    return metadata
  }
  
  async getFileMetadata(id: string) {
    if (this.redis) {
      const cached = await this.redis.get(`file:${id}`)
      if (cached) return JSON.parse(cached)
    }
    
    const results = await Promise.allSettled([
      this.supabase.from('files').select('*').eq('id', id).single(),
      this.turso.execute({
        sql: 'SELECT * FROM files WHERE id = ?',
        args: [id]
      }),
      this.neonPool('SELECT * FROM files WHERE id = $1', [id])
    ])
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const data = Array.isArray(result.value) ? result.value[0] : result.value.data?.[0] || result.value
        if (data && data.id) {
          if (this.redis) {
            await this.redis.set(`file:${id}`, JSON.stringify(data))
            await this.redis.expire(`file:${id}`, 3600)
          }
          return data
        }
      }
    }
    
    return null
  }
  
  async incrementDownloadCount(id: string) {
    await Promise.allSettled([
      this.supabase.from('files').update({ downloads: { increment: 1 } }).eq('id', id),
      this.turso.execute({
        sql: 'UPDATE files SET downloads = downloads + 1 WHERE id = ?',
        args: [id]
      }),
      this.neonPool('UPDATE files SET downloads = downloads + 1 WHERE id = $1', [id])
    ])
    
    if (this.redis) {
      await this.redis.del(`file:${id}`)
    }
  }
  
  async cleanupExpiredFiles() {
    const expirationDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const expiredFiles = await this.supabase
      .from('files')
      .select('*')
      .lt('created_at', expirationDate)
      .limit(100)
    
    if (expiredFiles.data) {
      for (const file of expiredFiles.data) {
        await this.deleteFile(file.id, file.db_type, file.url)
      }
    }
  }
  
  async deleteFile(id: string, dbType: string, url: string) {
    try {
      switch (dbType) {
        case 'cloudinary':
          const publicId = url.split('/').pop()?.split('.')[0]
          if (publicId) {
            await cloudinary.uploader.destroy(publicId)
          }
          break
        case 'imagekit':
          const fileId = url.split('/').pop()
          if (fileId) {
            await this.imagekit.deleteFile(fileId)
          }
          break
      }
      
      await Promise.allSettled([
        this.supabase.from('files').delete().eq('id', id),
        this.turso.execute({
          sql: 'DELETE FROM files WHERE id = ?',
          args: [id]
        }),
        this.neonPool('DELETE FROM files WHERE id = $1', [id])
      ])
      
      if (this.redis) {
        await this.redis.del(`file:${id}`)
      }
      
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }
  
  async getStats() {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      databases: {} as Record<string, number>
    }
    
    try {
      const supabaseCount = await this.supabase
        .from('files')
        .select('id, size, db_type', { count: 'exact' })
      
      if (supabaseCount.data) {
        stats.totalFiles = supabaseCount.data.length
        stats.totalSize = supabaseCount.data.reduce((sum, file) => sum + (file.size || 0), 0)
        
        supabaseCount.data.forEach(file => {
          stats.databases[file.db_type] = (stats.databases[file.db_type] || 0) + 1
        })
      }
    } catch (error) {
      console.error('Error getting stats:', error)
    }
    
    return stats
  }
}

export const dbManager = new DatabaseManager()
export default dbManager