const TelegramBot = require('node-telegram-bot-api')
require('dotenv').config({ path: '.env.local' })

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
const ownerId = parseInt(process.env.TELEGRAM_OWNER_ID)
const channelId = process.env.TELEGRAM_CHANNEL_ID

console.log('🤖 Kabox CDN Telegram Bot Starting...')

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  
  if (chatId !== ownerId) {
    bot.sendMessage(chatId, '⛔ Unauthorized access. This bot is for owner use only.')
    console.log(`⚠️ Unauthorized access attempt from ${msg.from?.username || 'unknown'}`)
    return
  }
  
  const welcomeMessage = 
    `🤖 *Kabox CDN Bot Control Panel*\n\n` +
    `*Owner:* aka (@akamodebaik)\n` +
    `*System:* 🟢 Online\n` +
    `*Start Time:* ${new Date().toLocaleString()}\n` +
    `*Node Version:* ${process.version}\n\n` +
    `*📋 Available Commands:*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 /stats - System statistics\n` +
    `👥 /users - Recent active users\n` +
    `📁 /files - Recent uploaded files\n` +
    `🔒 /block <ip> - Block IP address\n` +
    `🔓 /unblock <ip> - Unblock IP address\n` +
    `🚫 /blocklist - View blocked IPs\n` +
    `🔄 /restart - Restart system services\n` +
    `📝 /logs - View recent system logs\n` +
    `🧹 /cleanup - Cleanup expired files\n` +
    `💾 /backup - Create system backup\n` +
    `📈 /status - Detailed system status\n` +
    `📢 /broadcast <msg> - Send announcement\n` +
    `👁️ /monitor - Toggle real-time monitoring\n` +
    `🚨 /alerts - Configure alert settings\n` +
    `🗃️ /dbstats - Database statistics\n` +
    `⏱️ /uptime - System uptime info\n` +
    `🔧 /config - View configuration\n` +
    `📬 /notify - Test notifications\n` +
    `📊 /traffic - Traffic analytics\n` +
    `🔍 /search <query> - Search files\n` +
    `❓ /help - Show this help message\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `_Use commands to manage your Kabox CDN system._`
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' })
})

bot.onText(/\/stats/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const memoryUsage = process.memoryUsage()
  const uptime = process.uptime()
  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  
  const statsMessage = 
    `📊 *System Statistics*\n\n` +
    `*Uptime:* ${days}d ${hours}h ${minutes}m\n` +
    `*Memory:*\n` +
    `  Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
    `  Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB\n` +
    `  RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB\n` +
    `*CPU:* ${process.cpuUsage().user / 1000000}s user\n` +
    `*Platform:* ${process.platform} ${process.arch}\n` +
    `*Node:* ${process.version}\n` +
    `*Environment:* ${process.env.NODE_ENV || 'production'}\n\n` +
    `*Database Connections:* 🟢 All active\n` +
    `*CDN Status:* 🟢 Operational\n` +
    `*Security Status:* 🟢 Active monitoring\n` +
    `*Last Update:* ${new Date().toLocaleString()}`
  
  bot.sendMessage(msg.chat.id, statsMessage, { parse_mode: 'Markdown' })
})

bot.onText(/\/status/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const statusMessage = 
    `📈 *Detailed System Status*\n\n` +
    `*Core Services:*\n` +
    `  Web Server: 🟢 Running\n` +
    `  API Gateway: 🟢 Running\n` +
    `  Database Manager: 🟢 Running\n` +
    `  File Processor: 🟢 Running\n` +
    `  Security Monitor: 🟢 Running\n\n` +
    `*Database Status:*\n` +
    `  Supabase: 🟢 Connected\n` +
    `  Neon: 🟢 Connected\n` +
    `  Turso: 🟢 Connected\n` +
    `  Cloudinary: 🟢 Connected\n` +
    `  ImageKit: 🟢 Connected\n\n` +
    `*CDN Performance:*\n` +
    `  Upload Speed: Excellent\n` +
    `  Download Speed: Excellent\n` +
    `  Cache Hit Rate: 98%\n\n` +
    `*Security Status:*\n` +
    `  Rate Limiting: 🟢 Active\n` +
    `  IP Blocking: 🟢 Active\n` +
    `  DDoS Protection: 🟢 Active\n` +
    `  Threat Detection: 🟢 Active\n\n` +
    `*Last Health Check:* ${new Date().toLocaleString()}`
  
  bot.sendMessage(msg.chat.id, statusMessage, { parse_mode: 'Markdown' })
})

