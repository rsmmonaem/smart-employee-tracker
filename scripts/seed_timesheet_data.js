const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIMXmgBNN_F_n8flvdjebQgPkWmGsDi_m_TdfH6p1s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTimesheet() {
  console.log('Seeding real timesheet users & attendance data...');

  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', 'test-tenant').single();
  if (!tenant) {
    console.error('Tenant not found');
    return;
  }
  const tenantId = tenant.id;

  const usersToEnsure = [
    { email: 'abdullah@workfolio.io', fullName: 'Abdullah Hossain', role: 'EMPLOYEE' },
    { email: 'avijit@workfolio.io', fullName: 'Avijit Barua', role: 'EMPLOYEE' },
    { email: 'farhan@workfolio.io', fullName: 'Farhan Jarif Nibir', role: 'EMPLOYEE' },
    { email: 'tawhidul@workfolio.io', fullName: 'Tawhidul Islam', role: 'EMPLOYEE' },
  ];

  const userMap = {};

  // 1. Fetch existing users
  const { data: existingUsers } = await supabase.from('users').select('id, email');
  existingUsers?.forEach((u) => {
    userMap[u.email] = u.id;
  });

  // 2. Create missing users in auth & public.users
  for (const u of usersToEnsure) {
    if (!userMap[u.email]) {
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: 'password123',
        email_confirm: true,
      });

      if (authUser?.user) {
        userMap[u.email] = authUser.user.id;
        await supabase
          .from('users')
          .update({
            tenant_id: tenantId,
            full_name: u.fullName,
            role: u.role,
            is_active: true,
          })
          .eq('id', authUser.user.id);
        console.log(`Created user: ${u.fullName} (${u.email})`);
      } else if (authErr) {
        console.warn(`User creation notice for ${u.email}:`, authErr.message);
      }
    } else {
      await supabase
        .from('users')
        .update({
          tenant_id: tenantId,
          full_name: u.fullName,
          role: u.role,
          is_active: true,
        })
        .eq('id', userMap[u.email]);
    }
  }

  // 3. Clear existing attendance sessions to avoid duplicates
  await supabase.from('attendance_sessions').delete().eq('tenant_id', tenantId);

  // 4. Insert Yesterday Attendance Sessions (09 Sep, 2026)
  const yesterdaySessions = [
    {
      email: 'abdullah@workfolio.io',
      inTime: '2026-09-09T10:06:00.000Z',
      outTime: '2026-09-09T17:44:00.000Z', // 7h 38m work
      breakSec: 3480, // 58m
    },
    {
      email: 'avijit@workfolio.io',
      inTime: '2026-09-09T10:16:00.000Z',
      outTime: '2026-09-09T18:23:00.000Z', // 8h 07m work
      breakSec: 3600, // 1h 00m
    },
    {
      email: 'farhan@workfolio.io',
      inTime: '2026-09-09T10:01:00.000Z',
      outTime: '2026-09-09T18:01:00.000Z', // 8h 00m work
      breakSec: 3180, // 53m
    },
    {
      email: 'tawhidul@workfolio.io',
      inTime: '2026-09-09T10:30:00.000Z',
      outTime: '2026-09-09T19:15:00.000Z', // 8h 45m work
      breakSec: 4500, // 1h 15m
    },
  ];

  // Also include employee@example.com if present
  if (userMap['employee@example.com']) {
    yesterdaySessions.push({
      email: 'employee@example.com',
      inTime: '2026-09-09T10:00:00.000Z',
      outTime: '2026-09-09T18:45:00.000Z',
      breakSec: 2700,
    });
  }

  for (const sess of yesterdaySessions) {
    const uid = userMap[sess.email];
    if (!uid) continue;

    const { error } = await supabase.from('attendance_sessions').insert({
      tenant_id: tenantId,
      user_id: uid,
      clocked_in_at: sess.inTime,
      clocked_out_at: sess.outTime,
      total_break_sec: sess.breakSec,
      status: 'CLOSED',
    });

    if (error) {
      console.error(`Failed to insert session for ${sess.email}:`, error);
    } else {
      console.log(`Inserted attendance session for ${sess.email}`);
    }
  }

  console.log('Real timesheet data seeding complete!');
}

seedTimesheet().catch(console.error);
