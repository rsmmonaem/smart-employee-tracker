package com.tracmatrix.tracker

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("tracmatrix_prefs", Context.MODE_PRIVATE)

    var serverUrl: String
        get() = prefs.getString("server_url", "https://app.tracmatrix.com") ?: "https://app.tracmatrix.com"
        set(value) = prefs.edit().putString("server_url", value.trimEnd('/')).apply()

    var supabaseUrl: String
        get() = prefs.getString("supabase_url", "https://supabase.tracmatrix.com") ?: "https://supabase.tracmatrix.com"
        set(value) = prefs.edit().putString("supabase_url", value.trimEnd('/')).apply()

    var supabaseKey: String
        get() = prefs.getString("supabase_key", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkxMjY2NjM2LCJleHAiOjE5NDg5NDY2MzZ9.43d4cm4IVkAuFX03AaAGR3y4fpCeRs9b_RfX-8MIZTs") ?: ""
        set(value) = prefs.edit().putString("supabase_key", value).apply()

    var authToken: String?
        get() = prefs.getString("auth_token", null)
        set(value) = prefs.edit().putString("auth_token", value).apply()

    var userId: String?
        get() = prefs.getString("user_id", null)
        set(value) = prefs.edit().putString("user_id", value).apply()

    var tenantId: String?
        get() = prefs.getString("tenant_id", null)
        set(value) = prefs.edit().putString("tenant_id", value).apply()

    var userEmail: String?
        get() = prefs.getString("user_email", null)
        set(value) = prefs.edit().putString("user_email", value).apply()

    var userName: String?
        get() = prefs.getString("user_name", null)
        set(value) = prefs.edit().putString("user_name", value).apply()

    var isTracking: Boolean
        get() = prefs.getBoolean("is_tracking", false)
        set(value) = prefs.edit().putBoolean("is_tracking", value).apply()

    var clockInTimestamp: Long
        get() = prefs.getLong("clock_in_timestamp", 0L)
        set(value) = prefs.edit().putLong("clock_in_timestamp", value).apply()

    var screenshotCount: Int
        get() = prefs.getInt("screenshot_count", 0)
        set(value) = prefs.edit().putInt("screenshot_count", value).apply()

    val isLoggedIn: Boolean
        get() = !userId.isNullOrEmpty() && !tenantId.isNullOrEmpty()

    fun clear() {
        prefs.edit().clear().apply()
    }
}
