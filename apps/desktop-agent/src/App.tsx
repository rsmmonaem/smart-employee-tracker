import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Play, Square, LogOut, Clock, Activity, Camera, RefreshCw, CheckCircle2, AlertCircle, Sliders, Zap } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
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

  // Periodic safety fallback poll (every 30s)
  useEffect(() => {
    const policyInterval = setInterval(() => {
      fetchTrackSettings(sessionRef.current?.user?.id);
    }, 30000);
    return () => clearInterval(policyInterval);
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
    title?: string
  ): { classification: 'PRODUCTIVE' | 'NEUTRAL' | 'UNPRODUCTIVE'; isReviewed: boolean } => {
    const currentRules = rulesRef.current;
    const nApp = appName.toLowerCase().trim();
    const nTitle = (title || '').toLowerCase().trim();

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
      const activeWin: any = await invoke('get_focused_window');
      if (activeWin) {
        const app = activeWin.app_name || 'System';
        const title = activeWin.title || 'Desktop';
        setActiveApp(app);
        setWindowTitle(title);

        const { classification, isReviewed } = getClassificationForApp(app, title);
        setAppProductivity({ classification, isReviewed });

        const currentSession = sessionRef.current;
        const currentTenantId = tenantIdRef.current;

        if (currentSession?.user?.id && currentTenantId) {
          const { error } = await supabase.from('activity_events').insert({
            tenant_id: currentTenantId,
            user_id: currentSession.user.id,
            app_name: app,
            window_title: title,
            started_at: new Date(Date.now() - 5000).toISOString(),
            ended_at: new Date().toISOString(),
            classification,
          });

          if (!error) {
            setEventsCount((prev) => prev + 1);
            setLastSyncStatus(`Activity: ${app} (${classification})`);
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

    try {
      setIsSnapping(true);
      const base64Img: string = await invoke('capture_screen');
      if (!base64Img) {
        setIsSnapping(false);
        return;
      }

      setLastScreenshot(`data:image/jpeg;base64,${base64Img}`);

      // Convert Base64 to binary buffer
      const byteChars = atob(base64Img);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const timestamp = Date.now();
      const storagePath = `${currentTenantId}/${currentSession.user.id}/${timestamp}.jpg`;

      // 1. Upload to Supabase Storage
      const { error: storageErr } = await supabase.storage
        .from('screenshots')
        .upload(storagePath, byteArray.buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (storageErr) {
        console.error('Storage upload failed:', storageErr);
        setLastSyncStatus(`Upload err: ${storageErr.message}`);
        setIsSnapping(false);
        return;
      }

      // 2. Insert record in screenshots table
      const { error: dbErr } = await supabase.from('screenshots').insert({
        tenant_id: currentTenantId,
        user_id: currentSession.user.id,
        storage_path: storagePath,
        taken_at: new Date().toISOString(),
        is_blurred: policyRef.current.blurScreenCapture,
      });

      if (dbErr) {
        console.error('Screenshot DB record error:', dbErr);
        setLastSyncStatus(`DB err: ${dbErr.message}`);
      } else {
        setScreenshotsCount((prev) => prev + 1);
        setLastSyncStatus(`Screenshot #${screenshotsCount + 1} synced!`);
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
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
              <Clock className="w-6 h-6 text-white" />
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
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

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
                {activeApp !== 'None' && (
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
