import { NextResponse } from 'next/server';

// Tauri v2 updater endpoint
// Route: /api/agent/update/[target]/[current_version]
// Example targets:
// - darwin-aarch64
// - darwin-x86_64
// - windows-x86_64
// - linux-x86_64

interface UpdateInfo {
  version: string;
  notes: string;
  pub_date: string;
  platforms: {
    [target: string]: {
      url: string;
      signature?: string;
    };
  };
}

// Current latest published agent release metadata
const LATEST_RELEASE: UpdateInfo = {
  version: '1.0.0',
  notes: 'Smart Employee Tracker v1.0.0 - Enhanced Multi-Screen capture, role security & automatic updates.',
  pub_date: new Date().toISOString(),
  platforms: {
    'darwin-aarch64': {
      url: 'https://app.tracmatrix.com/downloads/Smart-Employee-Tracker-macOS.dmg',
      signature: '',
    },
    'darwin-x86_64': {
      url: 'https://app.tracmatrix.com/downloads/Smart-Employee-Tracker-macOS.dmg',
      signature: '',
    },
    'windows-x86_64': {
      url: 'https://app.tracmatrix.com/downloads/Smart-Employee-Tracker.exe',
      signature: '',
    },
  },
};

// Simple semver compare: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/, '').split('.').map(Number);
  const clean2 = v2.replace(/^v/, '').split('.').map(Number);
  const len = Math.max(clean1.length, clean2.length);

  for (let i = 0; i < len; i++) {
    const num1 = clean1[i] || 0;
    const num2 = clean2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ target: string; current_version: string }> }
) {
  try {
    const resolvedParams = await params;
    const target = resolvedParams.target;
    const currentVersion = resolvedParams.current_version;

    // Check if current agent version is older than latest available
    const hasUpdate = compareVersions(LATEST_RELEASE.version, currentVersion) > 0;

    if (!hasUpdate) {
      // 204 No Content indicates agent is already on latest version
      return new NextResponse(null, { status: 204 });
    }

    const platformConfig = LATEST_RELEASE.platforms[target] || LATEST_RELEASE.platforms['darwin-aarch64'];

    return NextResponse.json({
      version: LATEST_RELEASE.version,
      notes: LATEST_RELEASE.notes,
      pub_date: LATEST_RELEASE.pub_date,
      url: platformConfig.url,
      signature: platformConfig.signature || '',
    });
  } catch (error) {
    console.error('Error serving agent update:', error);
    return new NextResponse(null, { status: 204 });
  }
}
