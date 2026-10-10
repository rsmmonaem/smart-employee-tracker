import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Play, Square, LogOut, Activity, Camera, RefreshCw, CheckCircle2, AlertCircle, Sliders, Zap, Download, Clock, Coffee, Bell, Power } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { type as getOsType, arch as getArch } from '@tauri-apps/plugin-os';
import { open as openUrl } from '@tauri-apps/plugin-shell';

const nativeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET');
    const headers: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => {
          headers[k] = v;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([k, v]) => {
          headers[k] = v;
        });
      } else {
        Object.assign(headers, init.headers);
      }
    }

    let bodyBytes: number[] | undefined = undefined;
    if (init?.body) {
      if (typeof init.body === 'string') {
        const encoder = new TextEncoder();
        bodyBytes = Array.from(encoder.encode(init.body));
      } else if (init.body instanceof ArrayBuffer) {
        bodyBytes = Array.from(new Uint8Array(init.body));
      } else if (ArrayBuffer.isView(init.body)) {
        bodyBytes = Array.from(new Uint8Array(init.body.buffer, init.body.byteOffset, init.body.byteLength));
      } else {
        const text = await new Response(init.body).text();
        const encoder = new TextEncoder();
        bodyBytes = Array.from(encoder.encode(text));
      }
    }

    const res: any = await invoke('native_request', {
      url,
      method,
      headers,
      body: bodyBytes,
    });

    let bodyData: BodyInit = '';
    if (res.body_text !== null && res.body_text !== undefined) {
      bodyData = res.body_text;
    } else if (res.body_base64) {
      const binStr = atob(res.body_base64);
      const u8 = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) {
        u8[i] = binStr.charCodeAt(i);
      }
      bodyData = u8;
    }

    return new Response(bodyData, {
      status: res.status,
      statusText: res.status_text || undefined,
      headers: res.headers,
    });
  } catch (err) {
    console.warn('Native fetch fallback to browser fetch:', err);
    return window.fetch(input, init);
  }
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://supabase.tracmatrix.com',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkxMjY2NjM2LCJleHAiOjE5NDg5NDY2MzZ9.43d4cm4IVkAuFX03AaAGR3y4fpCeRs9b_RfX-8MIZTs',
  {
    global: {
      fetch: nativeFetch,
    },
  }
);

interface TrackingPolicy {
  enableScreenCapture: boolean;
  blurScreenCapture: boolean;
  screenshotIntervalStr: string;
  screenshotIntervalMs: number;
  idleTimeoutStr: string;
  lastSyncedAt: string | null;
  expectedClockIn?: string; // e.g. "09:00" or "10:00 AM"
}

interface ProductivityRule {
  pattern: string;
  classification: 'PRODUCTIVE' | 'NEUTRAL' | 'UNPRODUCTIVE';
  match_type: string;
}

function parseIntervalToMs(intervalStr?: string): number {
  if (!intervalStr) return 60000;
  if (intervalStr.includes('1 min')) return 1 * 60 * 1000; // 60s
  if (intervalStr.includes('2 mins')) return 2 * 60 * 1000; // 120s
  if (intervalStr.includes('3 mins')) return 3 * 60 * 1000;
  if (intervalStr.includes('5 mins')) return 5 * 60 * 1000;
  if (intervalStr.includes('10 mins')) return 10 * 60 * 1000;
  if (intervalStr.includes('15 mins')) return 15 * 60 * 1000;
  if (intervalStr.includes('30 mins')) return 30 * 60 * 1000;
  if (intervalStr.includes('60 mins')) return 60 * 60 * 1000;
  return 60000;
}

function parseIdleTimeoutToSeconds(idleStr?: string): number {
  if (!idleStr) return 60;
  if (idleStr.includes('1 min')) return 60;
  if (idleStr.includes('2 min')) return 120;
  if (idleStr.includes('3 min')) return 180;
  if (idleStr.includes('5 min')) return 300;
  if (idleStr.includes('10 min')) return 600;
  if (idleStr.includes('15 min')) return 900;
  if (idleStr.includes('30 min')) return 1800;
  return 60;
}

