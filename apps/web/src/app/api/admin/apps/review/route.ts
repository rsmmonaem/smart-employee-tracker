import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

const DEFAULT_TENANT_ID = '7d91b2a1-c727-4f50-83ec-4fdb9debebd3'

// Pre-seeded standard apps and domains to guarantee a rich initial directory matching Workfolio screenshot
const SEED_APPS = [
  { name: 'Antigravity', type: 'APP', defaultClassification: 'PRODUCTIVE' },
  { name: 'Visual Studio Code', type: 'APP', defaultClassification: 'PRODUCTIVE' },
  { name: 'Google Chrome', type: 'APP', defaultClassification: 'NEUTRAL' },
  { name: 'TimeGuard', type: 'APP', defaultClassification: 'PRODUCTIVE' },
  { name: 'Slack', type: 'APP', defaultClassification: 'PRODUCTIVE' },
  { name: 'Figma', type: 'APP', defaultClassification: 'PRODUCTIVE' },
  { name: 'YouTube', type: 'DOMAIN', defaultClassification: 'UNPRODUCTIVE' },
  { name: 'admin.truckpointbd.com', type: 'DOMAIN', defaultClassification: 'PRODUCTIVE' },
  { name: 'admin.wajobab.chat', type: 'DOMAIN', defaultClassification: 'PRODUCTIVE' },
  { name: 'agnes.jobab.chat', type: 'DOMAIN', defaultClassification: 'PRODUCTIVE' },
  { name: 'aichat-backend.npms.pro', type: 'DOMAIN', defaultClassification: 'PRODUCTIVE' },
  { name: 'aichatbot-frontend-six.vercel.app', type: 'DOMAIN', defaultClassification: 'PRODUCTIVE' },
  { name: 'android-studio-quail3-patch1-windows', type: 'APP', defaultClassification: 'PRODUCTIVE' },
  { name: 'accounts.google.com', type: 'DOMAIN', defaultClassification: null },
  { name: '0.0.0.1', type: 'DOMAIN', defaultClassification: null },
  { name: '0.0.0.10', type: 'DOMAIN', defaultClassification: null },
  { name: '0.0.1.44', type: 'DOMAIN', defaultClassification: null },
  { name: '10.10.10.160', type: 'DOMAIN', defaultClassification: null },
  { name: '127.0.0.1', type: 'DOMAIN', defaultClassification: null },
  { name: '7zG', type: 'APP', defaultClassification: null },
  { name: 'Notion', type: 'APP', defaultClassification: 'PRODUCTIVE' },
  { name: 'Zoom', type: 'APP', defaultClassification: 'PRODUCTIVE' },
]

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = (searchParams.get('q') || '').toLowerCase().trim()
    const supabase = createAdminClient()

    // 1. Fetch current productivity rules
    const { data: initialRules, error: rulesErr } = await supabase
      .from('productivity_rules')
      .select('*')
      .eq('tenant_id', DEFAULT_TENANT_ID)

    if (rulesErr) {
      console.error('Error fetching productivity_rules:', rulesErr)
    }

    let rules = initialRules

    // Auto-seed initial reviewed rules if table is empty
    if (!rules || rules.length === 0) {
      const initialInserts = SEED_APPS.filter((a) => a.defaultClassification !== null).map((a) => ({
        tenant_id: DEFAULT_TENANT_ID,
        match_type: a.type,
        pattern: a.name,
        classification: a.defaultClassification,
        priority: 1,
      }))

      const { data: seeded } = await supabase
        .from('productivity_rules')
        .insert(initialInserts)
        .select('*')

      if (seeded) {
        rules = seeded
      }
    }

    const ruleMap = new Map((rules || []).map((r) => [r.pattern.toLowerCase(), r]))

    // 2. Fetch all activity events to discover recorded apps
    const { data: events } = await supabase
      .from('activity_events')
      .select('app_name, domain, started_at, ended_at')

    // Aggregate app usage counts and total duration in seconds
    const appStatsMap = new Map<string, { count: number; totalSeconds: number; type: 'APP' | 'DOMAIN' }>()

    ;(events || []).forEach((ev) => {
      const name = ev.domain || ev.app_name
      if (!name || name === 'Untracked Activity') return
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
      }
      existing.count += 1
      existing.totalSeconds += dur
      appStatsMap.set(key, existing)
    })

    // Combine distinct apps from SEED_APPS and real activity_events
    const allKnownApps = new Map<string, { name: string; type: 'APP' | 'DOMAIN'; totalSeconds: number; count: number }>()

    SEED_APPS.forEach((sa) => {
      const stats = appStatsMap.get(sa.name.toLowerCase()) || { count: 0, totalSeconds: 0, type: sa.type as 'APP' | 'DOMAIN' }
      allKnownApps.set(sa.name.toLowerCase(), {
        name: sa.name,
        type: sa.type as 'APP' | 'DOMAIN',
        totalSeconds: stats.totalSeconds,
        count: stats.count,
      })
    })

    // Add remaining real events apps
    ;(events || []).forEach((ev) => {
      const rawName = ev.domain || ev.app_name
      if (!rawName || rawName === 'Untracked Activity') return
      const key = rawName.toLowerCase()
      if (!allKnownApps.has(key)) {
        const stats = appStatsMap.get(key) || { count: 1, totalSeconds: 60, type: 'APP' }
        allKnownApps.set(key, {
          name: rawName,
          type: stats.type,
          totalSeconds: stats.totalSeconds,
          count: stats.count,
        })
      }
    })

    // 3. Separate into Unreviewed and Reviewed
    const unreviewed: Array<{
      id: string
      name: string
      type: 'APP' | 'DOMAIN'
      usageCount: number
      totalSeconds: number
    }> = []

    const reviewed: Array<{
      id: string
      ruleId: string
      name: string
      type: 'APP' | 'DOMAIN'
      classification: 'PRODUCTIVE' | 'NEUTRAL' | 'UNPRODUCTIVE'
      usageCount: number
      totalSeconds: number
    }> = []

    allKnownApps.forEach((item, key) => {
      if (query && !item.name.toLowerCase().includes(query)) return

      const rule = ruleMap.get(key)
      if (rule) {
        reviewed.push({
          id: `rev-${key}`,
          ruleId: rule.id,
          name: item.name,
          type: item.type,
          classification: rule.classification,
          usageCount: item.count,
          totalSeconds: item.totalSeconds,
        })
      } else {
        unreviewed.push({
          id: `unrev-${key}`,
          name: item.name,
          type: item.type,
          usageCount: item.count,
          totalSeconds: item.totalSeconds,
        })
      }
    })

    // 4. Top Used Apps list
    const topUsed = Array.from(allKnownApps.values())
      .sort((a, b) => b.totalSeconds - a.totalSeconds || b.count - a.count)
      .slice(0, 20)
      .map((item) => {
        const rule = ruleMap.get(item.name.toLowerCase())
        return {
          name: item.name,
          type: item.type,
          totalSeconds: item.totalSeconds,
          count: item.count,
          classification: rule ? rule.classification : 'UNREVIEWED',
        }
      })

    // 5. Idle Excluded Apps (e.g. video conferencing, media)
    const { data: idleExclusionData } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', `idle_exclusions_${DEFAULT_TENANT_ID}`)
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

