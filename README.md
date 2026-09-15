# Kabox CDN - Modern File Hosting Service

A modern, secure, and high-performance CDN and file hosting service built with Next.js, React, and multiple database backends.

## Features

### 🚀 Core Features
- **Multi-Database Storage**: Files distributed across Supabase, Neon, Turso, Cloudinary, and ImageKit
- **Smart Routing**: Automatic selection of optimal storage based on file type and size
- **High Security**: End-to-end encryption, rate limiting, IP blocking, and attack detection
- **Real-time Monitoring**: Live statistics and system health monitoring
- **Telegram Bot**: Complete system control and monitoring via Telegram

### 📁 File Handling
- Support for all major file types (images, videos, documents, archives, etc.)
- Maximum file size: 100MB per file
- Maximum files per upload: 5
- Automatic file validation and malicious content detection
- Expired file cleanup (30 days retention)

### 🔒 Security
- Rate limiting (10 requests/second per IP)
- IP blocking for malicious activity
- SQL injection prevention
- XSS protection
- DDoS mitigation
- File type verification
- Content security headers

### 🌐 Internationalization
- English and Indonesian language support
- Automatic language detection based on IP location
- Professional translations

### 🤖 Telegram Bot Features
1. System statistics and monitoring
2. File management
3. User activity tracking
4. IP blocking/unblocking
5. System restart and cleanup
6. Broadcast announcements
7. Alert configuration
8. Database statistics
9. Uptime monitoring
10. Traffic analytics
11. Log viewing
12. Configuration management
13. Backup management
14. Real-time monitoring
15. Search functionality
16. Error notifications
17. Security alerts
18. Daily reports
19. Test notifications
20. Help system

## Project Structure

```

kabox-cdn/
├── app/
│   ├── [locale]/           # Internationalized pages
│   │   ├── page.tsx       # Home page
│   │   ├── docs/page.tsx  # API documentation
│   │   └── layout.tsx     # Layout with i18n
│   ├── api/               # API routes
│   │   ├── upload/        # File upload
│   │   ├── files/         # File operations
│   │   ├── stats/         # Statistics
│   │   └── admin/         # Admin endpoints
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── header.tsx        # Navigation header
│   ├── footer.tsx        # Site footer
│   ├── uploader.tsx      # File upload component
│   ├── stats.tsx         # Statistics display
│   └── api-documentation.tsx
├── lib/                  # Core libraries
│   ├── database.ts       # Multi-database manager
│   ├── security.ts       # Security manager
│   ├── telegram-bot.ts   # Telegram bot
│   ├── file-validator.ts # File validation
│   ├── i18n.ts          # Internationalization
│   └── utils.ts          # Utility functions
├── scripts/              # Setup scripts
│   ├── setup-database.js # Database setup
│   └── telegram-bot.js   # Bot setup
├── middleware.ts         # Edge middleware
├── tailwind.config.js    # Tailwind config
├── next.config.js       # Next.js config
├── vercel.json          # Vercel config
└── package.json         # Dependencies

```

## Setup Instructions

### 1. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit .env.local with your database credentials and API keys.

2. Install Dependencies

```bash
npm install
```

3. Setup Databases

```bash
npm run setup-db
```

This will create necessary tables in all configured databases.

4. Generate TypeScript Types

```bash
npm run generate-types
```

5. Start Development Server

```bash
npm run dev
```

6. Start Telegram Bot (separate terminal)

```bash
npm run telegram-bot
```

Database Setup Commands

Supabase SQL

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  hash TEXT NOT NULL,
  db_type TEXT NOT NULL,
  url TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  downloads INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_files_hash ON files(hash);
CREATE INDEX idx_files_db_type ON files(db_type);
```

Neon SQL

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  hash TEXT NOT NULL,
  db_type TEXT NOT NULL,
  url TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  downloads INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_neon_files_created_at ON files(created_at);
CREATE INDEX idx_neon_files_hash ON files(hash);
```

Turso SQL

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  hash TEXT NOT NULL,
  db_type TEXT NOT NULL,
  url TEXT NOT NULL,
  source_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  downloads INTEGER DEFAULT 0,
  last_accessed TEXT
);

CREATE INDEX idx_turso_files_created_at ON files(created_at);
CREATE INDEX idx_turso_files_hash ON files(hash);
```

API Documentation

Upload File

```http
POST /api/upload
Content-Type: multipart/form-data

curl -X POST https://kabox.my.id/api/upload \
  -F "files=@image.jpg"
```

Check File Status

```http
GET /api/files/:id/status

curl https://kabox.my.id/api/files/abc123/status
```

Get File Info

```http
GET /api/files/:id

curl https://kabox.my.id/api/files/abc123
```

Download File

```http
GET /api/files/:id/download

curl -OJ https://kabox.my.id/api/files/abc123/download
```

Upload via URL

```http
POST /api/upload/url
Content-Type: application/json

{
  "url": "https://example.com/image.jpg"
}
```

Deployment

Vercel

The project is configured for Vercel deployment with vercel.json.

```bash
vercel deploy
```

Environment Variables for Vercel

All environment variables from .env.local should be added to Vercel project settings.

Security Considerations

1. Never commit .env.local to version control
2. Use strong secrets for SESSION_SECRET, JWT_SECRET, and ENCRYPTION_KEY
3. Regularly rotate API keys
4. Monitor security logs in Telegram bot
5. Keep dependencies updated
6. Use HTTPS in production

Monitoring

The system includes comprehensive monitoring:

1. Telegram Bot: Real-time notifications and system control
2. Security Logs: All security events are logged
3. System Metrics: Uptime, memory usage, request rates
4. Database Health: Connection status and performance
5. CDN Performance: Upload/download speeds and cache rates

Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

License

This project is proprietary software.

Support

· Telegram: @akamodebaik
· Email: akaanakbaik17@proton.me
· GitHub: https://github.com/akaanakbaik

Credits

Created by aka with ❤️ and code.

Website: https://akaa.dev
GitHub: https://github.com/akaanakbaik
Telegram: @akamodebaik

```