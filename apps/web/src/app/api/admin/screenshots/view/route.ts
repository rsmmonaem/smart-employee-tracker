import { NextResponse } from 'next/server'
import zlib from 'zlib'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionContext } from '@/utils/supabase/auth-context'

export const dynamic = 'force-dynamic'

/**
 * On-Demand Screenshot Decompression and Streaming Endpoint
 * GET /api/admin/screenshots/view?path=<storage_path>
 *
 * Capabilities:
 * 1. Supports modern ultra-compressed WebP format
 * 2. On-demand decompression for Gzip/Zlib archived images (.gz)
 * 3. Backward-compatible with legacy uncompressed JPEG/PNG images
 * 4. Multi-tenant secure: ensures users only access screenshots within their organization
 * 5. High-performance browser caching: Cache-Control: public, max-age=31536000, immutable
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const storagePath = searchParams.get('path')

    if (!storagePath) {
      return new NextResponse('Missing screenshot path parameter', { status: 400 })
    }

    // Authenticate user session
    const session = await getSessionContext()
    if (!session) {
      return new NextResponse('Unauthorized access', { status: 401 })
    }

    // Strict multi-tenant security verification
    if (!session.isSuperAdmin && session.tenantId) {
      const pathSegments = storagePath.split('/')
      const pathTenantId = pathSegments[0]

      // If storage path begins with a tenant ID, ensure it matches current tenant
      if (pathTenantId && pathTenantId !== session.tenantId) {
        return new NextResponse('Forbidden: Cross-tenant access denied', { status: 403 })
      }
    }

    const supabase = createAdminClient()

    // Download compressed or raw image from Supabase Storage
    const { data: fileBlob, error: downloadErr } = await supabase.storage
      .from('screenshots')
      .download(storagePath)

    if (downloadErr || !fileBlob) {
      console.warn(`[Screenshot View] File not found or storage error: ${storagePath}`, downloadErr)
      return new NextResponse('Screenshot not found', { status: 404 })
    }

    const rawBuffer = Buffer.from(await fileBlob.arrayBuffer())
    let outputBuffer: Buffer = rawBuffer
    let contentType = 'image/jpeg'

    // Determine MIME type and perform on-demand decompression if needed
    if (storagePath.endsWith('.gz')) {
      try {
        outputBuffer = zlib.gunzipSync(rawBuffer)
        if (storagePath.includes('.webp.')) {
          contentType = 'image/webp'
        } else if (storagePath.includes('.png.')) {
          contentType = 'image/png'
        } else {
          contentType = 'image/jpeg'
        }
      } catch (decompErr) {
        console.error('[Screenshot View] Decompression failed:', decompErr)
        return new NextResponse('Failed to decompress screenshot archive', { status: 500 })
      }
    } else if (storagePath.endsWith('.webp')) {
      contentType = 'image/webp'
    } else if (storagePath.endsWith('.png')) {
      contentType = 'image/png'
    } else {
      contentType = 'image/jpeg'
    }

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': outputBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Decompressed-On-Demand': storagePath.endsWith('.gz') ? 'true' : 'false',
      },
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Screenshot View] Internal error:', errorMsg)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
