import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

const DEFAULT_TRACK_SETTINGS = {
  // 1. Work Day Settings
  workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],

  // 2. Work Time Settings
  expectedWorkHours: '8 hour',
  expectedProductiveTime: '6 hour',
  expectedActiveTime: '8 hour (Recommended)',
  timezone: 'Asia/Dhaka',
  expectedClockIn: '09:00 AM',

  // 3. Project Management
  enableProjectManagement: true,
  allowTeamAddEditDeleteTasks: true,
  allowTeamCompleteAndHoldTasks: true,
  allowTeamEditTaskTimes: true,
  sendEmailOnTaskStatusChange: false,
  autoStartEndTaskUsingCurrentTime: true,
  restrictNewTasksWhenPending: false,
  projectCurrency: 'United States Dollar ($)',

  // 4. Leave Management
  enableLeaveManagement: true,

  // 5. Manual Time
  enableManualTimeToEveryone: false,

  // 6. Untracked Hours Settings
  untrackedHoursBehavior: 'exclude', // 'exclude' | 'include'

  // 7. Payroll Settings
  enablePayrollCalculator: false,

  // 8. Keyboard & Mouse Activity Tracking
  enableTrackKeypressCountWindows: true,
  enableMouseActivityTrackingWindows: true,

  // 9. Email Report Settings
  emailReportScope: 'all', // 'all' | 'exclude_admin' | 'exclude_admin_head'

  // 10. Screenshot Settings
  enableScreenCapture: true,
  blurScreenCapture: false,
  screenshotInterval: 'Every 10 mins',
  allowTimelapseVideo: true,

  // 11. Idle Time Settings
  idleTimeout: '1 min',

  // 12. Permissions
  hideAdminTrackingAndLeaveFromHeads: false,
  allowEmployeeSeeScreenshot: true,
  allowEmployeeDeleteScreenshot: false,
  allowHeadsDeleteExportScreenshot: true,
  allowEmployeeSeeTimesheet: true,
  allowEmployeeSeeTimelapse: true,
  allowHeadsReviewAppsSites: true,
  allowEmployeeAccessWebsite: true,
  hideAdminDataFromAllPages: false,
  hideTeamHeadDataFromAllPages: false,
  hideEditTrackSettingsFromHeads: true,

  // 13. Holiday Settings
  autoSendHolidayNotifications: true,

  // 14. API Settings
  enableApiAccess: false,

  // 15. Real Time Alert Settings
  enableRealTimeAlert: true,

  // Member overrides
  memberOverrides: {} as Record<string, Record<string, unknown>>,
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. Fetch saved settings
    const { data: row, error } = await supabase
      .from('platform_settings')
      .select('value, updated_at')
      .eq('key', 'organization_track_settings')
      .maybeSingle()

    if (error) {
      console.warn('Could not read settings from platform_settings:', error.message)
    }

    const savedSettings = (row?.value as Record<string, unknown>) || {}
    const mergedSettings = {
      ...DEFAULT_TRACK_SETTINGS,
      ...savedSettings,
      updated_at: row?.updated_at || null,
    }

    // 2. Fetch users for members table
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, full_name, email, role, is_active, tracking_mode, created_at')
      .order('created_at', { ascending: false })

    if (usersErr) {
      console.warn('Could not read users for settings:', usersErr.message)
    }

    // Include Mohammad Munayam Sowdagor fallback if user table has no custom user
    const memberList = (users && users.length > 0)
      ? users
      : [
          {
            id: 'Rezk1W9SpBD0avSuwkbkR',
            full_name: 'MOHAMMADMUNAYAM SOWDAGOR',
            email: 'vrkm55@gmail.com',
            role: 'TENANT_ADMIN',
            is_active: true,
            tracking_mode: 'VISIBLE',
            created_at: new Date().toISOString(),
          }
        ]

    return NextResponse.json({
      success: true,
      settings: mergedSettings,
      members: memberList,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Settings GET error:', err)
    return NextResponse.json(
      { success: false, error: message, settings: DEFAULT_TRACK_SETTINGS, members: [] },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('platform_settings')
      .upsert(
        {
          key: 'organization_track_settings',
          value: body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('Error saving track settings:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: body,
      updated_at: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Settings POST error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
