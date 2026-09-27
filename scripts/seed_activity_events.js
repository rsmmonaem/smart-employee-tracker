const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIMXmgBNN_F_n8flvdjebQgPkWmGsDi_m_TdfH6p1s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedActivities() {
  console.log('Seeding real activity_events into Supabase...');

  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', 'test-tenant').single();
  const tenantId = tenant?.id || '7d91b2a1-c727-4f50-83ec-4fdb9debebd3';

  const userMap = {
    abdullah: '70b4258d-48d0-45c8-992c-cae3631f1a6d',
    avijit: 'f35961bb-22c9-4032-be2f-ec877982ca93',
    farhan: '0d36491c-e8b3-43e7-a668-001646067a64',
    tawhidul: '80345725-50a6-4184-a0d0-bc6f8f9a78d6',
  };

  // Base date: 09 Sep 2026 (Yesterday)
  const baseDate = '2026-09-09';

  const makeIso = (timeStr) => {
    return `${baseDate}T${timeStr}:00.000Z`;
  };

  const rawEvents = [
    // --- ABDULLAH HOSSAIN ---
    { user: 'abdullah', app: 'Visual Studio Code', win: 'App.tsx — smart-employee-tracker', class: 'PRODUCTIVE', start: '10:06', end: '10:30' },
    { user: 'abdullah', app: 'System Inactive', win: 'Away from desk', class: 'NEUTRAL', start: '10:30', end: '11:40' },
    { user: 'abdullah', app: 'Google Chrome', win: 'Pull Requests · GitHub', class: 'PRODUCTIVE', start: '11:40', end: '11:58' },
    { user: 'abdullah', app: 'Slack', win: '#general — Standup', class: 'NEUTRAL', start: '11:58', end: '12:15' },
    { user: 'abdullah', app: 'Visual Studio Code', win: 'route.ts — timeguard_api', class: 'PRODUCTIVE', start: '12:35', end: '13:10' },
    { user: 'abdullah', app: 'Google Meet', win: 'Daily Team Sync', class: 'NEUTRAL', start: '13:10', end: '13:30' },
    { user: 'abdullah', app: 'Visual Studio Code', win: 'Settings.tsx', class: 'PRODUCTIVE', start: '14:30', end: '14:40' },
    { user: 'abdullah', app: 'Visual Studio Code', win: 'track-settings-form.tsx', class: 'PRODUCTIVE', start: '14:55', end: '15:25' },
    { user: 'abdullah', app: 'YouTube', win: 'Music & LoFi Streams', class: 'UNPRODUCTIVE', start: '15:25', end: '15:40' },
    { user: 'abdullah', app: 'Terminal', win: 'cargo run -p timeguard_api', class: 'PRODUCTIVE', start: '15:40', end: '16:25' },
    { user: 'abdullah', app: 'Slack', win: '#tech-discussions', class: 'NEUTRAL', start: '16:40', end: '17:10' },
    { user: 'abdullah', app: 'Visual Studio Code', win: 'App.tsx — desktop agent sync', class: 'PRODUCTIVE', start: '17:10', end: '18:20' },
    { user: 'abdullah', app: 'GitHub Desktop', win: 'Commit: Smart Employee Tracker timesheet and timeline', class: 'PRODUCTIVE', start: '18:20', end: '18:58' },

    // --- AVIJIT BARUA ---
    { user: 'avijit', app: 'Slack', win: 'Sprint Standup & Planning', class: 'NEUTRAL', start: '10:16', end: '10:46' },
    { user: 'avijit', app: 'Postman', win: 'Supabase API Verification', class: 'PRODUCTIVE', start: '10:46', end: '11:01' },
    { user: 'avijit', app: 'RustRover', win: 'main.rs — timeguard_api', class: 'PRODUCTIVE', start: '11:13', end: '11:58' },
    { user: 'avijit', app: 'Google Chrome', win: 'PostgreSQL Documentation', class: 'NEUTRAL', start: '11:58', end: '12:33' },
    { user: 'avijit', app: 'Notion', win: 'Architecture Specs & Schema', class: 'NEUTRAL', start: '13:30', end: '14:20' },
    { user: 'avijit', app: 'RustRover', win: 'activity_stream.rs', class: 'PRODUCTIVE', start: '14:20', end: '15:45' },
    { user: 'avijit', app: 'Terminal', win: 'cargo test --workspace', class: 'PRODUCTIVE', start: '16:11', end: '17:41' },
    { user: 'avijit', app: 'Slack', win: '#team-releases', class: 'NEUTRAL', start: '17:41', end: '18:11' },
    { user: 'avijit', app: 'RustRover', win: 'database.rs migration', class: 'PRODUCTIVE', start: '18:11', end: '19:02' },

    // --- FARHAN JARIF NIBIR ---
    { user: 'farhan', app: 'Slack', win: 'Sprint Backlog & Tasks', class: 'NEUTRAL', start: '10:01', end: '10:23' },
    { user: 'farhan', app: 'Visual Studio Code', win: 'timesheet/page.tsx', class: 'PRODUCTIVE', start: '10:33', end: '11:08' },
    { user: 'farhan', app: 'Google Chrome', win: 'Next.js App Router Specs', class: 'PRODUCTIVE', start: '11:08', end: '11:58' },
    { user: 'farhan', app: 'Figma', win: 'Smart Employee Tracker Admin Design System', class: 'NEUTRAL', start: '11:58', end: '12:36' },
    { user: 'farhan', app: 'Visual Studio Code', win: 'Timeline.tsx', class: 'PRODUCTIVE', start: '12:48', end: '13:33' },
    { user: 'farhan', app: 'Visual Studio Code', win: 'App.tsx — smart-employee-tracker', class: 'PRODUCTIVE', start: '14:36', end: '14:37' },
    { user: 'farhan', app: 'Visual Studio Code', win: 'timeline/page.tsx', class: 'PRODUCTIVE', start: '14:37', end: '15:32' },
    { user: 'farhan', app: 'Slack', win: '#frontend-crew', class: 'NEUTRAL', start: '15:52', end: '16:32' },
    { user: 'farhan', app: 'Google Chrome', win: 'TailwindCSS Documentation & Tests', class: 'PRODUCTIVE', start: '16:32', end: '17:42' },
    { user: 'farhan', app: 'Visual Studio Code', win: 'Build verification & commit', class: 'PRODUCTIVE', start: '17:53', end: '19:00' },

    // --- TAWHIDUL ISLAM ---
    { user: 'tawhidul', app: 'Visual Studio Code', win: 'Architecture Workspace', class: 'PRODUCTIVE', start: '10:00', end: '10:45' },
    { user: 'tawhidul', app: 'Terminal', win: 'zsh — git pull origin main', class: 'PRODUCTIVE', start: '11:00', end: '11:30' },
    { user: 'tawhidul', app: 'Slack', win: 'Architecture Review & Feedback', class: 'NEUTRAL', start: '11:30', end: '12:05' },
    { user: 'tawhidul', app: 'Visual Studio Code', win: 'Supabase Realtime channels', class: 'PRODUCTIVE', start: '12:25', end: '13:10' },
    { user: 'tawhidul', app: 'Zoom', win: 'Lead Sync & Roadmap Discussion', class: 'NEUTRAL', start: '13:10', end: '13:30' },
    { user: 'tawhidul', app: 'Visual Studio Code', win: 'Tawhidul Islam active session', class: 'PRODUCTIVE', start: '14:36', end: '14:37' },
    { user: 'tawhidul', app: 'Visual Studio Code', win: 'timeguard_desktop core sync', class: 'PRODUCTIVE', start: '14:37', end: '16:07' },
    { user: 'tawhidul', app: 'Untracked Activity', win: 'External offline architecture meeting', class: 'NEUTRAL', start: '16:27', end: '17:07' },
    { user: 'tawhidul', app: 'Visual Studio Code', win: 'apps/web verification', class: 'PRODUCTIVE', start: '17:07', end: '18:07' },
    { user: 'tawhidul', app: 'Terminal', win: 'Release builds & checks', class: 'PRODUCTIVE', start: '18:27', end: '19:17' },
  ];

  const dbRows = rawEvents.map((ev) => ({
    tenant_id: tenantId,
    user_id: userMap[ev.user],
    app_name: ev.app,
    window_title: ev.win,
    started_at: makeIso(ev.start),
    ended_at: makeIso(ev.end),
    classification: ev.class,
  }));

  const { error } = await supabase.from('activity_events').insert(dbRows);
  if (error) {
    console.error('Error inserting activity events:', error);
  } else {
    console.log(`Successfully inserted ${dbRows.length} real activity events for Yesterday!`);
  }
}

seedActivities().catch(console.error);
