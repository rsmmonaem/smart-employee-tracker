package com.tracmatrix.tracker

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.res.ColorStateList
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.tracmatrix.tracker.databinding.ActivityMainBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var apiClient: ApiClient
    private lateinit var appUsageTracker: AppUsageTracker

    private val uiHandler = Handler(Looper.getMainLooper())

    private val screenCaptureLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
            startTrackingService(result.resultCode, result.data!!)
        } else {
            Toast.makeText(this, "Screen capture permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    private val timerRunnable = object : Runnable {
        override fun run() {
            updateDashboardUI()
            uiHandler.postDelayed(this, 1000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        apiClient = ApiClient(sessionManager)
        appUsageTracker = AppUsageTracker(this)

        setupListeners()
        updateViewState()
    }

    override fun onResume() {
        super.onResume()
        updateViewState()
        if (TrackerService.isServiceRunning) {
            uiHandler.post(timerRunnable)
        }
    }

    override fun onPause() {
        super.onPause()
        uiHandler.removeCallbacks(timerRunnable)
    }

    private fun setupListeners() {
        binding.btnLogin.setOnClickListener {
            performLogin()
        }

        binding.btnToggleTracking.setOnClickListener {
            if (TrackerService.isServiceRunning) {
                stopTrackingService()
            } else {
                requestStartTracking()
            }
        }

        binding.btnUsagePermission.setOnClickListener {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        }

        binding.btnBatteryOptimization.setOnClickListener {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            }
        }

        binding.btnLogout.setOnClickListener {
            stopTrackingService()
            sessionManager.clear()
            updateViewState()
        }
    }

    private fun performLogin() {
        val email = binding.etEmail.text?.toString()?.trim() ?: ""
        val pass = binding.etPassword.text?.toString()?.trim() ?: ""
        val serverUrl = binding.etServerUrl.text?.toString()?.trim() ?: "https://app.tracmatrix.com"

        if (email.isEmpty() || pass.isEmpty()) {
            Toast.makeText(this, "Please enter email and password", Toast.LENGTH_SHORT).show()
            return
        }

        sessionManager.serverUrl = serverUrl
        binding.pbLogin.visibility = View.VISIBLE
        binding.btnLogin.isEnabled = false

        CoroutineScope(Dispatchers.Main).launch {
            val result = apiClient.login(email, pass)
            binding.pbLogin.visibility = View.GONE
            binding.btnLogin.isEnabled = true

            result.onSuccess { msg ->
                Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
                updateViewState()
            }.onFailure { err ->
                Toast.makeText(this@MainActivity, "Error: ${err.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun requestStartTracking() {
        if (!appUsageTracker.hasUsagePermission()) {
            Toast.makeText(this, "Please grant App Usage Access to track apps", Toast.LENGTH_LONG).show()
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
            return
        }

        val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as? MediaProjectionManager
        if (projectionManager != null) {
            screenCaptureLauncher.launch(projectionManager.createScreenCaptureIntent())
        } else {
            Toast.makeText(this, "Media projection not supported on this device", Toast.LENGTH_SHORT).show()
        }
    }

    private fun startTrackingService(resultCode: Int, data: Intent) {
        val serviceIntent = Intent(this, TrackerService::class.java).apply {
            action = TrackerService.ACTION_START
            putExtra(TrackerService.EXTRA_RESULT_CODE, resultCode)
            putExtra(TrackerService.EXTRA_RESULT_DATA, data)
        }
        ContextCompat.startForegroundService(this, serviceIntent)

        uiHandler.post(timerRunnable)
        updateViewState()
    }

    private fun stopTrackingService() {
        val serviceIntent = Intent(this, TrackerService::class.java).apply {
            action = TrackerService.ACTION_STOP
        }
        startService(serviceIntent)
        uiHandler.removeCallbacks(timerRunnable)
        updateViewState()
    }

    private fun updateViewState() {
        if (sessionManager.isLoggedIn) {
            binding.cardLogin.visibility = View.GONE
            binding.layoutDashboard.visibility = View.VISIBLE

            binding.tvUserName.text = sessionManager.userName ?: "Employee"
            binding.tvUserEmail.text = sessionManager.userEmail ?: ""

            updateDashboardUI()
        } else {
            binding.cardLogin.visibility = View.VISIBLE
            binding.layoutDashboard.visibility = View.GONE
            binding.badgeStatus.text = "Offline"
            binding.badgeStatus.backgroundTintList = ColorStateList.valueOf(
                ContextCompat.getColor(this, R.color.card_bg)
            )
        }
    }

    private fun updateDashboardUI() {
        val isRunning = TrackerService.isServiceRunning

        if (isRunning) {
            binding.badgeStatus.text = "Tracking Active"
            binding.badgeStatus.backgroundTintList = ColorStateList.valueOf(
                ContextCompat.getColor(this, R.color.accent_green)
            )

            binding.btnToggleTracking.text = "Stop Tracking (Clock Out)"
            binding.btnToggleTracking.backgroundTintList = ColorStateList.valueOf(
                ContextCompat.getColor(this, R.color.accent_red)
            )

            val startTime = sessionManager.clockInTimestamp
            if (startTime > 0) {
                val elapsedSec = (System.currentTimeMillis() - startTime) / 1000
                val h = elapsedSec / 3600
                val m = (elapsedSec % 3600) / 60
                val s = elapsedSec % 60
                binding.tvTimer.text = String.format("%02d:%02d:%02d", h, m, s)
            }
        } else {
            binding.badgeStatus.text = "Stopped"
            binding.badgeStatus.backgroundTintList = ColorStateList.valueOf(
                ContextCompat.getColor(this, R.color.card_bg)
            )

            binding.btnToggleTracking.text = "Start Tracking (Clock In)"
            binding.btnToggleTracking.backgroundTintList = ColorStateList.valueOf(
                ContextCompat.getColor(this, R.color.brand_primary)
            )
            binding.tvTimer.text = "00:00:00"
        }

        binding.tvScreenshotsCount.text = sessionManager.screenshotCount.toString()

        if (appUsageTracker.hasUsagePermission()) {
            binding.btnUsagePermission.text = "✓ App Usage Access Granted"
            binding.btnUsagePermission.isEnabled = false
            val foreground = appUsageTracker.getForegroundApp()
            binding.tvActiveApp.text = "${foreground.appName} [${foreground.classification}]"
        } else {
            binding.btnUsagePermission.text = "Grant App Usage Access"
            binding.btnUsagePermission.isEnabled = true
            binding.tvActiveApp.text = "Permission Needed"
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
            if (pm?.isIgnoringBatteryOptimizations(packageName) == true) {
                binding.btnBatteryOptimization.text = "✓ Battery Optimization Disabled"
                binding.btnBatteryOptimization.isEnabled = false
            }
        }
    }
}