// POST: Classify an app, update rule, or toggle idle exclusion
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, pattern, classification, matchType, appName, excluded } = body
    const supabase = createAdminClient()

    // Action 1: Toggle Idle Exclusion
    if (action === 'toggle_idle_exclusion' && appName) {
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', `idle_exclusions_${DEFAULT_TENANT_ID}`)
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
        key: `idle_exclusions_${DEFAULT_TENANT_ID}`,
        value: { apps: list },
        updated_at: new Date().toISOString(),
      })

      return NextResponse.json({ success: true, idleExcluded: list })
    }

    // Action 2: Classify / Review App
    if (!pattern || !classification) {
      return NextResponse.json(
        { success: false, error: 'pattern and classification are required' },
        { status: 400 }
      )
    }

    const type = matchType || (pattern.includes('.') ? 'DOMAIN' : 'APP')

    // 1. Check if rule exists
    const { data: existingRule } = await supabase
      .from('productivity_rules')
      .select('id')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .ilike('pattern', pattern)
      .maybeSingle()

    let ruleId: string

    if (existingRule?.id) {
      const { data: updated, error } = await supabase
        .from('productivity_rules')
        .update({
          classification,
          match_type: type,
        })
        .eq('id', existingRule.id)
        .select('*')
        .single()

      if (error) throw error
      ruleId = updated.id
    } else {
      const { data: inserted, error } = await supabase
        .from('productivity_rules')
        .insert({
          tenant_id: DEFAULT_TENANT_ID,
          pattern,
          classification,
          match_type: type,
          priority: 1,
        })
        .select('*')
        .single()

      if (error) throw error
      ruleId = inserted.id
    }

    // 2. Retroactively update activity_events for this pattern
    await supabase
      .from('activity_events')
      .update({ classification })
      .or(`app_name.ilike.${pattern},domain.ilike.${pattern}`)

    return NextResponse.json({
      success: true,
      message: `App ${pattern} successfully classified as ${classification}`,
      ruleId,
      pattern,
      classification,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('POST /api/admin/apps/review error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE: Remove classification rule, moving app back to unreviewed
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let ruleId = searchParams.get('id')
    let pattern = searchParams.get('pattern')

    if (!ruleId && !pattern) {
      try {
        const body = await req.json()
        ruleId = body.id || body.ruleId
        pattern = body.pattern
      } catch {
        // no body
      }
    }

    const supabase = createAdminClient()

    if (ruleId) {
      const { error } = await supabase.from('productivity_rules').delete().eq('id', ruleId)
      if (error) throw error
    } else if (pattern) {
      const { error } = await supabase
        .from('productivity_rules')
        .delete()
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .ilike('pattern', pattern)
      if (error) throw error
    } else {
      return NextResponse.json(
        { success: false, error: 'ruleId or pattern is required' },
        { status: 400 }
      )
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
