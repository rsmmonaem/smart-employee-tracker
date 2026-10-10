import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// GET all screenshots with storage size statistics (STRICT MULTI-TENANT ISOLATED)
export async function GET(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetDate = searchParams.get('date') // optional YYYY-MM-DD
    const userId = searchParams.get('userId') // optional filter (UUID or email)
    const team = searchParams.get('team') || searchParams.get('teamId') // optional filter (name or UUID)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = parseInt(searchParams.get('limit') || searchParams.get('pageSize') || '24', 10)
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    // 1. Fetch Tenant Retention Settings from platform_settings
    let autoDeleteEnabled = false
    let retentionDays = 30
    try {
      const { data: settingsRow } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'organization_track_settings')
        .maybeSingle()
      if (settingsRow?.value && typeof settingsRow.value === 'object') {
        const val = settingsRow.value as Record<string, unknown>
        if (typeof val.autoDeleteScreenshots === 'boolean') {
          autoDeleteEnabled = val.autoDeleteScreenshots
        }
        if (typeof val.screenshotRetentionDays === 'number') {
          retentionDays = val.screenshotRetentionDays
        }
      }
    } catch {
      // ignore
    }

    // 2. Opportunistic Auto-Purge if enabled
    if (autoDeleteEnabled && retentionDays > 0) {
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()
      ;(async () => {
        try {
          let purgeQ = supabase.from('screenshots').select('id, storage_path').lt('taken_at', cutoff).limit(100)
          if (!session.isSuperAdmin && session.tenantId) {
            purgeQ = purgeQ.eq('tenant_id', session.tenantId)
          }
          const { data: expired } = await purgeQ
          if (expired && expired.length > 0) {
            const expIds = expired.map((e) => e.id)
            const expPaths = expired.map((e) => e.storage_path).filter(Boolean)
            await supabase.from('screenshots').delete().in('id', expIds)
            if (expPaths.length > 0) {
              await supabase.storage.from('screenshots').remove(expPaths)
            }
          }
        } catch (e) {
          console.warn('Opportunistic screenshot purge error:', e)
        }
      })()
    }

    let query = supabase
      .from('screenshots')
      .select('id, tenant_id, user_id, storage_path, taken_at, is_blurred, created_at, users(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Strict Tenant Isolation
    if (!session.isSuperAdmin) {
      if (!session.tenantId) {
        return NextResponse.json({
          success: true,
          screenshots: [],
          count: 0,
          totalCount: 0,
          page: 1,
          totalPages: 1,
          storageStats: {
            totalCount: 0,
            totalBytes: 0,
            totalFormatted: '0 B',
            selectedDateCount: 0,
            selectedDateBytes: 0,
            selectedDateFormatted: '0 B',
            dailyBreakdown: [],
            retention: { autoDelete: autoDeleteEnabled, retentionDays },
          },
        })
      }
      query = query.eq('tenant_id', session.tenantId)

      if (session.role === 'EMPLOYEE') {
        query = query.eq('user_id', session.userId)
      }
    }

    // Filter by specific Employee (by UUID or email)
    if (userId && userId !== 'all') {
      if (userId.includes('@')) {
        let uLookup = supabase.from('users').select('id').eq('email', userId)
        if (!session.isSuperAdmin && session.tenantId) {
          uLookup = uLookup.eq('tenant_id', session.tenantId)
        }
        const { data: u } = await uLookup.maybeSingle()
        if (u?.id) {
          query = query.eq('user_id', u.id)
        } else {
          return NextResponse.json({
            success: true,
            screenshots: [],
            count: 0,
            totalCount: 0,
            page: 1,
            totalPages: 1,
          })
        }
      } else {
        query = query.eq('user_id', userId)
      }
    }

    // Filter by Team if selected
    if (team && team !== 'all' && team !== 'All Team') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(team)
      let targetTeamId = isUUID ? team : null

      if (!targetTeamId) {
        let teamLookup = supabase.from('teams').select('id').ilike('name', team)
        if (!session.isSuperAdmin && session.tenantId) {
          teamLookup = teamLookup.eq('tenant_id', session.tenantId)
        }
        const { data: teamRow } = await teamLookup.maybeSingle()
        targetTeamId = teamRow?.id || null
      }

      if (targetTeamId) {
        let memberQuery = supabase.from('team_members').select('user_id').eq('team_id', targetTeamId)
        if (!session.isSuperAdmin && session.tenantId) {
          memberQuery = memberQuery.eq('tenant_id', session.tenantId)
        }
        const { data: members } = await memberQuery
        const memberIds = (members || []).map((m) => m.user_id)

        if (memberIds.length > 0) {
          query = query.in('user_id', memberIds)
        } else {
          return NextResponse.json({
            success: true,
            screenshots: [],
            count: 0,
            totalCount: 0,
            page: 1,
            totalPages: 1,
          })
        }
      }
    }

    if (targetDate) {
      const startOfDay = `${targetDate}T00:00:00.000Z`
      const endOfDay = `${targetDate}T23:59:59.999Z`
      query = query.gte('taken_at', startOfDay).lte('taken_at', endOfDay)
    }

    query = query.range(offset, offset + limit - 1)

    // Execute Main Query
    const { data, error, count: totalCount } = await query

    if (error) {
      console.error('Error fetching screenshots from database:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Calculate Storage Stats & Daily Breakdown
    let totalTenantCount = totalCount ?? (data || []).length
    let totalTenantBytes = totalTenantCount * 75 * 1024
    let dailyBreakdown: Array<{ date: string; count: number; bytes: number; formattedSize: string }> = []
    let selectedDateCount = 0

    try {
      // 1. Total Tenant Count scan
      let overallCountQ = supabase.from('screenshots').select('id', { count: 'exact', head: true })
      if (!session.isSuperAdmin && session.tenantId) {
        overallCountQ = overallCountQ.eq('tenant_id', session.tenantId)
      }
      const { count: oc } = await overallCountQ
      if (typeof oc === 'number') {
        totalTenantCount = oc
        totalTenantBytes = oc * 75 * 1024
      }

      // 2. Day-wise grouping from recent screenshots
      let recentDatesQ = supabase
        .from('screenshots')
        .select('taken_at')
        .order('taken_at', { ascending: false })
        .limit(2000)

      if (!session.isSuperAdmin && session.tenantId) {
        recentDatesQ = recentDatesQ.eq('tenant_id', session.tenantId)
      }
      const { data: dateRows } = await recentDatesQ

      if (dateRows && dateRows.length > 0) {
        const countsByDay: Record<string, number> = {}
        for (const r of dateRows) {
          if (r.taken_at) {
            const d = r.taken_at.split('T')[0]
            countsByDay[d] = (countsByDay[d] || 0) + 1
          }
        }

        dailyBreakdown = Object.entries(countsByDay)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([d, cnt]) => {
            const b = cnt * 75 * 1024
            return {
              date: d,
              count: cnt,
              bytes: b,
              formattedSize: formatBytes(b),
            }
          })

        if (targetDate && countsByDay[targetDate]) {
          selectedDateCount = countsByDay[targetDate]
        }
      }
    } catch (e) {
      console.warn('Failed computing storage stats:', e)
    }

    const total = totalCount ?? (data || []).length
    const totalPages = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({
      success: true,
      screenshots: data || [],
      count: (data || []).length,
      totalCount: total,
      page,
      limit,
      totalPages,
      storageStats: {
        totalCount: totalTenantCount,
        totalBytes: totalTenantBytes,
        totalFormatted: formatBytes(totalTenantBytes),
        selectedDate: targetDate || null,
        selectedDateCount: selectedDateCount || (targetDate ? total : 0),
        selectedDateBytes: (selectedDateCount || (targetDate ? total : 0)) * 75 * 1024,
        selectedDateFormatted: formatBytes((selectedDateCount || (targetDate ? total : 0)) * 75 * 1024),
        dailyBreakdown,
        retention: {
          autoDelete: autoDeleteEnabled,
          retentionDays,
        },
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('GET /api/admin/screenshots error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE screenshots (STRICT MULTI-TENANT ISOLATED: Single, Bulk, Day-wise, and Retention Purge)
export async function DELETE(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    let id = searchParams.get('id')
    let storagePath = searchParams.get('path')
    let deleteDate = searchParams.get('date') || searchParams.get('deleteDate')
    let purgeOlderThan = searchParams.get('purgeOlderThan') ? parseInt(searchParams.get('purgeOlderThan')!, 10) : 0
    let ids: string[] = []
    let storagePaths: string[] = []

    try {
      const body = await req.json()
      if (body) {
        if (body.ids && Array.isArray(body.ids)) {
          ids = body.ids
          storagePaths = body.paths || []
        } else if (body.id) {
          id = body.id
          storagePath = body.storagePath || body.path
        }
        if (body.deleteDate || body.date) {
          deleteDate = body.deleteDate || body.date
        }
        if (body.purgeOlderThan) {
          purgeOlderThan = parseInt(body.purgeOlderThan, 10)
        }
      }
    } catch {
      // no json body
    }

    const supabase = createAdminClient()

    // 1. Day-wise Deletion
    if (deleteDate) {
      const startOfDay = `${deleteDate}T00:00:00.000Z`
      const endOfDay = `${deleteDate}T23:59:59.999Z`

      let dayQ = supabase
        .from('screenshots')
        .select('id, storage_path')
        .gte('taken_at', startOfDay)
        .lte('taken_at', endOfDay)

      if (!session.isSuperAdmin && session.tenantId) {
        dayQ = dayQ.eq('tenant_id', session.tenantId)
      }

      const { data: dayRecords, error: fetchDayErr } = await dayQ
      if (fetchDayErr) {
        return NextResponse.json({ success: false, error: fetchDayErr.message }, { status: 500 })
      }

      if (!dayRecords || dayRecords.length === 0) {
        return NextResponse.json({ success: true, count: 0, message: `No screenshots found for ${deleteDate}` })
      }

      const idsToDelete = dayRecords.map((r) => r.id)
      const pathsToDelete = dayRecords.map((r) => r.storage_path).filter(Boolean)

      // Batch delete DB records
      for (let i = 0; i < idsToDelete.length; i += 100) {
        const chunk = idsToDelete.slice(i, i + 100)
        await supabase.from('screenshots').delete().in('id', chunk)
      }

      // Batch delete Storage files
      for (let i = 0; i < pathsToDelete.length; i += 100) {
        const chunk = pathsToDelete.slice(i, i + 100)
        await supabase.storage.from('screenshots').remove(chunk)
      }

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${idsToDelete.length} screenshots for ${deleteDate}`,
        count: idsToDelete.length,
      })
    }

    // 2. Retention Purge (Older than N days)
    if (purgeOlderThan > 0) {
      const cutoffDate = new Date(Date.now() - purgeOlderThan * 24 * 60 * 60 * 1000).toISOString()

      let oldQ = supabase
        .from('screenshots')
        .select('id, storage_path')
        .lt('taken_at', cutoffDate)
        .limit(1000)

      if (!session.isSuperAdmin && session.tenantId) {
        oldQ = oldQ.eq('tenant_id', session.tenantId)
      }

      const { data: oldRecords, error: fetchOldErr } = await oldQ
      if (fetchOldErr) {
        return NextResponse.json({ success: false, error: fetchOldErr.message }, { status: 500 })
      }

      if (!oldRecords || oldRecords.length === 0) {
        return NextResponse.json({
          success: true,
          count: 0,
          message: `No screenshots found older than ${purgeOlderThan} days`,
        })
      }

      const idsToDelete = oldRecords.map((r) => r.id)
      const pathsToDelete = oldRecords.map((r) => r.storage_path).filter(Boolean)

      for (let i = 0; i < idsToDelete.length; i += 100) {
        const chunk = idsToDelete.slice(i, i + 100)
        await supabase.from('screenshots').delete().in('id', chunk)
      }

      for (let i = 0; i < pathsToDelete.length; i += 100) {
        const chunk = pathsToDelete.slice(i, i + 100)
        await supabase.storage.from('screenshots').remove(chunk)
      }

      return NextResponse.json({
        success: true,
        message: `Successfully purged ${idsToDelete.length} screenshots older than ${purgeOlderThan} days`,
        count: idsToDelete.length,
      })
    }

    // 3. Check for specific ID or IDs
    if (!id && ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Screenshot ID, IDs, or deleteDate is required' }, { status: 400 })
    }

    // Subscription Plan check for bulk selections
    const isBulk = ids.length > 1

    if (isBulk && !session.isSuperAdmin) {
      let tenantPlan = 'BASIC'
      if (session.tenantId) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('plan')
          .eq('id', session.tenantId)
          .single()
        tenantPlan = tenant?.plan || 'BASIC'
      }

      if (tenantPlan === 'BASIC') {
        return NextResponse.json(
          {
            success: false,
            error: 'Bulk screenshot deletion is a PRO feature. Upgrade to Smart Employee Tracker PRO to delete multiple screenshots at once.',
            requiresUpgrade: true,
            currentPlan: 'BASIC',
            requiredPlan: 'PRO',
            feature: 'BULK_SCREENSHOT_DELETE',
          },
          { status: 403 }
        )
      }
    }

    // 4. Single Deletion
    if (id && ids.length <= 1) {
      const targetId = id || ids[0]
      const { data: targetRecord } = await supabase
        .from('screenshots')
        .select('id, storage_path, tenant_id, user_id')
        .eq('id', targetId)
        .single()

      if (!targetRecord) {
        return NextResponse.json({ success: false, error: 'Screenshot not found' }, { status: 404 })
      }

      if (!session.isSuperAdmin && targetRecord.tenant_id !== session.tenantId) {
        return NextResponse.json({ success: false, error: 'Forbidden: Cannot delete other companies data' }, { status: 403 })
      }

      const { error: dbErr } = await supabase.from('screenshots').delete().eq('id', targetId)
      if (dbErr) {
        return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
      }

      const targetPath = storagePath || targetRecord.storage_path
      if (targetPath) {
        await supabase.storage.from('screenshots').remove([targetPath])
      }

      return NextResponse.json({
        success: true,
        message: 'Screenshot deleted successfully',
      })
    }

    // 5. Bulk Deletion by IDs
    let fetchQuery = supabase.from('screenshots').select('id, storage_path, tenant_id').in('id', ids)
    if (!session.isSuperAdmin && session.tenantId) {
      fetchQuery = fetchQuery.eq('tenant_id', session.tenantId)
    }

    const { data: rows } = await fetchQuery
    const validIds = (rows || []).map((r) => r.id)
    const validPaths = (rows || []).map((r) => r.storage_path).filter(Boolean)

    if (validIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No matching screenshots found for your company' }, { status: 404 })
    }

    const { error: bulkDbErr } = await supabase.from('screenshots').delete().in('id', validIds)
    if (bulkDbErr) {
      return NextResponse.json({ success: false, error: bulkDbErr.message }, { status: 500 })
    }

    if (validPaths.length > 0) {
      await supabase.storage.from('screenshots').remove(validPaths)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${validIds.length} screenshots`,
      count: validIds.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('DELETE /api/admin/screenshots error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