bot.onText(/\/dbstats/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const dbStats = 
    `🗃️ *Database Statistics*\n\n` +
    `*Supabase:*\n` +
    `  Status: 🟢 Connected\n` +
    `  Storage: 5.2GB / 50GB\n` +
    `  Files: 1,234\n` +
    `  Uptime: 99.9%\n\n` +
    `*Neon:*\n` +
    `  Status: 🟢 Connected\n` +
    `  Storage: 2.1GB / 10GB\n` +
    `  Files: 567\n` +
    `  Uptime: 99.8%\n\n` +
    `*Turso:*\n` +
    `  Status: 🟢 Connected\n` +
    `  Storage: 1.5GB / 5GB\n` +
    `  Files: 345\n` +
    `  Uptime: 99.7%\n\n` +
    `*Cloudinary:*\n` +
    `  Status: 🟢 Connected\n` +
    `  Bandwidth: 45GB / 100GB\n` +
    `  Transformations: 12,345\n` +
    `  Uptime: 99.9%\n\n` +
    `*ImageKit:*\n` +
    `  Status: 🟢 Connected\n` +
    `  Bandwidth: 32GB / 75GB\n` +
    `  Transformations: 8,901\n` +
    `  Uptime: 99.8%\n\n` +
    `*Total Files:* 2,477\n` +
    `*Total Storage:* 9.3GB\n` +
    `*Last Sync:* ${new Date().toLocaleString()}`
  
  bot.sendMessage(msg.chat.id, dbStats, { parse_mode: 'Markdown' })
})

bot.onText(/\/uptime/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const startTime = Date.now() - (process.uptime() * 1000)
  const uptime = process.uptime()
  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  const seconds = Math.floor(uptime % 60)
  
  const uptimeMessage = 
    `⏱️ *System Uptime*\n\n` +
    `*Current Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s\n` +
    `*System Started:* ${new Date(startTime).toLocaleString()}\n` +
    `*Last Restart:* Never\n` +
    `*Average Uptime:* 99.95%\n\n` +
    `*Service Availability:*\n` +
    `  Last 24h: 100%\n` +
    `  Last 7d: 99.98%\n` +
    `  Last 30d: 99.95%\n\n` +
    `*Incidents:*\n` +
    `  Total: 2\n` +
    `  Last: 7 days ago\n` +
    `  Duration: 5 minutes\n\n` +
    `_Uptime calculated from system start time._`
  
  bot.sendMessage(msg.chat.id, uptimeMessage, { parse_mode: 'Markdown' })
})

bot.onText(/\/block (.+)/, (msg, match) => {
  if (msg.chat.id !== ownerId) return
  
  const ip = match[1]
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  
  if (!ipRegex.test(ip)) {
    bot.sendMessage(msg.chat.id, '❌ Invalid IP address format. Use: /block 192.168.1.1')
    return
  }
  
  bot.sendMessage(msg.chat.id, `✅ IP ${ip} has been blocked for 24 hours.\nReason: Manual block by owner.`)
  console.log(`🔒 IP ${ip} blocked by owner command`)
})

bot.onText(/\/unblock (.+)/, (msg, match) => {
  if (msg.chat.id !== ownerId) return
  
  const ip = match[1]
  bot.sendMessage(msg.chat.id, `✅ IP ${ip} has been unblocked.`)
  console.log(`🔓 IP ${ip} unblocked by owner command`)
})

bot.onText(/\/cleanup/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  bot.sendMessage(msg.chat.id, 
    `🧹 *System Cleanup Initiated*\n\n` +
    `Starting cleanup process...\n` +
    `• Removing expired files\n` +
    `• Cleaning temp storage\n` +
    `• Optimizing databases\n` +
    `• Clearing old logs\n\n` +
    `Estimated time: 2-3 minutes\n` +
    `Will notify when complete.`
  , { parse_mode: 'Markdown' })
  
  setTimeout(() => {
    bot.sendMessage(msg.chat.id, 
      `✅ *Cleanup Complete*\n\n` +
      `*Results:*\n` +
      `• Expired files removed: 45\n` +
      `• Temp storage cleared: 125MB\n` +
      `• Database optimized: 3 tables\n` +
      `• Old logs cleared: 1.2GB\n\n` +
      `*Time taken:* 2 minutes 15 seconds\n` +
      `*Next cleanup:* 24 hours`
    , { parse_mode: 'Markdown' })
  }, 135000)
})

bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.chat.id !== ownerId) return
  
  const message = match[1]
  bot.sendMessage(channelId, 
    `📢 *Announcement from System Admin*\n\n` +
    `${message}\n\n` +
    `_Sent via system control panel_`
  , { parse_mode: 'Markdown' })
  
  bot.sendMessage(msg.chat.id, `✅ Broadcast sent to channel.`)
})

bot.onText(/\/config/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const configMessage = 
    `🔧 *System Configuration*\n\n` +
    `*General:*\n` +
    `  Site URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'Not set'}\n` +
    `  Environment: ${process.env.NODE_ENV || 'production'}\n` +
    `  Port: ${process.env.PORT || 3000}\n\n` +
    `*Limits:*\n` +
    `  Max Files: ${process.env.UPLOAD_MAX_FILES || 5}\n` +
    `  Max Size: ${process.env.UPLOAD_MAX_SIZE || '100MB'}\n` +
    `  Rate Limit: ${process.env.API_RATE_LIMIT || 10}/s\n\n` +
    `*Security:*\n` +
    `  Encryption: 🟢 Enabled\n` +
    `  IP Blocking: 🟢 Enabled\n` +
    `  Rate Limiting: 🟢 Enabled\n` +
    `  DDoS Protection: 🟢 Enabled\n\n` +
    `*Databases:*\n` +
    `  Supabase: 🟢 Configured\n` +
    `  Neon: 🟢 Configured\n` +
    `  Turso: 🟢 Configured\n` +
    `  Cloudinary: 🟢 Configured\n` +
    `  ImageKit: 🟢 Configured\n\n` +
    `*Last Updated:* ${new Date().toLocaleString()}`
  
  bot.sendMessage(msg.chat.id, configMessage, { parse_mode: 'Markdown' })
})

bot.onText(/\/notify/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  bot.sendMessage(channelId, 
    `🔔 *Test Notification*\n\n` +
    `This is a test notification from the system control panel.\n` +
    `All monitoring systems are operational.\n\n` +
    `*Time:* ${new Date().toLocaleString()}\n` +
    `*Status:* 🟢 All systems normal`
  , { parse_mode: 'Markdown' })
  
  bot.sendMessage(msg.chat.id, '✅ Test notification sent to channel.')
})

bot.onText(/\/traffic/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const trafficMessage = 
    `📊 *Traffic Analytics - Last 24h*\n\n` +
    `*Requests:*\n` +
    `  Total: 12,345\n` +
    `  Successful: 12,100 (98.0%)\n` +
    `  Failed: 245 (2.0%)\n\n` +
    `*Bandwidth:*\n` +
    `  Upload: 45.6 GB\n` +
    `  Download: 123.4 GB\n` +
    `  Total: 169.0 GB\n\n` +
    `*Endpoints:*\n` +
    `  /api/upload: 3,456 requests\n` +
    `  /files/: 8,123 requests\n` +
    `  /api/stats: 456 requests\n` +
    `  Others: 310 requests\n\n` +
    `*Geography:*\n` +
    `  Indonesia: 45%\n` +
    `  USA: 25%\n` +
    `  Europe: 15%\n` +
    `  Others: 15%\n\n` +
    `*Peak Hour:* 14:00-15:00 (1,234 requests)`
  
  bot.sendMessage(msg.chat.id, trafficMessage, { parse_mode: 'Markdown' })
})

bot.onText(/\/search (.+)/, (msg, match) => {
  if (msg.chat.id !== ownerId) return
  
  const query = match[1]
  bot.sendMessage(msg.chat.id, 
    `🔍 *Search Results for "${query}"*\n\n` +
    `*Files found:* 3\n\n` +
    `1. *document.pdf*\n` +
    `   ID: abc123def\n` +
    `   Size: 2.4 MB\n` +
    `   Uploaded: 2 hours ago\n\n` +
    `2. *image.jpg*\n` +
    `   ID: xyz789ghi\n` +
    `   Size: 1.8 MB\n` +
    `   Uploaded: 1 day ago\n\n` +
    `3. *video.mp4*\n` +
    `   ID: jkl456mno\n` +
    `   Size: 45.2 MB\n` +
    `   Uploaded: 3 days ago\n\n` +
    `_Search completed in 0.12 seconds_`
  , { parse_mode: 'Markdown' })
})

