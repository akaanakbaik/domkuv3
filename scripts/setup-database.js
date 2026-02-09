const { createClient } = require('@supabase/supabase-js')
const { neon } = require('@neondatabase/serverless')
const { createClient: createTursoClient } = require('@libsql/client')

async function setupSupabase() {
  console.log('Setting up Supabase database...')
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { error: bucketError } = await supabase.storage.createBucket('files', {
    public: true,
    fileSizeLimit: 100 * 1024 * 1024
  })
  
  if (bucketError && !bucketError.message.includes('already exists')) {
    console.error('Error creating bucket:', bucketError)
  } else {
    console.log('✅ Supabase storage bucket created')
  }
  
  const { error: tableError } = await supabase.from('files').create(`
    CREATE TABLE IF NOT EXISTS files (
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
    )
  `)
  
  if (tableError) {
    console.error('Error creating table:', tableError)
  } else {
    console.log('✅ Supabase table created')
    
    const { error: indexError } = await supabase.from('files').create(`
      CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
      CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash);
      CREATE INDEX IF NOT EXISTS idx_files_db_type ON files(db_type);
    `)
    
    if (indexError) {
      console.error('Error creating indexes:', indexError)
    } else {
      console.log('✅ Supabase indexes created')
    }
  }
}

async function setupNeon() {
  console.log('Setting up Neon database...')
  
  try {
    const sql = neon(process.env.NEON_DB_URL)
    
    await sql(`
      CREATE TABLE IF NOT EXISTS files (
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
      )
    `)
    
    console.log('✅ Neon table created')
    
    await sql(`
      CREATE INDEX IF NOT EXISTS idx_neon_files_created_at ON files(created_at);
      CREATE INDEX IF NOT EXISTS idx_neon_files_hash ON files(hash);
    `)
    
    console.log('✅ Neon indexes created')
  } catch (error) {
    console.error('Error setting up Neon:', error)
  }
}

async function setupTurso() {
  console.log('Setting up Turso database...')
  
  try {
    const turso = createTursoClient({
      url: process.env.TURSO_DB_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    })
    
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS files (
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
      )
    `)
    
    console.log('✅ Turso table created')
    
    await turso.execute(`
      CREATE INDEX IF NOT EXISTS idx_turso_files_created_at ON files(created_at);
      CREATE INDEX IF NOT EXISTS idx_turso_files_hash ON files(hash);
    `)
    
    console.log('✅ Turso indexes created')
  } catch (error) {
    console.error('Error setting up Turso:', error)
  }
}

async function setupAllDatabases() {
  console.log('Starting database setup...\n')
  
  await setupSupabase()
  console.log()
  
  await setupNeon()
  console.log()
  
  await setupTurso()
  console.log()
  
  console.log('🎉 All databases setup completed!')
}

if (require.main === module) {
  require('dotenv').config({ path: '.env.local' })
  setupAllDatabases().catch(console.error)
}

module.exports = { setupAllDatabases }