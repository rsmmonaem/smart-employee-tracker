import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Play, Square, LogOut, Activity, Camera, RefreshCw, CheckCircle2, AlertCircle, Sliders, Zap, Download } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';

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

  // Auto-updater state
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatusText, setUpdateStatusText] = useState('');

  const checkForAppUpdates = async (silent = true) => {
    try {
      const update = await check();
      if (update?.available) {
        setUpdateAvailable(update);
        if (!silent) {
          alert(`New version ${update.version} is available!`);
        }
      } else {
        if (!silent) {
          alert('You are already using the latest version.');
        }
      }
    } catch (err) {
      console.warn('Auto-updater check error:', err);
      if (!silent) {
        alert('Could not check for updates.');
      }
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateAvailable) return;
    try {
      setIsUpdating(true);
      setUpdateStatusText('Downloading update...');
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
      // App will restart or prompt
    } catch (err: any) {
      console.error('Failed to install update:', err);
      alert(`Update failed: ${err?.message || err}`);
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

    const intervalMs = parseIntervalToMs(intervalStr);

    setPolicy({
      enableScreenCapture: enableCapture,
      blurScreenCapture: blurCapture,
      screenshotIntervalStr: intervalStr,
      screenshotIntervalMs: intervalMs,
      idleTimeoutStr: idleStr,
      lastSyncedAt: new Date().toLocaleTimeString(),
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

  // Load session & track settings
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchTrackSettings(session.user.id);
      } else {
        fetchTrackSettings();
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchTrackSettings(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodic safety fallback poll (every 30s) & update check
  useEffect(() => {
    // Check for updates on startup
    checkForAppUpdates(true);

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
      const { data } = await supabase
        .from('productivity_rules')
        .select('pattern, classification, match_type');
      if (data) {
        setRules(data as ProductivityRule[]);
        rulesRef.current = data as ProductivityRule[];
      }
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
      interval = setInterval(async () => {
        setTimer((prev) => prev + 1);
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
      }

      // 2. Active Window Tracking
      const activeWin: any = await invoke('get_focused_window');
      if (activeWin) {
        const app = activeWin.app_name || 'System';
        const title = activeWin.title || 'Desktop';
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
          }
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

  const toggleTracking = async () => {
    const nextTracking = !isTracking;
    setIsTracking(nextTracking);

    const currentSession = sessionRef.current;
    const currentTenantId = tenantIdRef.current;

    if (!currentSession?.user?.id || !currentTenantId) return;

    if (nextTracking) {
      try {
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
          setLastSyncStatus('Clocked In: Real session recorded in Supabase');
        }
      } catch (e) {
        console.warn('Attendance session start error:', e);
      }
    } else {
      try {
        const sessId = currentAttendanceSessionIdRef.current;
        if (sessId) {
          await supabase
            .from('attendance_sessions')
            .update({
              clocked_out_at: new Date().toISOString(),
              status: 'CLOSED',
            })
            .eq('id', sessId);
          currentAttendanceSessionIdRef.current = null;
        } else {
          await supabase
            .from('attendance_sessions')
            .update({
              clocked_out_at: new Date().toISOString(),
              status: 'CLOSED',
            })
            .eq('user_id', currentSession.user.id)
            .eq('status', 'OPEN');
        }
        setLastSyncStatus('Clocked Out: Real session saved to Supabase');
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
              <span className="text-white font-semibold text-sm">
                {isTracking ? 'Tracking Active' : 'Online (Idle)'}
              </span>
              <p className="text-[10px] text-gray-400 truncate max-w-[160px]">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => checkForAppUpdates(false)}
              title="Check for Updates"
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
    </div>
  );
}
