import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function isAlreadyInstalled(): boolean {
  try {
    const lockPath = path.resolve(process.cwd(), '.installed')
    const rootLockPath = path.resolve(process.cwd(), '../../.installed')
    return fs.existsSync(lockPath) || fs.existsSync(rootLockPath)
  } catch {
    return false
  }
}

export async function GET() {
  const installed = isAlreadyInstalled()
  return NextResponse.json({
    installed,
    status: installed ? 'INSTALLED' : 'NOT_INSTALLED',
    version: '1.1.0',
  })
}

export async function POST(req: Request) {
  try {
    if (isAlreadyInstalled()) {
      return NextResponse.json(
        { success: false, error: 'Platform is already installed. To re-install, delete the .installed lockfile.' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { action, databaseUrl, supabaseUrl, anonKey, serviceRoleKey, appUrl, adminName, adminEmail, adminPassword } = body

    // 1. Action: Test Database & Supabase Connection
    if (action === 'test-connection') {
      if (!databaseUrl) {
        return NextResponse.json({ success: false, error: 'PostgreSQL Database URL is required.' }, { status: 400 })
      }

      // Test Postgres connection
      let client: Client | null = null
      try {
        client = new Client({
          connectionString: databaseUrl,
          ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
          connectionTimeoutMillis: 7000,
        })
        await client.connect()
        await client.query('SELECT 1;')
      } catch (dbErr: any) {
        return NextResponse.json({ success: false, error: `Database Connection Failed: ${dbErr?.message || 'Check database credentials'}` }, { status: 400 })
      } finally {
        if (client) await client.end().catch(() => {})
      }

      // Test Supabase Admin API
      if (supabaseUrl && serviceRoleKey) {
        try {
          const testSupabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
          const { error: sbErr } = await testSupabase.auth.admin.listUsers({ page: 1, perPage: 1 })
          if (sbErr) {
            return NextResponse.json({ success: false, error: `Supabase API Failed: ${sbErr.message}` }, { status: 400 })
          }
        } catch (sbEx: any) {
          return NextResponse.json({ success: false, error: `Supabase API Error: ${sbEx?.message || 'Check service role key'}` }, { status: 400 })
        }
      }

      return NextResponse.json({ success: true, message: 'All connection tests passed successfully!' })
    }

    // 2. Action: Execute 1-Click Installation
    if (action === 'execute-install') {
      if (!databaseUrl || !supabaseUrl || !anonKey || !serviceRoleKey || !adminEmail || !adminPassword) {
        return NextResponse.json({ success: false, error: 'Missing required configuration fields.' }, { status: 400 })
      }

      // Step A: Load SQL Schema
      let schemaSql = ''
      const possiblePaths = [
        path.resolve(process.cwd(), 'src/lib/install/schema.sql'),
        path.resolve(process.cwd(), 'supabase/complete_schema.sql'),
        path.resolve(process.cwd(), '../../supabase/complete_schema.sql'),
      ]

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          schemaSql = fs.readFileSync(p, 'utf8')
          break
        }
      }

      if (!schemaSql) {
        return NextResponse.json({ success: false, error: 'SQL Schema file not found. Ensure supabase/complete_schema.sql exists.' }, { status: 500 })
      }

      // Step B: Run PostgreSQL Migrations
      const pgClient = new Client({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
      })

      try {
        await pgClient.connect()
        await pgClient.query(schemaSql)
      } catch (sqlErr: any) {
        console.error('SQL Migration execution error:', sqlErr)
        return NextResponse.json({ success: false, error: `SQL Execution failed: ${sqlErr?.message || 'Check syntax or permissions'}` }, { status: 500 })
      } finally {
        await pgClient.end().catch(() => {})
      }

      // Step C: Supabase Storage & SuperAdmin Provisioning
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

      // Create storage bucket 'screenshots' if missing
      try {
        await supabaseAdmin.storage.createBucket('screenshots', { public: true })
      } catch {
        // bucket might already exist, safe to ignore
      }

      // Create initial SuperAdmin user account in Supabase Auth
      let adminUserId = ''
      try {
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { full_name: adminName || 'Super Admin' },
        })

        if (authErr && !authErr.message.includes('already exists') && !authErr.message.includes('registered')) {
          return NextResponse.json({ success: false, error: `Failed to create SuperAdmin account: ${authErr.message}` }, { status: 500 })
        }

        if (authData?.user) {
          adminUserId = authData.user.id
        } else {
          // If already exists, lookup id
          const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', adminEmail).maybeSingle()
          adminUserId = existingUser?.id || ''
        }
      } catch (authEx: any) {
        console.warn('SuperAdmin provisioning warning:', authEx)
      }

      // Upsert SuperAdmin record in public.users table
      if (adminUserId) {
        await supabaseAdmin.from('users').upsert({
          id: adminUserId,
          email: adminEmail,
          full_name: adminName || 'Super Admin',
          role: 'SUPER_ADMIN',
        })
      }

      // Step D: Write production .env.local file
      const finalAppUrl = appUrl || 'http://localhost:3000'
      const envLines = [
        `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
        `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`,
        `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`,
        `DATABASE_URL=${databaseUrl}`,
        `NEXT_PUBLIC_APP_URL=${finalAppUrl}`,
        `PORT=3000`,
        `NODE_ENV=production`,
      ].join('\n')

      const localEnvPath = path.resolve(process.cwd(), '.env.local')
      const rootEnvPath = path.resolve(process.cwd(), '../../.env')

      fs.writeFileSync(localEnvPath, envLines, 'utf8')
      try {
        fs.writeFileSync(rootEnvPath, envLines, 'utf8')
      } catch {
        // ignore if root unwritable
      }

      // Step E: Create .installed lockfile
      const lockData = JSON.stringify({
        installed_at: new Date().toISOString(),
        version: '1.1.0',
        admin_email: adminEmail,
      }, null, 2)

      fs.writeFileSync(path.resolve(process.cwd(), '.installed'), lockData, 'utf8')

      return NextResponse.json({
        success: true,
        message: 'Platform and database installed successfully! Redirecting to login...',
        redirectUrl: '/login',
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid installer action' }, { status: 400 })
  } catch (err: any) {
    console.error('Installer endpoint error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unexpected installer error' }, { status: 500 })
  }
}
