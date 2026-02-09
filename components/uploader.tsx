"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, File, Image, Video, Music, FileText, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn, formatBytes } from "@/lib/utils"
import { useTranslation } from 'react-i18next'

interface UploadedFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

export function Uploader() {
  const [files, setFiles] = React.useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 5) {
      toast({
        title: t('upload.error.too_many_files'),
        description: t('upload.error.max_files', { max: 5 }),
        variant: "destructive",
      })
      return
    }
    
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'pending' as const,
    }))
    
    setFiles(prev => [...prev, ...newFiles].slice(0, 5))
  }, [toast, t])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 5,
    maxSize: 100 * 1024 * 1024, // 100MB
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'],
      'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'],
      'application/*': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.7z', '.tar', '.gz'],
      'text/*': ['.txt', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx'],
    },
  })
  
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image
    if (fileType.startsWith('video/')) return Video
    if (fileType.startsWith('audio/')) return Music
    if (fileType === 'application/pdf') return FileText
    return File
  }
  
  const uploadFiles = async () => {
    if (files.length === 0) {
      toast({
        title: t('upload.error.no_files'),
        description: t('upload.error.select_files'),
        variant: "destructive",
      })
      return
    }
    
    setIsUploading(true)
    setUploadProgress(0)
    
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file.file)
    })
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(t('upload.error.upload_failed'))
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        setFiles(prev => prev.map(file => ({
          ...file,
          progress: 100,
          status: 'completed',
          url: data.data.find((d: any) => d.filename === file.file.name)?.url
        })))
        
        toast({
          title: t('upload.success.title'),
          description: t('upload.success.description', { count: files.length }),
          variant: "success",
        })
      } else {
        throw new Error(data.error || t('upload.error.upload_failed'))
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: t('upload.error.title'),
        description: error instanceof Error ? error.message : t('upload.error.unknown'),
        variant: "destructive",
      })
      
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'error',
        error: error instanceof Error ? error.message : t('upload.error.unknown')
      })))
    } finally {
      setIsUploading(false)
    }
  }
  
  const simulateProgress = () => {
    if (!isUploading || uploadProgress >= 100) return
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return Math.min(prev + Math.random() * 10, 95)
      })
    }, 200)
    
    return () => clearInterval(interval)
  }
  
  React.useEffect(() => {
    if (isUploading) {
      return simulateProgress()
    }
  }, [isUploading])
  
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-2 border-dashed hover:border-primary/50 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="mb-2 text-xl font-semibold">
              {isDragActive
                ? t('upload.drop_here')
                : t('upload.drag_drop')}
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {t('upload.supported_formats')}
            </p>
            <Button variant="outline">
              {t('upload.select_files')}
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              {t('upload.max_size', { size: '100MB' })}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {t('upload.selected_files', { count: files.length })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiles([])}
              disabled={isUploading}
            >
              <X className="mr-2 h-4 w-4" />
              {t('upload.clear_all')}
            </Button>
          </div>
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t('upload.uploading')}</span>
                <span>{uploadProgress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2">
            {files.map((file) => {
              const Icon = getFileIcon(file.file.type)
              const statusColors = {
                pending: "border-muted",
                uploading: "border-primary",
                completed: "border-success",
                error: "border-destructive",
              }
              
              return (
                <Card
                  key={file.id}
                  className={cn("overflow-hidden", statusColors[file.status])}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {file.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(file.file.size)}
                            </p>
                          </div>
                          {file.status !== 'uploading' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeFile(file.id)}
                              disabled={isUploading}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        {file.status === 'uploading' && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>{t('upload.progress')}</span>
                              <span>{file.progress}%</span>
                            </div>
                            <Progress value={file.progress} className="h-1" />
                          </div>
                        )}
                        
                        {file.status === 'completed' && file.url && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-1 text-xs text-success">
                              <CheckCircle className="h-3 w-3" />
                              <span>{t('upload.completed')}</span>
                            </div>
                            <div className="rounded bg-muted p-2">
                              <code className="block truncate text-xs">
                                {file.url}
                              </code>
                            </div>
                          </div>
                        )}
                        
                        {file.status === 'error' && (
                          <div className="mt-2 text-xs text-destructive">
                            {file.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t('upload.total_size', {
                size: formatBytes(files.reduce((acc, file) => acc + file.file.size, 0))
              })}
            </div>
            <Button
              onClick={uploadFiles}
              disabled={isUploading || files.length === 0}
              size="lg"
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('upload.uploading')}...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('upload.start_upload')}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-success/10 p-1">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <h4 className="font-semibold">{t('features.secure')}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('features.secure_description')}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-1">
              <Upload className="h-4 w-4 text-primary" />
            </div>
            <h4 className="font-semibold">{t('features.fast')}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('features.fast_description')}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-purple-500/10 p-1">
              <File className="h-4 w-4 text-purple-500" />
            </div>
            <h4 className="font-semibold">{t('features.multi_db')}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('features.multi_db_description')}
          </p>
        </div>
      </div>
    </div>
  )
}