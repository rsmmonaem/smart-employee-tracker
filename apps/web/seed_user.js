const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../../.env' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  console.log('Creating test user...')
  
  // 1. Create User in Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@example.com',
    password: 'password123',
    email_confirm: true
  })
  
  if (error) {
     if (error.message.includes('already registered')) {
         console.log('User already exists. You can log in with admin@example.com / password123')
         return
     }
     console.error('Error creating user:', error)
     return
  }
  
  const userId = data.user.id
  console.log('User created in auth.users:', userId)
  
  // 2. Create a Tenant
  const { data: tenant, error: tenantErr } = await supabase.from('tenants').insert({
     name: 'Test Tenant',
     slug: 'test-tenant',
     plan: 'BASIC'
  }).select().single()
  
  if (tenantErr) {
      console.error('Error creating tenant:', tenantErr)
      return
  }
  
  // 3. Wait a moment for the public.users trigger to fire, then update the public.users record
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const { error: updateErr } = await supabase.from('users').update({
     tenant_id: tenant.id,
     role: 'TENANT_ADMIN',
     full_name: 'Admin User'
  }).eq('id', userId)

  if (updateErr) {
      console.error('Error updating public user:', updateErr)
      return
  }
  
  console.log('\n✅ Success! You can now log into the web app with:')
  console.log('Email: admin@example.com')
  console.log('Password: password123')
}

seed()
