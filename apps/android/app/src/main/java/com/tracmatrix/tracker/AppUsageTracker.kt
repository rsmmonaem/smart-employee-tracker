package com.tracmatrix.tracker

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Process

class AppUsageTracker(private val context: Context) {

    fun hasUsagePermission(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            context.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    data class AppInfo(
        val appName: String,
        val packageName: String,
        val classification: String
    )

    fun getForegroundApp(): AppInfo {
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return AppInfo("System", "android", "NEUTRAL")

        val time = System.currentTimeMillis()
        val events = usageStatsManager.queryEvents(time - 1000 * 30, time)
        val event = UsageEvents.Event()
        var lastForegroundPackage: String? = null

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
                event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                lastForegroundPackage = event.packageName
            }
        }

        val pkg = lastForegroundPackage ?: context.packageName
        val pm = context.packageManager
        val label = try {
            val appInfo = pm.getApplicationInfo(pkg, 0)
            pm.getApplicationLabel(appInfo).toString()
        } catch (e: PackageManager.NameNotFoundException) {
            pkg
        }

        val classification = classifyApp(pkg, label)
        return AppInfo(appName = label, packageName = pkg, classification = classification)
    }

    private fun classifyApp(pkg: String, label: String): String {
        val p = pkg.toLowerCase()
        val l = label.toLowerCase()

        // Work / Productive apps
        if (p.contains("slack") || p.contains("teams") || p.contains("zoom") ||
            p.contains("meet") || p.contains("github") || p.contains("gitlab") ||
            p.contains("jira") || p.contains("trello") || p.contains("asana") ||
            p.contains("notion") || p.contains("google.docs") || p.contains("google.sheets") ||
            p.contains("android.apps.docs") || p.contains("tracmatrix") ||
            l.contains("tracker") || l.contains("work") || l.contains("office") ||
            l.contains("code") || l.contains("studio")) {
            return "PRODUCTIVE"
        }

        // Unproductive / Entertainment apps
        if (p.contains("youtube") || p.contains("tiktok") || p.contains("instagram") ||
            p.contains("facebook") || p.contains("netflix") || p.contains("twitter") ||
            p.contains("games") || p.contains("candycrush") || p.contains("pubg") ||
            p.contains("spotify") || p.contains("twitch")) {
            return "UNPRODUCTIVE"
        }

        // Default neutral
        return "NEUTRAL"
    }
}
