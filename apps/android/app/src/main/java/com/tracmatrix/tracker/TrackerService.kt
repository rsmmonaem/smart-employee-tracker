package com.tracmatrix.tracker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream

class TrackerService : Service() {

    companion object {
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val EXTRA_RESULT_CODE = "EXTRA_RESULT_CODE"
        const val EXTRA_RESULT_DATA = "EXTRA_RESULT_DATA"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "tracmatrix_tracker_channel"

        var isServiceRunning = false
            private set
    }

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var sessionManager: SessionManager
    private lateinit var apiClient: ApiClient
    private lateinit var appUsageTracker: AppUsageTracker

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null

    private var screenWidth = 720
    private var screenHeight = 1280
    private var screenDensity = 320

    private val handler = Handler(Looper.getMainLooper())
    private var secondsTracked = 0L

    private val timerRunnable = object : Runnable {
        override fun run() {
            secondsTracked++
            updateNotification()
            handler.postDelayed(this, 1000)
        }
    }

    private val appPollRunnable = object : Runnable {
        override fun run() {
            pollAppUsage()
            handler.postDelayed(this, 10000) // Poll every 10 seconds
        }
    }

    private val screenshotRunnable = object : Runnable {
        override fun run() {
            captureAndUploadScreenshot()
            handler.postDelayed(this, 5 * 60 * 1000) // Periodic screenshot every 5 mins
        }
    }

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager(this)
        apiClient = ApiClient(sessionManager)
        appUsageTracker = AppUsageTracker(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: return START_NOT_STICKY

        if (action == ACTION_START) {
            val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, -1)
            val resultData = intent.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)

            startForeground(NOTIFICATION_ID, buildNotification("Starting TracMatrix Tracker..."))
            isServiceRunning = true
            sessionManager.isTracking = true
            if (sessionManager.clockInTimestamp == 0L) {
                sessionManager.clockInTimestamp = System.currentTimeMillis()
            }

            // Init Display metrics
            initDisplayMetrics()

            // Setup MediaProjection if intent extras provided
            if (resultCode != -1 && resultData != null) {
                setupMediaProjection(resultCode, resultData)
            }

            // Start timers
            handler.post(timerRunnable)
            handler.postDelayed(appPollRunnable, 5000)
            handler.postDelayed(screenshotRunnable, 10000) // Initial screenshot after 10s
        } else if (action == ACTION_STOP) {
            stopTracking()
        }

        return START_STICKY
    }

    private fun initDisplayMetrics() {
        val windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val metrics = DisplayMetrics()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val windowMetrics = windowManager.currentWindowMetrics
            val bounds = windowMetrics.bounds
            screenWidth = bounds.width()
            screenHeight = bounds.height()
            screenDensity = resources.configuration.densityDpi
        } else {
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.getRealMetrics(metrics)
            screenWidth = metrics.widthPixels
            screenHeight = metrics.heightPixels
            screenDensity = metrics.densityDpi
        }

        // Cap dimensions for memory and network efficiency (max 1080p)
        if (screenWidth > 1080) {
            val scale = 1080f / screenWidth
            screenWidth = 1080
            screenHeight = (screenHeight * scale).toInt()
        }
    }

    private fun setupMediaProjection(resultCode: Int, data: Intent) {
        val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as? MediaProjectionManager
            ?: return

        mediaProjection = projectionManager.getMediaProjection(resultCode, data)
        imageReader = ImageReader.newInstance(screenWidth, screenHeight, PixelFormat.RGBA_8888, 2)

        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "TracMatrixCapture",
            screenWidth,
            screenHeight,
            screenDensity,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            null
        )
    }

    private fun captureAndUploadScreenshot() {
        val reader = imageReader ?: return
        serviceScope.launch(Dispatchers.IO) {
            try {
                val image = reader.acquireLatestImage() ?: return@launch
                val planes = image.planes
                val buffer = planes[0].buffer
                val pixelStride = planes[0].pixelStride
                val rowStride = planes[0].rowStride
                val rowPadding = rowStride - pixelStride * screenWidth

                val bitmap = Bitmap.createBitmap(
                    screenWidth + rowPadding / pixelStride,
                    screenHeight,
                    Bitmap.Config.ARGB_8888
                )
                bitmap.copyPixelsFromBuffer(buffer)
                image.close()

                val croppedBitmap = if (rowPadding > 0) {
                    Bitmap.createBitmap(bitmap, 0, 0, screenWidth, screenHeight)
                } else {
                    bitmap
                }

                val out = ByteArrayOutputStream()
                croppedBitmap.compress(Bitmap.CompressFormat.JPEG, 75, out)
                val jpegBytes = out.toByteArray()

                apiClient.uploadScreenshot(jpegBytes, System.currentTimeMillis())
                Log.d("TrackerService", "Screenshot captured & uploaded (${jpegBytes.size} bytes)")
            } catch (e: Exception) {
                Log.e("TrackerService", "Screenshot capture failed", e)
            }
        }
    }

    private fun pollAppUsage() {
        serviceScope.launch(Dispatchers.IO) {
            try {
                val appInfo = appUsageTracker.getForegroundApp()
                val now = System.currentTimeMillis()
                apiClient.reportActivity(
                    appName = appInfo.appName,
                    packageName = appInfo.packageName,
                    startTimeMs = now - 10000,
                    endTimeMs = now,
                    classification = appInfo.classification
                )
                Log.d("TrackerService", "Tracked app: ${appInfo.appName} [${appInfo.classification}]")
            } catch (e: Exception) {
                Log.e("TrackerService", "App polling failed", e)
            }
        }
    }

    private fun stopTracking() {
        handler.removeCallbacks(timerRunnable)
        handler.removeCallbacks(appPollRunnable)
        handler.removeCallbacks(screenshotRunnable)

        virtualDisplay?.release()
        virtualDisplay = null
        imageReader?.close()
        imageReader = null
        mediaProjection?.stop()
        mediaProjection = null

        isServiceRunning = false
        sessionManager.isTracking = false

        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun updateNotification() {
        val hours = secondsTracked / 3600
        val mins = (secondsTracked % 3600) / 60
        val secs = secondsTracked % 60
        val timeStr = String.format("%02d:%02d:%02d", hours, mins, secs)

        val notification = buildNotification("Active Tracking: $timeStr")
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun buildNotification(contentText: String): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("TracMatrix Employee Tracker")
            .setContentText(contentText)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "TracMatrix Tracking Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows employee time tracking status in background"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        stopTracking()
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