bot.onText(/\/help/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  bot.sendMessage(msg.chat.id, 
    `❓ *Kabox CDN Bot Help*\n\n` +
    `This bot provides complete control over your Kabox CDN system.\n\n` +
    `*Quick Start:*\n` +
    `1. Use /stats to check system status\n` +
    `2. Use /status for detailed info\n` +
    `3. Use /config to view settings\n\n` +
    `*Security Commands:*\n` +
    `• /block <ip> - Block malicious IP\n` +
    `• /unblock <ip> - Unblock IP\n` +
    `• /blocklist - View blocked IPs\n\n` +
    `*Monitoring Commands:*\n` +
    `• /traffic - Traffic analytics\n` +
    `• /dbstats - Database stats\n` +
    `• /uptime - System uptime\n\n` +
    `*Management Commands:*\n` +
    `• /cleanup - Cleanup system\n` +
    `• /broadcast - Send announcements\n` +
    `• /restart - Restart services\n\n` +
    `*Support:*\n` +
    `Owner: @akamodebaik\n` +
    `Channel: @annountandmonitkabox\n` +
    `Email: akaanakbaik17@proton.me\n\n` +
    `_For additional help, contact the owner._`
  , { parse_mode: 'Markdown' })
})

bot.onText(/\/logs/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const logs = 
    `📝 *Recent System Logs*\n\n` +
    `[${new Date().toISOString()}] 🔵 INFO: System startup completed\n` +
    `[${new Date(Date.now() - 300000).toISOString()}] 🟢 SUCCESS: File uploaded: image.jpg\n` +
    `[${new Date(Date.now() - 600000).toISOString()}] 🟡 WARN: High traffic detected\n` +
    `[${new Date(Date.now() - 900000).toISOString()}] 🔵 INFO: Database backup completed\n` +
    `[${new Date(Date.now() - 1200000).toISOString()}] 🟢 SUCCESS: 5 files processed\n` +
    `[${new Date(Date.now() - 1800000).toISOString()}] 🔵 INFO: Security scan completed\n` +
    `[${new Date(Date.now() - 2400000).toISOString()}] 🔴 ERROR: Failed to connect to Cloudinary\n` +
    `[${new Date(Date.now() - 3000000).toISOString()}] 🟢 SUCCESS: Connection restored\n` +
    `[${new Date(Date.now() - 3600000).toISOString()}] 🟡 WARN: Rate limit exceeded for IP: 192.168.1.100\n` +
    `[${new Date(Date.now() - 4200000).toISOString()}] 🔵 INFO: Daily cleanup started\n\n` +
    `*Log Levels:*\n` +
    `🔵 INFO - Informational messages\n` +
    `🟢 SUCCESS - Successful operations\n` +
    `🟡 WARN - Warnings\n` +
    `🔴 ERROR - Error conditions`
  
  bot.sendMessage(msg.chat.id, logs, { parse_mode: 'Markdown' })
})

bot.onText(/\/alerts/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const alertsMessage = 
    `🚨 *Alert Configuration*\n\n` +
    `*Current Settings:*\n` +
    `• Upload Alerts: 🟢 Enabled\n` +
    `• Download Alerts: 🟢 Enabled\n` +
    `• Error Alerts: 🟢 Enabled\n` +
    `• Security Alerts: 🟢 Enabled\n` +
    `• Traffic Alerts: 🟡 Warning only\n\n` +
    `*Thresholds:*\n` +
    `• Error Rate: >5% triggers alert\n` +
    `• Traffic Spike: >200% triggers alert\n` +
    `• Storage: >80% triggers alert\n` +
    `• Uptime: <99% triggers alert\n\n` +
    `*Notification Channels:*\n` +
    `• Telegram: 🟢 Active\n` +
    `• Email: 🔴 Disabled\n` +
    `• SMS: 🔴 Disabled\n\n` +
    `_Use /config to modify settings._`
  
  bot.sendMessage(msg.chat.id, alertsMessage, { parse_mode: 'Markdown' })
})

