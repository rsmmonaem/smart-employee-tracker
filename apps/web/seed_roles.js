const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../../.env' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
    console.log('Seeding additional roles...')

    const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', 'test-tenant').single()
    const tenantId = tenant?.id

    // Super Admin
    const { data: sa, error: saErr } = await supabase.auth.admin.createUser({ 
        email: 'superadmin@example.com', 
        password: 'password123', 
        email_confirm: true 
    })
    
    if (sa && !saErr) {
        await new Promise(r => setTimeout(r, 1000))
        await supabase.from('users').update({ role: 'SUPER_ADMIN', full_name: 'Super Admin' }).eq('id', sa.user.id)
        console.log("Created superadmin@example.com")
    } else {
        console.log("Superadmin probably already exists")
    }

    // Employee
    const { data: emp, error: empErr } = await supabase.auth.admin.createUser({ 
        email: 'employee@example.com', 
        password: 'password123', 
        email_confirm: true 
    })
    
    if (emp && !empErr && tenantId) {
        await new Promise(r => setTimeout(r, 1000))
        await supabase.from('users').update({ role: 'EMPLOYEE', full_name: 'Employee', tenant_id: tenantId }).eq('id', emp.user.id)
        console.log("Created employee@example.com linked to tenant")
    } else {
        console.log("Employee probably already exists")
    }
}

seed()
