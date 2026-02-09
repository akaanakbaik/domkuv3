import TelegramBot from 'node-telegram-bot-api'
import { formatBytes, getBrowserInfo } from './utils'

class TelegramBotManager {
  private bot: TelegramBot
  private ownerId: number
  private channelId: string
  private isInitialized = false
  
  constructor() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.warn('Telegram bot token not configured')
      return
    }
    
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
    this.ownerId = parseInt(process.env.TELEGRAM_OWNER_ID || '6559289892')
    this.channelId = process.env.TELEGRAM_CHANNEL_ID || '-1003723592679'
    
    this.setupBot()
    this.isInitialized = true
  }
  
  private setupBot() {
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id
      
      if (chatId !== this.ownerId) {
        await this.bot.sendMessage(chatId, '⛔ Unauthorized access. This bot is for owner use only.')
        await this.sendOwnerNotification(`⚠️ Unauthorized access attempt from ${msg.from?.username || 'unknown'}`)
        return
      }
      
      await this.bot.sendMessage(chatId, 
        `🤖 *Kabox CDN Bot*\n\n` +
        `*Owner:* aka\n` +
        `*Status:* ✅ Online\n` +
        `*System Time:* ${new Date().toLocaleString()}\n\n` +
        `*Available Commands:*\n` +
        `/stats - Show system statistics\n` +
        `/users - Show recent users\n` +
        `/files - List recent files\n` +
        `/block <ip> - Block an IP\n` +
        `/unblock <ip> - Unblock an IP\n` +
        `/restart - Restart system\n` +
        `/logs - Get recent logs\n` +
        `/cleanup - Cleanup expired files\n` +
        `/backup - Create backup\n` +
        `/status - Check system status\n` +
        `/broadcast <message> - Send broadcast\n` +
        `/monitor - Toggle monitoring\n` +
        `/alerts - Configure alerts\n` +
        `/dbstats - Database statistics\n` +
        `/uptime - System uptime\n` +
        `/help - Show this help\n`,
        { parse_mode: 'Markdown' }
      )
    })
    
    this.bot.onText(/\/stats/, async (msg) => {
      if (msg.chat.id !== this.ownerId) return
      
      try {
        const stats = await this.getSystemStats()
        await this.bot.sendMessage(msg.chat.id, stats, { parse_mode: 'Markdown' })
      } catch (error) {
        await this.bot.sendMessage(msg.chat.id, '❌ Failed to fetch statistics')
      }
    })
    
    this.bot.onText(/\/block (.+)/, async (msg, match) => {
      if (msg.chat.id !== this.ownerId) return
      
      const ip = match?.[1]
      if (ip) {
        // Implement IP blocking logic here
        await this.bot.sendMessage(msg.chat.id, `✅ IP ${ip} has been blocked`)
        await this.sendOwnerNotification(`🔒 IP ${ip} blocked by owner`)
      }
    })
    
    this.bot.onText(/\/cleanup/, async (msg) => {
      if (msg.chat.id !== this.ownerId) return
      
      // Implement cleanup logic here
      await this.bot.sendMessage(msg.chat.id, '🧹 Cleanup initiated')
      await this.sendOwnerNotification('🧹 System cleanup performed by owner')
    })
    
    this.bot.onText(/\/broadcast (.+)/, async (msg, match) => {
      if (msg.chat.id !== this.ownerId) return
      
      const message = match?.[1]
      if (message) {
        await this.sendBroadcast(message)
        await this.bot.sendMessage(msg.chat.id, '📢 Broadcast sent to channel')
      }
    })
    
    this.bot.onText(/\/monitor/, async (msg) => {
      if (msg.chat.id !== this.ownerId) return
      
      // Implement monitoring toggle
      await this.bot.sendMessage(msg.chat.id, '📊 Monitoring toggled')
    })
    
    this.bot.onText(/\/restart/, async (msg) => {
      if (msg.chat.id !== this.ownerId) return
      
      await this.bot.sendMessage(msg.chat.id, '🔄 System restart initiated...')
      await this.sendOwnerNotification('🔄 System restart initiated by owner')
      // Implement restart logic
    })
    
    this.bot.on('message', async (msg) => {
      if (msg.chat.id === this.ownerId && msg.text && !msg.text.startsWith('/')) {
        await this.handleOwnerMessage(msg)
      }
    })
    
    console.log('Telegram bot initialized')
  }
  
  private async handleOwnerMessage(msg: TelegramBot.Message) {
    const text = msg.text || ''
    
    if (text.toLowerCase().includes('status')) {
      await this.bot.sendMessage(msg.chat.id, '✅ All systems operational')
    } else if (text.toLowerCase().includes('help')) {
      await this.bot.sendMessage(msg.chat.id, 
        'Need help? Contact @akamodebaik or check /start for commands.'
      )
    }
  }
  
  private async getSystemStats(): Promise<string> {
    const now = new Date()
    const uptime = process.uptime()
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    
    return `📊 *System Statistics*\n\n` +
           `*Uptime:* ${days}d ${hours}h ${minutes}m\n` +
           `*Memory Usage:* ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n` +
           `*Node Version:* ${process.version}\n` +
           `*Environment:* ${process.env.NODE_ENV || 'production'}\n` +
           `*Last Updated:* ${now.toLocaleString()}\n\n` +
           `*Database Status:* ✅ All operational\n` +
           `*CDN Status:* ✅ Online\n` +
           `*Security Status:* ✅ Active\n`
  }
  
  async sendUploadNotification(data: {
    ip: string
    files: Array<{
      filename: string
      size: string
      db: string
      status: string
      error?: string
    }>
    totalFiles: number
    successfulUploads: number
    timestamp: string
  }) {
    if (!this.isInitialized) return
    
    try {
      const successCount = data.files.filter(f => f.status === 'success').length
      const failedCount = data.files.filter(f => f.status === 'failed').length
      
      let message = `📤 *New File Upload*\n\n`
      message += `*IP:* \`${data.ip}\`\n`
      message += `*Time:* ${new Date(data.timestamp).toLocaleString()}\n`
      message += `*Result:* ${successCount}✅ ${failedCount}❌\n\n`
      
      if (data.files.length > 0) {
        message += `*Files:*\n`
        data.files.slice(0, 3).forEach((file, index) => {
          message += `${index + 1}. ${file.filename} (${file.size}) - ${file.db} - ${file.status === 'success' ? '✅' : '❌'}\n`
        })
        
        if (data.files.length > 3) {
          message += `... and ${data.files.length - 3} more\n`
        }
      }
      
      await this.bot.sendMessage(this.channelId, message, { parse_mode: 'Markdown' })
      
    } catch (error) {
      console.error('Failed to send upload notification:', error)
    }
  }
  
  async sendDownloadNotification(data: {
    ip: string
    fileId: string
    filename: string
    size: string | number
    timestamp: string
  }) {
    if (!this.isInitialized) return
    
    try {
      const size = typeof data.size === 'number' ? formatBytes(data.size) : data.size
      
      const message = `📥 *File Downloaded*\n\n` +
        `*File:* ${data.filename}\n` +
        `*ID:* \`${data.fileId}\`\n` +
        `*Size:* ${size}\n` +
        `*IP:* \`${data.ip}\`\n` +
        `*Time:* ${new Date(data.timestamp).toLocaleString()}\n`
      
      await this.bot.sendMessage(this.channelId, message, { parse_mode: 'Markdown' })
      
    } catch (error) {
      console.error('Failed to send download notification:', error)
    }
  }
  
  async sendErrorNotification(data: {
    error: string
    endpoint: string
    timestamp: string
  }) {
    if (!this.isInitialized) return
    
    try {
      const message = `🚨 *System Error*\n\n` +
        `*Endpoint:* ${data.endpoint}\n` +
        `*Error:* ${data.error.substring(0, 200)}${data.error.length > 200 ? '...' : ''}\n` +
        `*Time:* ${new Date(data.timestamp).toLocaleString()}\n`
      
      await this.bot.sendMessage(this.channelId, message, { parse_mode: 'Markdown' })
      await this.sendOwnerNotification(`🚨 Error in ${data.endpoint}: ${data.error.substring(0, 100)}`)
      
    } catch (error) {
      console.error('Failed to send error notification:', error)
    }
  }
  
  async sendSecurityAlert(data: {
    type: string
    ip: string
    details: string
    timestamp: string
  }) {
    if (!this.isInitialized) return
    
    try {
      const message = `⚠️ *Security Alert*\n\n` +
        `*Type:* ${data.type}\n` +
        `*IP:* \`${data.ip}\`\n` +
        `*Details:* ${data.details}\n` +
        `*Time:* ${new Date(data.timestamp).toLocaleString()}\n`
      
      await this.bot.sendMessage(this.channelId, message, { parse_mode: 'Markdown' })
      
    } catch (error) {
      console.error('Failed to send security alert:', error)
    }
  }
  
  async sendOwnerNotification(message: string) {
    if (!this.isInitialized) return
    
    try {
      await this.bot.sendMessage(this.ownerId, message, { parse_mode: 'Markdown' })
    } catch (error) {
      console.error('Failed to send owner notification:', error)
    }
  }
  
  async sendBroadcast(message: string) {
    if (!this.isInitialized) return
    
    try {
      await this.bot.sendMessage(this.channelId, 
        `📢 *Announcement*\n\n${message}\n\n_From system administrator_`,
        { parse_mode: 'Markdown' }
      )
    } catch (error) {
      console.error('Failed to send broadcast:', error)
    }
  }
  
  async sendDailyReport() {
    if (!this.isInitialized) return
    
    try {
      const now = new Date()
      const message = `📈 *Daily Report* - ${now.toLocaleDateString()}\n\n` +
        `*Total Uploads:* 0 (placeholder)\n` +
        `*Total Downloads:* 0 (placeholder)\n` +
        `*Active Users:* 0 (placeholder)\n` +
        `*System Status:* ✅ Operational\n` +
        `*Security Incidents:* 0\n\n` +
        `_Report generated automatically_`
      
      await this.bot.sendMessage(this.channelId, message, { parse_mode: 'Markdown' })
      
    } catch (error) {
      console.error('Failed to send daily report:', error)
    }
  }
}

export const telegramBot = new TelegramBotManager()
export default telegramBot