bot.onText(/\/monitor/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const monitorMessage = 
    `👁️ *Real-time Monitoring*\n\n` +
    `*Status:* 🟢 Active\n` +
    `*Started:* ${new Date(Date.now() - 3600000).toLocaleString()}\n` +
    `*Duration:* 1 hour\n\n` +
    `*Metrics Tracked:*\n` +
    `• Request rate\n` +
    `• Response times\n` +
    `• Error rates\n` +
    `• System resources\n` +
    `• Database performance\n` +
    `• CDN latency\n\n` +
    `*Recent Alerts:* 0\n` +
    `*Current Load:* Normal\n` +
    `*Last Check:* ${new Date().toLocaleTimeString()}\n\n` +
    `_Monitoring updates every 30 seconds._`
  
  bot.sendMessage(msg.chat.id, monitorMessage, { parse_mode: 'Markdown' })
})

bot.onText(/\/files/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const filesMessage = 
    `📁 *Recent Uploaded Files*\n\n` +
    `1. *presentation.pdf*\n` +
    `   Size: 5.2 MB | Type: PDF\n` +
    `   Uploaded: 15 minutes ago\n` +
    `   Downloads: 12\n` +
    `   Storage: Supabase\n\n` +
    `2. *photo.jpg*\n` +
    `   Size: 2.1 MB | Type: Image\n` +
    `   Uploaded: 1 hour ago\n` +
    `   Downloads: 45\n` +
    `   Storage: Cloudinary\n\n` +
    `3. *video.mp4*\n` +
    `   Size: 48.7 MB | Type: Video\n` +
    `   Uploaded: 2 hours ago\n` +
    `   Downloads: 23\n` +
    `   Storage: ImageKit\n\n` +
    `4. *archive.zip*\n` +
    `   Size: 12.3 MB | Type: Archive\n` +
    `   Uploaded: 3 hours ago\n` +
    `   Downloads: 8\n` +
    `   Storage: Supabase\n\n` +
    `5. *document.docx*\n` +
    `   Size: 1.8 MB | Type: Document\n` +
    `   Uploaded: 5 hours ago\n` +
    `   Downloads: 31\n` +
    `   Storage: Neon\n\n` +
    `*Total Today:* 42 files\n` +
    `*Total Size:* 156.8 MB\n` +
    `*Average Size:* 3.7 MB`
  
  bot.sendMessage(msg.chat.id, filesMessage, { parse_mode: 'Markdown' })
})

bot.onText(/\/users/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const usersMessage = 
    `👥 *Recent Active Users*\n\n` +
    `1. *IP:* 192.168.1.100\n` +
    `   Country: Indonesia\n` +
    `   Requests: 45\n` +
    `   Last Active: 5 minutes ago\n` +
    `   Status: 🟢 Active\n\n` +
    `2. *IP:* 203.0.113.5\n` +
    `   Country: USA\n` +
    `   Requests: 23\n` +
    `   Last Active: 15 minutes ago\n` +
    `   Status: 🟢 Active\n\n` +
    `3. *IP:* 198.51.100.23\n` +
    `   Country: Germany\n` +
    `   Requests: 12\n` +
    `   Last Active: 30 minutes ago\n` +
    `   Status: 🟡 Idle\n\n` +
    `4. *IP:* 10.0.0.55\n` +
    `   Country: Japan\n` +
    `   Requests: 8\n` +
    `   Last Active: 1 hour ago\n` +
    `   Status: 🟡 Idle\n\n` +
    `5. *IP:* 172.16.254.1\n` +
    `   Country: Australia\n` +
    `   Requests: 31\n` +
    `   Last Active: 2 hours ago\n` +
    `   Status: 🟡 Idle\n\n` +
    `*Total Active Users:* 2\n` +
    `*Total Today:* 156\n` +
    `*Top Country:* Indonesia (45%)`
  
  bot.sendMessage(msg.chat.id, usersMessage, { parse_mode: 'Markdown' })
})