// 🌐 Extract Web Domain from Browser Window Title or Direct URL
function extractBrowserDomain(appName: string, windowTitle?: string): string | null {
  if (!appName) return null;
  const isBrowser = /chrome|brave|firefox|edge|safari|opera|arc|browser|vivaldi/i.test(appName);
  if (!isBrowser || !windowTitle) return null;

  // Clean browser title suffix (e.g. ' - Google Chrome', ' - Brave')
  const clean = windowTitle
    .replace(/\s*-\s*(Google Chrome|Google Chrome Beta|Brave Browser|Brave|Mozilla Firefox|Firefox|Microsoft Edge|Edge|Safari|Opera|Arc|Vivaldi)$/i, '')
    .trim();

  // 1. Direct FQDN / domain match (e.g., 'admin.truckpointbd.com', 'trackmatrix.com', 'app.tracmatrix.com/admin')
  const fqdnRegex = /(?:https?:\/\/)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.(?:com|org|net|co|io|app|dev|chat|edu|gov|xyz|me|info|ai|tv|bd|pk|in|so|tech|cloud|site|online|pro)(?:\.[a-zA-Z]{2,3})?)/i;
  const fqdnMatch = clean.match(fqdnRegex);
  if (fqdnMatch) {
    const rawDomain = fqdnMatch[1].toLowerCase().replace(/^www\./, '');
    if (rawDomain && !rawDomain.includes('newtab')) {
      return rawDomain;
    }
  }

  // 2. High-precision Web Platform & Service Signatures
  const webPlatforms: Array<{ pattern: RegExp; domain: string }> = [
    { pattern: /youtube/i, domain: 'youtube.com' },
    { pattern: /github|[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+|workflow runs|pull request|\bpr\b|commit|repo/i, domain: 'github.com' },
    { pattern: /gitlab/i, domain: 'gitlab.com' },
    { pattern: /bitbucket/i, domain: 'bitbucket.org' },
    { pattern: /google\s*meet|\bmeet\b/i, domain: 'meet.google.com' },
    { pattern: /gmail|google\s*mail/i, domain: 'mail.google.com' },
    { pattern: /google\s*docs/i, domain: 'docs.google.com' },
    { pattern: /google\s*sheets/i, domain: 'sheets.google.com' },
    { pattern: /google\s*slides/i, domain: 'slides.google.com' },
    { pattern: /google\s*drive/i, domain: 'drive.google.com' },
    { pattern: /facebook/i, domain: 'facebook.com' },
    { pattern: /instagram/i, domain: 'instagram.com' },
    { pattern: /twitter|\bx\s*corp|\bx\.com/i, domain: 'x.com' },
    { pattern: /linkedin/i, domain: 'linkedin.com' },
    { pattern: /chatgpt|openai/i, domain: 'chatgpt.com' },
    { pattern: /claude|anthropic/i, domain: 'claude.ai' },
    { pattern: /gemini/i, domain: 'gemini.google.com' },
    { pattern: /stack\s*overflow/i, domain: 'stackoverflow.com' },
    { pattern: /notion/i, domain: 'notion.so' },
    { pattern: /figma/i, domain: 'figma.com' },
    { pattern: /canva/i, domain: 'canva.com' },
    { pattern: /whatsapp/i, domain: 'web.whatsapp.com' },
    { pattern: /telegram/i, domain: 'web.telegram.org' },
    { pattern: /slack/i, domain: 'app.slack.com' },
    { pattern: /discord/i, domain: 'discord.com' },
    { pattern: /trello/i, domain: 'trello.com' },
    { pattern: /jira|atlassian/i, domain: 'atlassian.net' },
    { pattern: /netflix/i, domain: 'netflix.com' },
    { pattern: /spotify/i, domain: 'open.spotify.com' },
    { pattern: /reddit/i, domain: 'reddit.com' },
    { pattern: /tracmatrix|trackmatrix/i, domain: 'app.tracmatrix.com' },
    { pattern: /wikipedia/i, domain: 'wikipedia.org' },
    { pattern: /google\s*search|\bgoogle\b/i, domain: 'google.com' },
  ];

  for (const wp of webPlatforms) {
    if (wp.pattern.test(clean)) {
      return wp.domain;
    }
  }

  return null;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [tenantId, setTenantId] = useState<string>('7d91b2a1-c727-4f50-83ec-4fdb9debebd3');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [timer, setTimer] = useState(0);
  const [activeApp, setActiveApp] = useState('None');
  const [windowTitle, setWindowTitle] = useState('');
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);
  const [lastSyncStatus, setLastSyncStatus] = useState<string>('Ready to track');
  const [screenshotsCount, setScreenshotsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isSyncingPolicy, setIsSyncingPolicy] = useState(false);

  // Productivity Review Rules
  const [rules, setRules] = useState<ProductivityRule[]>([]);
  const rulesRef = useRef<ProductivityRule[]>([]);
  rulesRef.current = rules;

  const [appProductivity, setAppProductivity] = useState<{
    classification: 'PRODUCTIVE' | 'NEUTRAL' | 'UNPRODUCTIVE';
    isReviewed: boolean;
  }>({ classification: 'PRODUCTIVE', isReviewed: true });

  // Admin Tracking Policy state
  const [policy, setPolicy] = useState<TrackingPolicy>({
    enableScreenCapture: true,
    blurScreenCapture: false,
    screenshotIntervalStr: 'Every 10 mins',
    screenshotIntervalMs: 600000,
    idleTimeoutStr: '1 min',
    lastSyncedAt: null,
  });

  const policyRef = useRef(policy);
  policyRef.current = policy;

  const isTrackingRef = useRef(isTracking);
  isTrackingRef.current = isTracking;

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const tenantIdRef = useRef(tenantId);
  tenantIdRef.current = tenantId;

  const currentAttendanceSessionIdRef = useRef<string | null>(null);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isUserIdle, setIsUserIdle] = useState(false);
  const isUserIdleRef = useRef(false);
  isUserIdleRef.current = isUserIdle;

  // Interactive Idle Auto-Pause Modal state
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(60);
  const idlePromptActiveRef = useRef(false);

  // Auto-start on computer boot state
  const [isAutoStart, setIsAutoStart] = useState(true);

  // Auto-updater state
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatusText, setUpdateStatusText] = useState('');
  const [updateToastMessage, setUpdateToastMessage] = useState<string | null>(null);

  const getPlatformUpdateTarget = async () => {
    try {
      const osType = await getOsType();
      const osArch = await getArch();
      if (osType === 'windows') {
        return 'windows-x86_64';
      }
      if (osType === 'macos') {
        return osArch === 'x86_64' ? 'darwin-x86_64' : 'darwin-aarch64';
      }
      return 'windows-x86_64';
    } catch {
      return 'windows-x86_64';
    }
  };

  const checkForAppUpdates = async (silent = true) => {
    setIsCheckingUpdate(true);
    try {
      // 1. Try Tauri v2 native updater check
      let foundUpdate: any = null;
      try {
        const update = await check();
        if (update?.available) {
          foundUpdate = update;
        }
      } catch (nativeErr) {
        console.warn('Native check error, trying HTTP check:', nativeErr);
      }

      // 2. HTTP fallback check if native updater didn't find one
      if (!foundUpdate) {
        try {
          const target = await getPlatformUpdateTarget();
          const res = await fetch(`https://app.tracmatrix.com/api/agent/update/${target}/1.0.0`);
          if (res.status === 200) {
            const data = await res.json();
            if (data?.version && data.version !== '1.0.0') {
              foundUpdate = { available: true, version: data.version, url: data.url, notes: data.notes };
            }
          }
        } catch {
          // ignore
        }
      }

      if (foundUpdate) {
        setUpdateAvailable(foundUpdate);
        setUpdateToastMessage(`🎉 Update v${foundUpdate.version} is available!`);
      } else {
        if (!silent) {
          setUpdateToastMessage('✅ You are using the latest version (v1.0.0). No update needed.');
        }
      }
    } catch (err: any) {
      console.warn('Auto-updater check error:', err);
      if (!silent) {
        setUpdateToastMessage('✅ App is up to date.');
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  useEffect(() => {
    if (updateToastMessage) {
      const timer = setTimeout(() => setUpdateToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [updateToastMessage]);

  const handleInstallUpdate = async () => {
    if (!updateAvailable) return;
    try {
      setIsUpdating(true);
      setUpdateStatusText('Downloading update...');

      if (typeof updateAvailable.downloadAndInstall === 'function') {
        let downloaded = 0;
        let contentLength = 0;

        await updateAvailable.downloadAndInstall((event: any) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength || 0;
              setUpdateStatusText('Starting download...');
              break;
            case 'Progress':
              downloaded += event.data.chunkLength;
              if (contentLength > 0) {
                const pct = Math.round((downloaded / contentLength) * 100);
                setUpdateStatusText(`Downloading: ${pct}%`);
              } else {
                setUpdateStatusText(`Downloading...`);
              }
              break;
            case 'Finished':
              setUpdateStatusText('Installing & Restarting...');
              break;
          }
        });
      } else {
        // Fallback for standalone / direct download link
        const targetUrl = updateAvailable.url || 'https://app.tracmatrix.com/downloads/Smart-Employee-Tracker.exe';
        setUpdateStatusText('Opening download...');
        await openUrl(targetUrl);
        setUpdateToastMessage('Opening browser to download the latest installer.');
      }
    } catch (err: any) {
      console.error('Failed to install update directly, opening download link:', err);
      const targetUrl = updateAvailable.url || 'https://app.tracmatrix.com/downloads/Smart-Employee-Tracker.exe';
      try {
        await openUrl(targetUrl);
      } catch {
        window.open(targetUrl, '_blank');
      }
      setUpdateToastMessage('Update download link opened.');
    } finally {
      setIsUpdating(false);
    }
  };

  const applyPolicyFromValue = (val: any, userId?: string) => {
    if (!val) return;
    const override = userId ? val.memberOverrides?.[userId] : null;

    const enableCapture = override?.enableScreenCapture ?? val.enableScreenCapture ?? true;
    const blurCapture = override?.blurScreenCapture ?? val.blurScreenCapture ?? false;
    const intervalStr = override?.screenshotInterval ?? val.screenshotInterval ?? 'Every 1 min';
    const idleStr = override?.idleTimeout ?? val.idleTimeout ?? '1 min';
    const expectedClockIn = val.expectedClockIn ?? '09:00';

    const intervalMs = parseIntervalToMs(intervalStr);

    setPolicy({
      enableScreenCapture: enableCapture,
      blurScreenCapture: blurCapture,
      screenshotIntervalStr: intervalStr,
      screenshotIntervalMs: intervalMs,
      idleTimeoutStr: idleStr,
      lastSyncedAt: new Date().toLocaleTimeString(),
      expectedClockIn,
    });
    setLastSyncStatus(`⚡ Realtime: ${intervalStr} ${blurCapture ? '(Blur ON)' : ''}`);
  };

  const fetchTrackSettings = async (userId?: string) => {
    try {
      setIsSyncingPolicy(true);
      const { data: row } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'organization_track_settings')
        .maybeSingle();

      if (row?.value) {
        applyPolicyFromValue(row.value, userId);
      }
    } catch (e) {
      console.warn('Failed to fetch platform tracking policy:', e);
    } finally {
      setIsSyncingPolicy(false);
    }
  };

  // ⚡ Supabase Realtime WebSocket Event Listener (Sub-second Instant Sync)
  useEffect(() => {
    const channel = supabase
      .channel('realtime_platform_settings_listener')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platform_settings',
          filter: 'key=eq.organization_track_settings',
        },
        (payload) => {
          const newRecord = payload.new as any;
          if (newRecord?.value) {
            applyPolicyFromValue(newRecord.value, sessionRef.current?.user?.id);
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime subscription for Productivity Rules
  useEffect(() => {
    fetchProductivityRules();

    const rulesChannel = supabase
      .channel('agent_productivity_rules_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productivity_rules' },
        () => {
          fetchProductivityRules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rulesChannel);
    };
  }, []);

  const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const syncTodayTrackedTime = async (userId: string) => {
    const todayStr = getTodayKey();
    const storageKey = `smart_tracker_today_seconds_${userId}_${todayStr}`;

    // 1. Instantly restore from localStorage if available (with sanity cap)
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = parseInt(cached, 10);
        // Only load if valid and sane (< 12 hours)
        if (!isNaN(parsed) && parsed > 0 && parsed < 43200) {
          setTimer(parsed);
        }
      }
    } catch {
      // ignore
    }

    // 2. Fetch ground-truth sessions from Supabase for today
    try {
      const localNow = new Date();
      const startOfDay = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), 0, 0, 0, 0).toISOString();
      const endOfDay = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), 23, 59, 59, 999).toISOString();

      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select('id, clocked_in_at, clocked_out_at, status')
        .eq('user_id', userId)
        .gte('clocked_in_at', startOfDay)
        .lte('clocked_in_at', endOfDay)
        .order('clocked_in_at', { ascending: true });

      // Compute expectedClockIn threshold for today (in local date)
      const expectedClockInStr = policyRef.current.expectedClockIn || '10:00';
      const expectedClockInMs = (() => {
        try {
          const cleaned = expectedClockInStr.trim().toUpperCase();
          let hours = 10, minutes = 0;
          const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
          const h24Match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
          if (ampmMatch) {
            hours = parseInt(ampmMatch[1], 10);
            minutes = parseInt(ampmMatch[2], 10);
            if (ampmMatch[3] === 'PM' && hours !== 12) hours += 12;
            if (ampmMatch[3] === 'AM' && hours === 12) hours = 0;
          } else if (h24Match) {
            hours = parseInt(h24Match[1], 10);
            minutes = parseInt(h24Match[2], 10);
          }
          const today = new Date();
          const threshold = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0, 0);
          return threshold.getTime();
        } catch {
          return 0;
        }
      })();

      let totalSec = 0;
      let existingOpenSessionId: string | null = null;

      if (sessions && Array.isArray(sessions)) {
        // Find latest open session
        const openSessions = sessions.filter((s) => s.status === 'OPEN' && !s.clocked_out_at);
        const activeOpenSession = openSessions.length > 0 ? openSessions[openSessions.length - 1] : null;
        if (activeOpenSession) {
          existingOpenSessionId = activeOpenSession.id;
        }

        // Close any stale duplicate open sessions in background
        if (openSessions.length > 1 && existingOpenSessionId) {
          const staleIds = openSessions.filter((s) => s.id !== existingOpenSessionId).map((s) => s.id);
          supabase
            .from('attendance_sessions')
            .update({ status: 'CLOSED', clocked_out_at: new Date().toISOString() })
            .in('id', staleIds)
            .then(() => {});
        }

        const intervals: { start: number; end: number }[] = [];
        const now = Date.now();

        sessions.forEach((s) => {
          const rawStart = new Date(s.clocked_in_at).getTime();
          const effectiveStart = expectedClockInMs > 0 ? Math.max(rawStart, expectedClockInMs) : rawStart;

          let effectiveEnd = effectiveStart;
          if (s.clocked_out_at) {
            effectiveEnd = new Date(s.clocked_out_at).getTime();
          } else if (s.id === existingOpenSessionId) {
            effectiveEnd = now;
          }

          if (effectiveEnd > effectiveStart) {
            intervals.push({ start: effectiveStart, end: effectiveEnd });
          }
        });

        // Merge overlapping intervals so sessions NEVER double-count
        intervals.sort((a, b) => a.start - b.start);
        const merged: { start: number; end: number }[] = [];
        for (const int of intervals) {
          if (merged.length === 0) {
            merged.push({ ...int });
          } else {
            const last = merged[merged.length - 1];
            if (int.start <= last.end) {
              last.end = Math.max(last.end, int.end);
            } else {
              merged.push({ ...int });
            }
          }
        }

        for (const m of merged) {
          totalSec += Math.floor((m.end - m.start) / 1000);
        }
      }

      // Overwrite state and cache with actual calculated ground truth
      if (totalSec > 0) {
        setTimer(totalSec);
        try {
          localStorage.setItem(storageKey, String(totalSec));
        } catch {
          // ignore
        }
      }

      return { totalSec, existingOpenSessionId };
    } catch (err) {
      console.warn('Failed to sync today tracked time:', err);
      return { totalSec: 0, existingOpenSessionId: null };
    }
  };

  // Load session & track settings & Auto-start tracking on login
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchTrackSettings(session.user.id);
        const { existingOpenSessionId } = await syncTodayTrackedTime(session.user.id);

        if (existingOpenSessionId) {
          currentAttendanceSessionIdRef.current = existingOpenSessionId;
          setIsTracking(true);
          setLastSyncStatus('🚀 Resumed active tracking session');
        } else {
          const wasPaused = localStorage.getItem('smart_tracker_is_tracking_paused') === 'true';
          if (wasPaused) {
            setIsTracking(false);
            setLastSyncStatus('⏸️ Tracker paused. Click Start to resume');
          } else if (!isTrackingRef.current) {
            setIsTracking(true);
            // Close any existing open sessions first to guarantee ONE ACTIVE SESSION
            supabase
              .from('attendance_sessions')
              .update({ status: 'CLOSED', clocked_out_at: new Date().toISOString() })
              .eq('user_id', session.user.id)
              .eq('status', 'OPEN')
              .then(() => {
                supabase
                  .from('attendance_sessions')
                  .insert({
                    tenant_id: tenantIdRef.current || '7d91b2a1-c727-4f50-83ec-4fdb9debebd3',
                    user_id: session.user.id,
                    clocked_in_at: new Date().toISOString(),
                    status: 'OPEN',
                  })
                  .select('id')
                  .single()
                  .then(({ data, error }) => {
                    if (!error && data) {
                      currentAttendanceSessionIdRef.current = data.id;
                      setLastSyncStatus('🚀 Tracking Active: Working session recorded');
                    }
                  });
              });
          }
        }
      } else {
        fetchTrackSettings();
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchTrackSettings(session.user.id);
        const { existingOpenSessionId } = await syncTodayTrackedTime(session.user.id);

        if (existingOpenSessionId) {
          currentAttendanceSessionIdRef.current = existingOpenSessionId;
          setIsTracking(true);
          setLastSyncStatus('🚀 Resumed active tracking session');
        } else {
          const wasPaused = localStorage.getItem('smart_tracker_is_tracking_paused') === 'true';
          if (wasPaused) {
            setIsTracking(false);
            setLastSyncStatus('⏸️ Tracker paused. Click Start to resume');
          } else if (!isTrackingRef.current) {
            setIsTracking(true);
            // Close any existing open sessions first to guarantee ONE ACTIVE SESSION
            supabase
              .from('attendance_sessions')
              .update({ status: 'CLOSED', clocked_out_at: new Date().toISOString() })
              .eq('user_id', session.user.id)
              .eq('status', 'OPEN')
              .then(() => {
                supabase
                  .from('attendance_sessions')
                  .insert({
                    tenant_id: tenantIdRef.current || '7d91b2a1-c727-4f50-83ec-4fdb9debebd3',
                    user_id: session.user.id,
                    clocked_in_at: new Date().toISOString(),
                    status: 'OPEN',
                  })
                  .select('id')
                  .single()
                  .then(({ data, error }) => {
                    if (!error && data) {
                      currentAttendanceSessionIdRef.current = data.id;
                      setLastSyncStatus('🚀 Tracking Active: Working session recorded');
                    }
                  });
              });
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodic safety fallback poll (every 30s) & update check
  useEffect(() => {
    // Check for updates on startup
    checkForAppUpdates(true);

    // Check & ensure autostart on system boot
    invoke('is_auto_start_enabled')
      .then((enabled: any) => {
        if (typeof enabled === 'boolean') {
          setIsAutoStart(enabled);
          if (!enabled) {
            // Auto enable by default for employee convenience
            invoke('enable_auto_start', { enabled: true }).then(() => {
              setIsAutoStart(true);
            }).catch(() => {});
          }
        }
      })
      .catch(() => {});

    const policyInterval = setInterval(() => {
      fetchTrackSettings(sessionRef.current?.user?.id);
    }, 30000);

    const updateInterval = setInterval(() => {
      checkForAppUpdates(true);
    }, 1800000); // Check for updates every 30 mins

    return () => {
      clearInterval(policyInterval);
      clearInterval(updateInterval);
    };
  }, []);

  const toggleAutoStart = async () => {
    const nextVal = !isAutoStart;
    try {
      await invoke('enable_auto_start', { enabled: nextVal });
      setIsAutoStart(nextVal);
      setLastSyncStatus(nextVal ? '⚡ Auto-start on computer boot enabled' : '⚡ Auto-start disabled');
    } catch (e: any) {
      console.warn('Failed to update autostart setting:', e);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', userId)
        .single();
      if (!error && data?.tenant_id) {
        setTenantId(data.tenant_id);
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e);
    }
  };

  const fetchProductivityRules = async () => {
    try {
      const currentTenantId = tenantIdRef.current || '7d91b2a1-c727-4f50-83ec-4fdb9debebd3';
      const currentUserId = sessionRef.current?.user?.id;

      // 1. Fetch organization-wide global rules
      const { data: globalRules } = await supabase
        .from('productivity_rules')
        .select('pattern, classification, match_type');

      const ruleMap = new Map<string, ProductivityRule>();

      if (globalRules && Array.isArray(globalRules)) {
        globalRules.forEach((r: any) => {
          ruleMap.set(r.pattern.toLowerCase().trim(), {
            pattern: r.pattern,
            classification: r.classification,
            match_type: r.match_type,
          });
        });
      }

      // 2. Fetch employee-specific overrides from platform_settings
      const { data: userRulesData } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', `user_productivity_${currentTenantId}`)
        .maybeSingle();

      if (userRulesData?.value && currentUserId) {
        const userOverrides = (userRulesData.value as Record<string, Record<string, string>>)[currentUserId] || {};
        Object.entries(userOverrides).forEach(([patternKey, classification]) => {
          ruleMap.set(patternKey.toLowerCase().trim(), {
            pattern: patternKey,
            classification: classification as any,
            match_type: patternKey.includes('.') ? 'DOMAIN' : 'APP',
          });
        });
      }

      const mergedRules = Array.from(ruleMap.values());
      setRules(mergedRules);
      rulesRef.current = mergedRules;
    } catch (e) {
      console.warn('Failed to load productivity rules:', e);
    }
  };

  const getClassificationForApp = (
    appName: string,
    title?: string,
    domain?: string | null
  ): { classification: 'PRODUCTIVE' | 'NEUTRAL' | 'UNPRODUCTIVE'; isReviewed: boolean } => {
    const currentRules = rulesRef.current;
    const nApp = appName.toLowerCase().trim();
    const nTitle = (title || '').toLowerCase().trim();
    const nDomain = (domain || '').toLowerCase().trim();

    // 1. Highest Priority: Match exact web domain rule if active
    if (nDomain) {
      for (const r of currentRules) {
        const pat = r.pattern.toLowerCase().trim();
        if (nDomain === pat || nDomain.includes(pat) || pat.includes(nDomain)) {
          return { classification: r.classification, isReviewed: true };
        }
      }
    }

    // 2. Secondary: Match App Name or Title
    for (const r of currentRules) {
      const pat = r.pattern.toLowerCase().trim();
      if (nApp === pat || nApp.includes(pat) || nTitle.includes(pat)) {
        return { classification: r.classification, isReviewed: true };
      }
    }

    // Default unreviewed apps to NEUTRAL
    return { classification: 'NEUTRAL', isReviewed: false };
  };

  // Tracking Interval Engine
  useEffect(() => {
    let interval: any;
    if (isTracking) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const next = prev + 1;
          const currentUserId = sessionRef.current?.user?.id;
          if (currentUserId && next % 5 === 0) {
            const todayStr = getTodayKey();
            try {
              localStorage.setItem(`smart_tracker_today_seconds_${currentUserId}_${todayStr}`, String(next));
            } catch {
              // ignore
            }
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  // Window polling every 5 seconds
  useEffect(() => {
    let windowInterval: any;
    if (isTracking) {
      pollWindow();

      windowInterval = setInterval(() => {
        pollWindow();
      }, 5000);
    }
    return () => clearInterval(windowInterval);
  }, [isTracking]);

  // Dynamic screenshot capture interval respecting Admin Policy
  useEffect(() => {
    let screenshotInterval: any;
    if (isTracking && policy.enableScreenCapture) {
      // Immediate first screenshot after 2 seconds
      const initialTimer = setTimeout(() => {
        takeAndUploadScreenshot();
      }, 2000);

      const intervalMs = policy.screenshotIntervalMs || 30000;
      screenshotInterval = setInterval(() => {
        takeAndUploadScreenshot();
      }, intervalMs);

      return () => {
        clearTimeout(initialTimer);
        clearInterval(screenshotInterval);
      };
    }
  }, [isTracking, policy.enableScreenCapture, policy.screenshotIntervalMs]);


  const pollWindow = async () => {
    try {
      // 1. Check system idle time (keyboard/mouse inactivity)
      let systemIdleSeconds = 0;
      try {
        const idleSec: any = await invoke('get_system_idle_seconds');
        if (typeof idleSec === 'number') {
          systemIdleSeconds = idleSec;
        }
      } catch {
        // Fallback if platform does not support
      }

      const thresholdSeconds = parseIdleTimeoutToSeconds(policyRef.current.idleTimeoutStr);
      const isIdleNow = systemIdleSeconds >= thresholdSeconds;
      setIsUserIdle(isIdleNow);

      const currentSession = sessionRef.current;
      const currentTenantId = tenantIdRef.current;

      if (isIdleNow) {
        setActiveApp('Idle (Away)');
        setWindowTitle(`User away for ${Math.round(systemIdleSeconds)}s`);
        setAppProductivity({ classification: 'NEUTRAL', isReviewed: true });

        // Trigger interactive prompt if not already showing
        if (!idlePromptActiveRef.current) {
          idlePromptActiveRef.current = true;
          setShowIdlePrompt(true);
          setIdleCountdown(60);

          // 🔔 Bring minimized/background app to front immediately so employee notices!
          invoke('bring_to_front').catch(() => {});

          // Play subtle system alert sound
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
          } catch {
            // Audio context not available or user gesture blocked
          }
        }

        if (currentSession?.user?.id && currentTenantId) {
          const { error } = await supabase.from('activity_events').insert({
            tenant_id: currentTenantId,
            user_id: currentSession.user.id,
            app_name: 'Idle Time',
            window_title: `Idle / Inactive (${Math.round(systemIdleSeconds)}s)`,
            domain: null,
            started_at: new Date(Date.now() - 5000).toISOString(),
            ended_at: new Date().toISOString(),
            classification: 'NEUTRAL', // Marked as Idle Time in Timeline
          });

          if (!error) {
            setEventsCount((prev) => prev + 1);
            setLastSyncStatus(`💤 User Idle (${Math.round(systemIdleSeconds)}s)`);
          }
        }
        return;
      } else {
        // User has returned and is active with mouse/keyboard
        if (idlePromptActiveRef.current) {
          idlePromptActiveRef.current = false;
          setShowIdlePrompt(false);
          setIdleCountdown(60);
        }
      }

      // 2. Active Window Tracking
      let activeWin: any = null;
      try {
        activeWin = await invoke('get_focused_window');
      } catch (err) {
        console.warn('Window tracking poll invoke fallback:', err);
      }

      const app = (activeWin && activeWin.app_name) ? activeWin.app_name : 'Active Session';
      const title = (activeWin && activeWin.title) ? activeWin.title : 'Desktop / Working';
      setActiveApp(app);
      setWindowTitle(title);

      // 🌐 Extract active web domain if this is a browser
      const extractedDomain = extractBrowserDomain(app, title);

      const { classification, isReviewed } = getClassificationForApp(app, title, extractedDomain);
      setAppProductivity({ classification, isReviewed });

      if (currentSession?.user?.id && currentTenantId) {
        const { error } = await supabase.from('activity_events').insert({
          tenant_id: currentTenantId,
          user_id: currentSession.user.id,
          app_name: app,
          window_title: title,
          domain: extractedDomain || null,
          started_at: new Date(Date.now() - 5000).toISOString(),
          ended_at: new Date().toISOString(),
          classification,
        });

        if (!error) {
          setEventsCount((prev) => prev + 1);
          const label = extractedDomain ? `${extractedDomain} (${app})` : app;
          setLastSyncStatus(`Activity: ${label} [${classification}]`);
        } else {
          console.warn('Failed to insert activity_event:', error);
        }
      }
    } catch (e) {
      console.warn('Window tracking poll notice:', e);
    }
  };

  const takeAndUploadScreenshot = async () => {
    const currentSession = sessionRef.current;
    const currentTenantId = tenantIdRef.current;
    if (!currentSession?.user?.id || !currentTenantId) return;

    if (!policyRef.current.enableScreenCapture) {
      setLastSyncStatus('Screenshots paused by Admin policy');
      return;
    }

    if (isUserIdleRef.current) {
      setLastSyncStatus('💤 Idle: Screenshots paused while user is away');
      return;
    }

    try {
      setIsSnapping(true);
      let capturedScreens: Array<{
        screen_index: number;
        screen_name: string;
        is_primary?: boolean;
        base64_image: string;
      }> = [];

      try {
        const screensRes: any = await invoke('capture_all_screens');
        if (Array.isArray(screensRes) && screensRes.length > 0) {
          capturedScreens = screensRes;
        }
      } catch (multiErr) {
        // Fallback to single primary screen
        const singleBase64: string = await invoke('capture_screen');
        if (singleBase64) {
          capturedScreens = [{
            screen_index: 1,
            screen_name: 'Screen 1',
            is_primary: true,
            base64_image: singleBase64,
          }];
        }
      }

      if (capturedScreens.length === 0) {
        setIsSnapping(false);
        return;
      }

      // Preview the first / primary screen in desktop agent UI
      const primary = capturedScreens.find((s) => s.is_primary) || capturedScreens[0];
      setLastScreenshot(`data:image/jpeg;base64,${primary.base64_image}`);

      const timestamp = Date.now();
      let successCount = 0;

      for (const item of capturedScreens) {
        // Convert Base64 to binary buffer
        const byteChars = atob(item.base64_image);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        const screenSuffix = capturedScreens.length > 1 ? `_screen_${item.screen_index}` : '';
        const storagePath = `${currentTenantId}/${currentSession.user.id}/${timestamp}${screenSuffix}.jpg`;

        // 1. Upload to Supabase Storage
        const { error: storageErr } = await supabase.storage
          .from('screenshots')
          .upload(storagePath, byteArray.buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (storageErr) {
          console.error(`Storage upload failed for ${item.screen_name}:`, storageErr);
          continue;
        }

        // 2. Insert record in screenshots table
        const { error: dbErr } = await supabase.from('screenshots').insert({
          tenant_id: currentTenantId,
          user_id: currentSession.user.id,
          storage_path: storagePath,
          taken_at: new Date().toISOString(),
          is_blurred: policyRef.current.blurScreenCapture,
        });

        if (!dbErr) {
          successCount++;
        }
      }

      if (successCount > 0) {
        setScreenshotsCount((prev) => prev + successCount);
        setLastSyncStatus(
          capturedScreens.length > 1
            ? `${successCount} screens captured & synced!`
            : `Screenshot #${screenshotsCount + 1} synced!`
        );
      } else {
        setLastSyncStatus('Upload encountered an error');
      }
    } catch (e: any) {
      const errDetail = typeof e === 'string' ? e : (e?.message || JSON.stringify(e));
      console.error('Screenshot capture error:', errDetail);
      setLastSyncStatus(`Capture: ${errDetail}`);
    } finally {
      setIsSnapping(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    setLoading(false);
  };

  // Idle Modal Countdown & Auto-action Handler
  useEffect(() => {
    let interval: any = null;
    if (showIdlePrompt && idleCountdown > 0) {
      interval = setInterval(() => {
        setIdleCountdown((prev) => {
          if (prev <= 1) {
            // Countdown expired! Automatically pause tracking
            handleIdleAutoPause();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showIdlePrompt, idleCountdown]);

  const handleIdleResumeWorking = () => {
    setShowIdlePrompt(false);
    idlePromptActiveRef.current = false;
    setIdleCountdown(60);
    setLastSyncStatus('🚀 Resumed active tracking (user confirmed)');
  };

  const handleIdleTakeBreak = async () => {
    setShowIdlePrompt(false);
    idlePromptActiveRef.current = false;
    setIdleCountdown(60);
    if (isTrackingRef.current) {
      await toggleTracking();
      setLastSyncStatus('☕ On Break: Tracking paused');
    }
  };

  const handleIdleAutoPause = async () => {
    setShowIdlePrompt(false);
    idlePromptActiveRef.current = false;
    setIdleCountdown(60);
    if (isTrackingRef.current) {
      await toggleTracking();
      setLastSyncStatus('⏸️ Inactivity timeout: Tracking auto-paused');
    }
  };

  const toggleTracking = async () => {
    const nextTracking = !isTracking;
    setIsTracking(nextTracking);

    const currentSession = sessionRef.current;
    const currentTenantId = tenantIdRef.current;

    if (!currentSession?.user?.id || !currentTenantId) return;

    if (nextTracking) {
      try {
        localStorage.removeItem('smart_tracker_is_tracking_paused');

        // Strictly enforce: ONE USER ONE ACTIVE SESSION
        // 1. Check if an OPEN session already exists for this user in Supabase
        const { data: existingActive } = await supabase
          .from('attendance_sessions')
          .select('id')
          .eq('user_id', currentSession.user.id)
          .eq('status', 'OPEN')
          .order('clocked_in_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingActive?.id) {
          // Reuse existing active session! Never create duplicate
          currentAttendanceSessionIdRef.current = existingActive.id;
          setLastSyncStatus('🚀 Tracking Active: Working session recorded');
        } else {
          // Close any stale sessions first just in case
          await supabase
            .from('attendance_sessions')
            .update({
              status: 'CLOSED',
              clocked_out_at: new Date().toISOString(),
            })
            .eq('user_id', currentSession.user.id)
            .eq('status', 'OPEN');

          const { data, error } = await supabase
            .from('attendance_sessions')
            .insert({
              tenant_id: currentTenantId,
              user_id: currentSession.user.id,
              clocked_in_at: new Date().toISOString(),
              status: 'OPEN',
            })
            .select('id')
            .single();

          if (!error && data) {
            currentAttendanceSessionIdRef.current = data.id;
            setLastSyncStatus('🚀 Tracking Active: Working session recorded');
          }
        }
      } catch (e) {
        console.warn('Attendance session start error:', e);
      }
    } else {
      try {
        localStorage.setItem('smart_tracker_is_tracking_paused', 'true');
        // Always close all open sessions for this user
        await supabase
          .from('attendance_sessions')
          .update({
            clocked_out_at: new Date().toISOString(),
            status: 'CLOSED',
          })
          .eq('user_id', currentSession.user.id)
          .eq('status', 'OPEN');
        currentAttendanceSessionIdRef.current = null;

        const todayStr = getTodayKey();
        try {
          localStorage.setItem(`smart_tracker_today_seconds_${currentSession.user.id}_${todayStr}`, String(timer));
        } catch {
          // ignore
        }
        setLastSyncStatus(`⏸️ Paused: Today's progress saved (${formatTime(timer)})`);
      } catch (e) {
        console.warn('Attendance session close error:', e);
      }
    }
  };

  const handleLogout = async () => {
    if (isTracking) {
      await toggleTracking();
    }
    setIsTracking(false);
    supabase.auth.signOut();
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-600">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-sm font-medium">Connecting to Smart Employee Tracker...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md border border-gray-100 p-2">
              <img src="/app-logo.png" alt="Smart Employee Tracker Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Smart Employee Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in as an employee to track</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@example.com"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Sign In
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-gray-400">
            Default: <span className="font-mono text-gray-600">employee@example.com</span> / <span className="font-mono text-gray-600">password123</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isTracking ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-semibold text-sm">
                  {isTracking ? 'Tracking Active' : 'Online (Idle)'}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold border border-blue-500/30">
                  v1.0.0
                </span>
              </div>
              <p className="text-[10px] text-gray-400 truncate max-w-[160px]">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => checkForAppUpdates(false)}
              disabled={isCheckingUpdate}
              title="Check for Updates"
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-750 border border-gray-700/80 rounded-lg transition-all shadow-2xs active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingUpdate ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isCheckingUpdate ? 'Checking...' : 'Check Updates'}</span>
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* In-app Update Toast / Status Message */}
        {updateToastMessage && (
          <div className="bg-blue-600 text-white text-xs px-4 py-2 font-medium flex items-center justify-between shadow-xs transition-all animate-in fade-in slide-in-from-top-1">
            <span>{updateToastMessage}</span>
            <button
              onClick={() => setUpdateToastMessage(null)}
              className="ml-3 text-white/70 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Update Notification Banner */}
        {updateAvailable && (
          <div className="bg-blue-600 px-4 py-2.5 text-white flex items-center justify-between shadow-inner">
            <div className="flex items-center space-x-2 min-w-0">
              <Download className="w-4 h-4 shrink-0 animate-bounce" />
              <div className="text-xs truncate">
                <p className="font-semibold truncate">Update v{updateAvailable.version} available</p>
                {updateStatusText && <p className="text-[10px] text-blue-100">{updateStatusText}</p>}
              </div>
            </div>
            <button
              onClick={handleInstallUpdate}
              disabled={isUpdating}
              className="px-2.5 py-1 bg-white text-blue-600 rounded-md text-xs font-bold hover:bg-blue-50 transition-colors shadow-2xs shrink-0 disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update Now'}
            </button>
          </div>
        )}

        {/* Timer UI */}
        <div className="p-6 text-center space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Today's Tracked Time
            </p>
            <div className="mt-1 text-5xl font-light text-gray-900 tracking-tight tabular-nums flex items-center justify-center">
              {formatTime(timer)}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleTracking}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                isTracking
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isTracking ? (
                <>
                  <Square className="w-4 h-4" fill="currentColor" />
                  <span>Stop Tracking</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" fill="currentColor" />
                  <span>Start Tracking</span>
                </>
              )}
            </button>

            {isTracking && (
              <button
                onClick={takeAndUploadScreenshot}
                disabled={isSnapping}
                title="Capture screenshot right now"
                className="flex items-center justify-center px-3.5 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                <Camera className={`w-4 h-4 ${isSnapping ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {/* Sync Stats Badges */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
              <span className="block font-bold text-gray-800 text-base">{screenshotsCount}</span>
              <span className="text-gray-500 text-[11px]">Screenshots</span>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
              <span className="block font-bold text-gray-800 text-base">{eventsCount}</span>
              <span className="text-gray-500 text-[11px]">Activities</span>
            </div>
          </div>
        </div>

        {/* Footer info & Live Snapshot */}
        <div className="bg-gray-50 border-t border-gray-100 p-5 flex flex-col space-y-3">
          {/* Active Window */}
          <div className="flex items-center space-x-3 text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-semibold text-xs text-gray-900 truncate">
                  {activeApp !== 'None' ? activeApp : 'No Focus Detected'}
                </span>
                {isUserIdle ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    💤 Idle (Away)
                  </span>
                ) : activeApp !== 'None' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                      !appProductivity.isReviewed
                        ? 'bg-gray-100 text-gray-500 border border-gray-200'
                        : appProductivity.classification === 'PRODUCTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : appProductivity.classification === 'UNPRODUCTIVE'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {!appProductivity.isReviewed
                      ? 'Unreviewed'
                      : appProductivity.classification.toLowerCase()}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-400 truncate mt-0.5">
                {windowTitle || 'Waiting for activity...'}
              </span>
            </div>
          </div>

          {/* Screenshot Preview */}
          <div className="flex items-center space-x-3 text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Camera className="w-4 h-4" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-semibold text-xs text-gray-900">Last Screenshot</span>
              <span className="text-[11px] text-gray-400 truncate">
                {lastScreenshot ? 'Captured & uploaded to Supabase' : 'Waiting for first capture...'}
              </span>
            </div>
            {lastScreenshot && (
              <div className="w-14 h-9 rounded-lg border border-gray-200 overflow-hidden shrink-0 shadow-2xs">
                <img
                  src={lastScreenshot}
                  alt="Recent Capture"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Admin Policy Status */}
          <div className="flex items-center justify-between text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-xs text-gray-900 truncate">
                    Admin Policy: {policy.enableScreenCapture ? policy.screenshotIntervalStr : 'Captures Off'}
                  </span>
                  {isRealtimeConnected && (
                    <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.2 text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 shrink-0">
                      <Zap className="w-2 h-2 fill-current" />
                      Live
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 truncate">
                  Blur: {policy.blurScreenCapture ? 'Enabled' : 'Off'} • Idle: {policy.idleTimeoutStr}
                </span>
              </div>
            </div>
            <button
              onClick={() => fetchTrackSettings(session?.user?.id)}
              disabled={isSyncingPolicy}
              title="Sync latest policy from admin settings"
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md transition-colors shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPolicy ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>

          {/* Auto-Start System Boot Preference */}
          <div className="flex items-center justify-between text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className={`p-1.5 rounded-lg shrink-0 ${isAutoStart ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                <Power className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs text-gray-900 truncate">
                  Auto-Start on Boot
                </span>
                <span className="text-[10px] text-gray-400 truncate">
                  {isAutoStart ? 'Starts automatically on Windows/Mac boot' : 'Manual start required'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleAutoStart}
              type="button"
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAutoStart ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isAutoStart ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
            <div className="flex items-center space-x-1.5 truncate">
              {isTracking ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-gray-400 shrink-0" />
              )}
              <span className="truncate">{lastSyncStatus}</span>
            </div>
            <span className="shrink-0 text-gray-400 font-mono">Live</span>
          </div>
        </div>
      </div>

      {/* Interactive Idle Auto-Pause Modal */}
      {showIdlePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-amber-200">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Are you still working?</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                You haven't been active for a while. We noticed no keyboard or mouse activity.
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-semibold text-amber-800">
              <Bell className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Auto-pausing tracker in <span className="font-mono text-sm font-bold text-amber-900">{idleCountdown}s</span></span>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleIdleResumeWorking}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Yes, Keep Working</span>
              </button>

              <button
                onClick={handleIdleTakeBreak}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                <Coffee className="w-4 h-4 text-amber-600" />
                <span>Take a Break</span>
              </button>

              <button
                onClick={handleIdleAutoPause}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Tracking</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
