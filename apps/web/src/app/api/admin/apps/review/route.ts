import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

const DEFAULT_PRODUCTIVITY_SEEDS = [
  // Coding & Development
  { pattern: 'Visual Studio Code', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'Code', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'Cursor', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'Sublime Text', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'IntelliJ IDEA', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'PyCharm', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'WebStorm', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'github.com', classification: 'PRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'gitlab.com', classification: 'PRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'bitbucket.org', classification: 'PRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'Postman', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'Docker', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'Terminal', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'Windows Explorer', classification: 'NEUTRAL', match_type: 'APP', priority: 2 },

  // Collaboration, Office & Design
  { pattern: 'Figma', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'figma.com', classification: 'PRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'Slack', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'Notion', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'notion.so', classification: 'PRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'Jira', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'atlassian.net', classification: 'PRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'Trello', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'Workfolio', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'TracMatrix', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },
  { pattern: 'Smart Employee Tracker', classification: 'PRODUCTIVE', match_type: 'APP', priority: 1 },

  // Social & Distractions
  { pattern: 'facebook.com', classification: 'UNPRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'youtube.com', classification: 'UNPRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'instagram.com', classification: 'UNPRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'tiktok.com', classification: 'UNPRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'netflix.com', classification: 'UNPRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'twitter.com', classification: 'UNPRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'x.com', classification: 'UNPRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
  { pattern: 'reddit.com', classification: 'UNPRODUCTIVE', match_type: 'DOMAIN', priority: 1 },
]

function isSystemLockOrIdle(name: string): boolean {
  const n = (name || '').toLowerCase().trim()
  return (
    !n ||
    n === 'untracked activity' ||
    n.includes('lockapp') ||
    n.includes('logonui') ||
    n.includes('screensaver') ||
    n.includes('loginwindow') ||
    n.startsWith('idle time') ||
    n.includes('screen locked') ||
    n.includes('lock screen')
  )
}

function findMatchingRule(
  name: string,
  ruleMap: Map<string, { classification: string; isUserSpecific: boolean; ruleId?: string }>
) {
  const lower = name.toLowerCase().trim()
  if (ruleMap.has(lower)) return ruleMap.get(lower)

  const entries = Array.from(ruleMap.entries())
  for (let i = 0; i < entries.length; i++) {
    const [pat, rule] = entries[i]
    if (lower === pat || lower.includes(pat) || pat.includes(lower)) {
      return rule
    }
  }
  return undefined
}


export async function GET(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)
    let tenantId = searchParams.get('tenantId') || session.tenantId
    if (!tenantId) {
      const { data: defaultTenant } = await supabase.from('tenants').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle()
      tenantId = defaultTenant?.id || null
    }

    if (!tenantId) {
      return NextResponse.json({ success: true, unreviewed: [], reviewed: [], topUsed: [], stats: { totalSeconds: 0, productiveSeconds: 0, neutralSeconds: 0, unproductiveSeconds: 0 } })
    }

    const query = (searchParams.get('q') || '').toLowerCase().trim()
    const userId = searchParams.get('userId') // optional employee filter

    // 1. Fetch Organization-wide Productivity Rules
    let rulesQuery = supabase
      .from('productivity_rules')
      .select('id, pattern, classification, match_type, priority')

    if (!session.isSuperAdmin) {
      rulesQuery = rulesQuery.eq('tenant_id', tenantId)
    }

    const { data: initialRules, error: rulesErr } = await rulesQuery
    if (rulesErr) {
      console.error('Error fetching productivity_rules:', rulesErr)
    }

    let rules = initialRules || []

    // 2. Fetch Employee-specific overrides from platform_settings
    const { data: userRulesData } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', `user_productivity_${tenantId}`)
      .maybeSingle()

    const userOverrides = (userRulesData?.value as Record<string, Record<string, string>>) || {}
    const targetEmployeeOverrides = (userId && userId !== 'ALL') ? (userOverrides[userId] || {}) : {}

    // Build Rule Map
    const ruleMap = new Map<string, { classification: string; isUserSpecific: boolean; ruleId?: string }>()

    // Always seed baseline default rules first
    DEFAULT_PRODUCTIVITY_SEEDS.forEach((s) => {
      ruleMap.set(s.pattern.toLowerCase(), {
        classification: s.classification,
        isUserSpecific: false,
        ruleId: `default-${s.pattern.toLowerCase()}`,
      })
    })

    // If tenant has no custom rules in database, asynchronously persist default seeds
    if (rules.length === 0 && tenantId) {
      void (async () => {
        try {
          await supabase
            .from('productivity_rules')
            .insert(DEFAULT_PRODUCTIVITY_SEEDS.map((s) => ({ ...s, tenant_id: tenantId })))
        } catch {
          // ignore seed errors
        }
      })()
    }

    // Company/Tenant DB rules take priority over defaults
    rules.forEach((r) => {
      ruleMap.set(r.pattern.toLowerCase(), {
        classification: r.classification,
        isUserSpecific: false,
        ruleId: r.id,
      })
    })

    // If specific employee selected, overlay user-specific overrides
    if (userId && userId !== 'ALL') {
      Object.entries(targetEmployeeOverrides).forEach(([patternKey, classification]) => {
        ruleMap.set(patternKey.toLowerCase(), {
          classification,
          isUserSpecific: true,
          ruleId: `user-override-${patternKey.toLowerCase()}`,
        })
      })
    }

    // 3. Fetch activity events strictly for this tenant, optionally filtered by employee
    let eventsQuery = supabase
      .from('activity_events')
      .select('user_id, app_name, domain, started_at, ended_at, classification')
      .order('started_at', { ascending: false })
      .limit(25000)

    if (!session.isSuperAdmin) {
      eventsQuery = eventsQuery.eq('tenant_id', tenantId)
    }

    if (userId && userId !== 'ALL') {
      eventsQuery = eventsQuery.eq('user_id', userId)
    }

    // Fetch tenant employees for user lookup and attribution
    let usersQuery = supabase
      .from('users')
      .select('id, full_name, email')
    if (!session.isSuperAdmin) {
      usersQuery = usersQuery.eq('tenant_id', tenantId)
    }

    const [{ data: events }, { data: tenantUsers }] = await Promise.all([
      eventsQuery,
      usersQuery,
    ])
    const userMap = new Map((tenantUsers || []).map((u) => [u.id, u.full_name || u.email?.split('@')[0] || 'Employee']))

    // Aggregate app usage counts and total duration in seconds
    const appStatsMap = new Map<string, { count: number; totalSeconds: number; type: 'APP' | 'DOMAIN'; users: Set<string> }>()

    ;(events || []).forEach((ev) => {
      const name = ev.domain || ev.app_name
      if (!name || isSystemLockOrIdle(name)) return
      const isDomain = !!ev.domain || name.includes('.')
      const key = name.toLowerCase()

      const dur = Math.max(
        1,
        Math.round((new Date(ev.ended_at).getTime() - new Date(ev.started_at).getTime()) / 1000)
      )

      const existing = appStatsMap.get(key) || {
        count: 0,
        totalSeconds: 0,
        type: isDomain ? 'DOMAIN' : 'APP',
        users: new Set<string>(),
      }
      existing.count += 1
      existing.totalSeconds += dur
      if (ev.user_id) {
        const uName = userMap.get(ev.user_id)
        if (uName) existing.users.add(uName)
      }
      appStatsMap.set(key, existing)
    })

    // Combine distinct apps from real events and active productivity rules
    const allKnownApps = new Map<string, { name: string; type: 'APP' | 'DOMAIN'; totalSeconds: number; count: number; usedBy: string[] }>()

    // 1. Add from real activity events
    ;(events || []).forEach((ev) => {
      const rawName = ev.domain || ev.app_name
      if (!rawName || isSystemLockOrIdle(rawName)) return
      const key = rawName.toLowerCase()
      if (!allKnownApps.has(key)) {
        const stats = appStatsMap.get(key) || { count: 1, totalSeconds: 60, type: rawName.includes('.') ? 'DOMAIN' : 'APP', users: new Set<string>() }
        allKnownApps.set(key, {
          name: rawName,
          type: stats.type,
          totalSeconds: stats.totalSeconds,
          count: stats.count,
          usedBy: Array.from(stats.users),
        })
      }
    })

    // 2. Add any active productivity rules that may not have current events logged
    rules.forEach((r) => {
      const key = r.pattern.toLowerCase()
      if (!allKnownApps.has(key)) {
        allKnownApps.set(key, {
          name: r.pattern,
          type: (r.match_type as 'APP' | 'DOMAIN') || (r.pattern.includes('.') ? 'DOMAIN' : 'APP'),
          totalSeconds: 0,
          count: 0,
          usedBy: [],
        })
      }
    })

    // 3. Add any employee-specific override patterns
    Object.keys(targetEmployeeOverrides).forEach((patternKey) => {
      const key = patternKey.toLowerCase()
      if (!allKnownApps.has(key)) {
        allKnownApps.set(key, {
          name: patternKey,
          type: patternKey.includes('.') ? 'DOMAIN' : 'APP',
          totalSeconds: 0,
          count: 0,
          usedBy: [],
        })
      }
    })

    // 4. Separate into Unreviewed and Reviewed
    const unreviewed: Array<{
      id: string
      name: string
      type: 'APP' | 'DOMAIN'
      usageCount: number
      totalSeconds: number
      usedBy: string[]
    }> = []

    const reviewed: Array<{
      id: string
      ruleId?: string
      name: string
      type: 'APP' | 'DOMAIN'
      classification: 'PRODUCTIVE' | 'NEUTRAL' | 'UNPRODUCTIVE'
      usageCount: number
      totalSeconds: number
      usedBy: string[]
      isUserSpecific?: boolean
    }> = []

    allKnownApps.forEach((item, key) => {
      if (query && !item.name.toLowerCase().includes(query)) return

      const rule = findMatchingRule(item.name, ruleMap)
      if (rule) {
        reviewed.push({
          id: `rev-${key}`,
          ruleId: rule.ruleId,
          name: item.name,
          type: item.type,
          classification: rule.classification as 'PRODUCTIVE' | 'NEUTRAL' | 'UNPRODUCTIVE',
          usageCount: item.count,
          totalSeconds: item.totalSeconds,
          usedBy: item.usedBy,
          isUserSpecific: !!rule.isUserSpecific,
        })
      } else {
        unreviewed.push({
          id: `unrev-${key}`,
          name: item.name,
          type: item.type,
          usageCount: item.count,
          totalSeconds: item.totalSeconds,
          usedBy: item.usedBy,
        })
      }
    })

    // 5. Top Used Apps list
    const topUsed = Array.from(allKnownApps.values())
      .sort((a, b) => b.totalSeconds - a.totalSeconds || b.count - a.count)
      .slice(0, 20)
      .map((item) => {
        const rule = findMatchingRule(item.name, ruleMap)
        return {
          name: item.name,
          type: item.type,
          totalSeconds: item.totalSeconds,
          count: item.count,
          classification: rule ? rule.classification : 'UNREVIEWED',
        }
      })

    // 6. Idle Excluded Apps
    const { data: idleExclusionData } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', `idle_exclusions_${tenantId}`)
      .maybeSingle()

    const idleExcluded: string[] = idleExclusionData?.value?.apps || [
      'Zoom',
      'Google Meet',
      'Slack Huddle',
      'Microsoft Teams',
      'VLC media player',
      'QuickTime Player',
    ]

    return NextResponse.json({
      success: true,
      totalUnreviewed: unreviewed.length,
      totalReviewed: reviewed.length,
      unreviewed,
      reviewed,
      topUsed,
      idleExcluded,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('GET /api/admin/apps/review error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST: Classify an app (Organization-wide or Employee Specific)
export async function POST(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const supabase = createAdminClient()
    let tenantId = body.tenantId || session.tenantId
    if (!tenantId && session.isSuperAdmin) {
      const { data: defaultTenant } = await supabase.from('tenants').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle()
      tenantId = defaultTenant?.id || null
    }

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 })
    }

    const { action, pattern, classification, matchType, appName, excluded, userId } = body

    // Action 1: Toggle Idle Exclusion
    if (action === 'toggle_idle_exclusion' && appName) {
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', `idle_exclusions_${tenantId}`)
        .maybeSingle()

      let list: string[] = existing?.value?.apps || [
        'Zoom',
        'Google Meet',
        'Slack Huddle',
        'Microsoft Teams',
        'VLC media player',
        'QuickTime Player',
      ]

      if (excluded) {
        if (!list.includes(appName)) list.push(appName)
      } else {
        list = list.filter((a) => a.toLowerCase() !== appName.toLowerCase())
      }

      await supabase.from('platform_settings').upsert({
        key: `idle_exclusions_${tenantId}`,
        value: { apps: list },
        updated_at: new Date().toISOString(),
      })

      return NextResponse.json({ success: true, idleExcluded: list })
    }

    // Action 2: Classify App
    if (!pattern || !classification) {
      return NextResponse.json(
        { success: false, error: 'pattern and classification are required' },
        { status: 400 }
      )
    }

    const type = matchType || (pattern.includes('.') ? 'DOMAIN' : 'APP')
    const targetUserId = userId && userId !== 'ALL' ? userId : null

    if (targetUserId) {
      // 1. Save to platform_settings under employee specific overrides
      const { data: existingSettings } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', `user_productivity_${tenantId}`)
        .maybeSingle()

      const userMap = (existingSettings?.value as Record<string, Record<string, string>>) || {}
      if (!userMap[targetUserId]) {
        userMap[targetUserId] = {}
      }
      userMap[targetUserId][pattern.toLowerCase()] = classification

      await supabase.from('platform_settings').upsert({
        key: `user_productivity_${tenantId}`,
        value: userMap,
        updated_at: new Date().toISOString(),
      })

      // 2. Retroactively update activity_events for this specific employee
      const trimmedPattern = pattern.trim()
      let updateAppQ = supabase
        .from('activity_events')
        .update({ classification })
        .eq('user_id', targetUserId)
        .ilike('app_name', `%${trimmedPattern}%`)

      let updateDomainQ = supabase
        .from('activity_events')
        .update({ classification })
        .eq('user_id', targetUserId)
        .ilike('domain', `%${trimmedPattern}%`)

      if (!session.isSuperAdmin) {
        updateAppQ = updateAppQ.eq('tenant_id', tenantId)
        updateDomainQ = updateDomainQ.eq('tenant_id', tenantId)
      }

      await Promise.allSettled([updateAppQ, updateDomainQ])

      return NextResponse.json({
        success: true,
        message: `App ${pattern} successfully classified as ${classification} for employee`,
        pattern,
        classification,
        isUserSpecific: true,
      })
    } else {
      // Organization-wide classification in productivity_rules table
      let ruleLookup = supabase
        .from('productivity_rules')
        .select('id')
        .ilike('pattern', pattern)

      if (!session.isSuperAdmin) {
        ruleLookup = ruleLookup.eq('tenant_id', tenantId)
      }

      const { data: existingRule } = await ruleLookup.maybeSingle()

      let ruleId: string
      if (existingRule?.id) {
        const { data: updated, error } = await supabase
          .from('productivity_rules')
          .update({
            classification,
            match_type: type,
          })
          .eq('id', existingRule.id)
          .select('id')
          .single()

        if (error) throw error
        ruleId = updated.id
      } else {
        const { data: inserted, error } = await supabase
          .from('productivity_rules')
          .insert({
            tenant_id: tenantId,
            pattern,
            classification,
            match_type: type,
            priority: 1,
          })
          .select('id')
          .single()

        if (error) throw error
        ruleId = inserted.id
      }

      // Retroactively update activity_events for all employees in this tenant
      const trimmedPattern = pattern.trim()
      let updateAppQ = supabase
        .from('activity_events')
        .update({ classification })
        .ilike('app_name', `%${trimmedPattern}%`)

      let updateDomainQ = supabase
        .from('activity_events')
        .update({ classification })
        .ilike('domain', `%${trimmedPattern}%`)

      if (!session.isSuperAdmin) {
        updateAppQ = updateAppQ.eq('tenant_id', tenantId)
        updateDomainQ = updateDomainQ.eq('tenant_id', tenantId)
      }

      await Promise.allSettled([updateAppQ, updateDomainQ])

      return NextResponse.json({
        success: true,
        message: `App ${pattern} successfully classified as ${classification} (Organization-wide)`,
        ruleId,
        pattern,
        classification,
        isUserSpecific: false,
      })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('POST /api/admin/apps/review error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE: Remove classification rule
export async function DELETE(req: Request) {
  try {
    const session = await getSessionContext()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)
    let tenantId = searchParams.get('tenantId') || session.tenantId
    if (!tenantId && session.isSuperAdmin) {
      const { data: defaultTenant } = await supabase.from('tenants').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle()
      tenantId = defaultTenant?.id || null
    }

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 })
    }

    const deleteAll = searchParams.get('deleteAll') === 'true'
    let ruleId = searchParams.get('id')
    let pattern = searchParams.get('pattern')
    let userId = searchParams.get('userId')

    if (!ruleId && !pattern && !deleteAll) {
      try {
        const body = await req.json()
        ruleId = body.id || body.ruleId
        pattern = body.pattern
        if (body.deleteAll) {
          // deleteAll from body
        }
        if (body.userId) userId = body.userId
      } catch {
        // no body
      }
    }

    const targetUserId = userId && userId !== 'ALL' ? userId : null

    // If deleteAll is true: clear all reviewed rules for this tenant
    if (deleteAll || (ruleId === 'ALL')) {
      if (targetUserId) {
        // Clear all user overrides for target employee
        const { data: existingSettings } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', `user_productivity_${tenantId}`)
          .maybeSingle()

        const userMap = (existingSettings?.value as Record<string, Record<string, string>>) || {}
        if (userMap[targetUserId]) {
          delete userMap[targetUserId]
          await supabase.from('platform_settings').upsert({
            key: `user_productivity_${tenantId}`,
            value: userMap,
            updated_at: new Date().toISOString(),
          })
        }
      } else {
        // Clear all productivity_rules for this tenant
        let deleteRulesQuery = supabase.from('productivity_rules').delete()
        if (!session.isSuperAdmin) {
          deleteRulesQuery = deleteRulesQuery.eq('tenant_id', tenantId)
        } else {
          deleteRulesQuery = deleteRulesQuery.eq('tenant_id', tenantId)
        }
        await deleteRulesQuery

        // Also clear tenant-wide user productivity settings
        await supabase
          .from('platform_settings')
          .delete()
          .eq('key', `user_productivity_${tenantId}`)

        // Reset tenant's activity_events classification back to NEUTRAL
        let resetEventsQuery = supabase
          .from('activity_events')
          .update({ classification: 'NEUTRAL' })

        if (!session.isSuperAdmin) {
          resetEventsQuery = resetEventsQuery.eq('tenant_id', tenantId)
        } else {
          resetEventsQuery = resetEventsQuery.eq('tenant_id', tenantId)
        }
        await resetEventsQuery
      }

      return NextResponse.json({
        success: true,
        message: 'All reviewed app classifications deleted successfully. Apps returned to unreviewed status.',
      })
    }

    if (targetUserId && pattern) {
      // Remove from platform_settings
      const { data: existingSettings } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', `user_productivity_${tenantId}`)
        .maybeSingle()

      const userMap = (existingSettings?.value as Record<string, Record<string, string>>) || {}
      if (userMap[targetUserId] && userMap[targetUserId][pattern.toLowerCase()]) {
        delete userMap[targetUserId][pattern.toLowerCase()]
        await supabase.from('platform_settings').upsert({
          key: `user_productivity_${tenantId}`,
          value: userMap,
          updated_at: new Date().toISOString(),
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Employee specific rule removed.',
      })
    }

    if (ruleId && !ruleId.startsWith('user-override-')) {
      let deleteQuery = supabase.from('productivity_rules').delete().eq('id', ruleId)
      if (!session.isSuperAdmin) {
        deleteQuery = deleteQuery.eq('tenant_id', tenantId)
      }
      const { error } = await deleteQuery
      if (error) throw error
    } else if (pattern) {
      let deleteQuery = supabase
        .from('productivity_rules')
        .delete()
        .ilike('pattern', pattern)
      if (!session.isSuperAdmin) {
        deleteQuery = deleteQuery.eq('tenant_id', tenantId)
      }
      const { error } = await deleteQuery
      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Rule removed. App returned to unreviewed status.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('DELETE /api/admin/apps/review error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