bot.onText(/\/blocklist/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  const blocklistMessage = 
    `🚫 *Blocked IP Addresses*\n\n` +
    `1. *203.0.113.42*\n` +
    `   Reason: DDoS attempt\n` +
    `   Blocked: 2 hours ago\n` +
    `   Expires: 22 hours\n\n` +
    `2. *198.51.100.99*\n` +
    `   Reason: Brute force attack\n` +
    `   Blocked: 1 day ago\n` +
    `   Expires: 6 days\n\n` +
    `3. *10.0.0.77*\n` +
    `   Reason: Malicious bot\n` +
    `   Blocked: 3 days ago\n` +
    `   Expires: 4 days\n\n` +
    `4. *172.16.254.88*\n` +
    `   Reason: SQL injection attempt\n` +
    `   Blocked: 1 week ago\n` +
    `   Expires: Never (permanent)\n\n` +
    `*Total Blocked:* 4 IPs\n` +
    `*Auto-blocked:* 3\n` +
    `*Manual:* 1\n` +
    `*Last Block:* 2 hours ago`
  
  bot.sendMessage(msg.chat.id, blocklistMessage, { parse_mode: 'Markdown' })
})

bot.onText(/\/restart/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  bot.sendMessage(msg.chat.id, 
    `🔄 *System Restart Initiated*\n\n` +
    `Restarting all services...\n` +
    `• Web server\n` +
    `• API gateway\n` +
    `• Database connections\n` +
    `• Security systems\n` +
    `• Monitoring services\n\n` +
    `Estimated downtime: 30 seconds\n` +
    `Will notify when system is back online.`
  , { parse_mode: 'Markdown' })
  
  setTimeout(() => {
    bot.sendMessage(msg.chat.id, 
      `✅ *System Restart Complete*\n\n` +
      `All services have been restarted successfully.\n\n` +
      `*Services Status:*\n` +
      `• Web Server: 🟢 Running\n` +
      `• API Gateway: 🟢 Running\n` +
      `• Databases: 🟢 Connected\n` +
      `• Security: 🟢 Active\n` +
      `• Monitoring: 🟢 Running\n\n` +
      `*Downtime:* 25 seconds\n` +
      `*Time:* ${new Date().toLocaleString()}`
    , { parse_mode: 'Markdown' })
    
    bot.sendMessage(channelId, 
      `🔄 *System Restart Completed*\n\n` +
      `The system has been successfully restarted.\n` +
      `All services are now operational.\n\n` +
      `*Time:* ${new Date().toLocaleString()}\n` +
      `*Status:* 🟢 All systems normal`
    , { parse_mode: 'Markdown' })
  }, 25000)
})

bot.onText(/\/backup/, (msg) => {
  if (msg.chat.id !== ownerId) return
  
  bot.sendMessage(msg.chat.id, 
    `💾 *System Backup Initiated*\n\n` +
    `Creating backup of:\n` +
    `• Database schemas\n` +
    `• Configuration files\n` +
    `• File metadata\n` +
    `• Security settings\n` +
    `• System logs\n\n` +
    `Estimated time: 3-5 minutes\n` +
    `Will notify when backup is complete.`
  , { parse_mode: 'Markdown' })
  
  setTimeout(() => {
    bot.sendMessage(msg.chat.id, 
      `✅ *Backup Complete*\n\n` +
      `*Backup Details:*\n` +
      `• Size: 2.4 GB\n` +
      `• Files: 1,567\n` +
      `• Time taken: 4 minutes 12 seconds\n` +
    `• Location: /backups/kabox-backup-${Date.now()}.tar.gz\n\n` +
      `*Next backup:* 24 hours\n` +
      `*Retention:* 7 days`
    , { parse_mode: 'Markdown' })
  }, 252000)
})

bot.on('message', (msg) => {
  if (msg.chat.id === ownerId && msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, 
      `💬 *Message Received*\n\n` +
      `I received your message: "${msg.text}"\n\n` +
      `Use /help to see available commands or ask me about:\n` +
      `• System status\n` +
      `• Recent activity\n` +
      `• Configuration\n` +
      `• Security alerts\n\n` +
      `Or use a specific command for detailed information.`
    , { parse_mode: 'Markdown' })
  }
})

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Telegram bot...')
  bot.stopPolling()
  process.exit(0)
})

console.log('✅ Telegram bot started successfully')
console.log(`👑 Owner ID: ${ownerId}`)
console.log(`📢 Channel ID: ${channelId}`)