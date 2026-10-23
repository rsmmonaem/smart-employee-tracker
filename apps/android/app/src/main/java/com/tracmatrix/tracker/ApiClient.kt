package com.tracmatrix.tracker

import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit

class ApiClient(private val sessionManager: SessionManager) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()
    private val jpegMediaType = "image/jpeg".toMediaType()

    private fun getIsoTimestamp(timestamp: Long = System.currentTimeMillis()): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date(timestamp))
    }

    suspend fun login(email: String, pass: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val loginPayload = JsonObject().apply {
                addProperty("email", email)
                addProperty("password", pass)
            }

            val request = Request.Builder()
                .url("${sessionManager.supabaseUrl}/auth/v1/token?grant_type=password")
                .header("apikey", sessionManager.supabaseKey)
                .header("Content-Type", "application/json")
                .post(loginPayload.toString().toRequestBody(jsonMediaType))
                .build()

            val response = client.newCall(request).execute()
            val respBody = response.body?.string() ?: ""

            if (!response.isSuccessful) {
                return@withContext Result.failure(Exception("Login failed: ${response.code} $respBody"))
            }

            val json = gson.fromJson(respBody, JsonObject::class.java)
            val accessToken = json.get("access_token")?.asString
                ?: return@withContext Result.failure(Exception("Missing access token"))
            val userObj = json.getAsJsonObject("user")
            val userId = userObj?.get("id")?.asString
                ?: return@withContext Result.failure(Exception("Missing user id"))

            sessionManager.authToken = accessToken
            sessionManager.userId = userId
            sessionManager.userEmail = email

            // Fetch user profile to get tenant_id and full_name
            val profileReq = Request.Builder()
                .url("${sessionManager.supabaseUrl}/rest/v1/users?id=eq.$userId&select=tenant_id,full_name,role")
                .header("apikey", sessionManager.supabaseKey)
                .header("Authorization", "Bearer $accessToken")
                .get()
                .build()

            val profileResp = client.newCall(profileReq).execute()
            val profileBody = profileResp.body?.string() ?: "[]"
            val userArray = gson.fromJson(profileBody, com.google.gson.JsonArray::class.java)

            if (userArray != null && userArray.size() > 0) {
                val profile = userArray.get(0).asJsonObject
                sessionManager.tenantId = profile.get("tenant_id")?.asString
                sessionManager.userName = profile.get("full_name")?.asString ?: email
            }

            if (sessionManager.tenantId.isNullOrEmpty()) {
                return@withContext Result.failure(Exception("Tenant ID not found for user"))
            }

            Result.success("Logged in successfully as ${sessionManager.userName}")
        } catch (e: Exception) {
            Log.e("ApiClient", "Login error", e)
            Result.failure(e)
        }
    }

    suspend fun uploadScreenshot(jpegBytes: ByteArray, timestamp: Long): Boolean = withContext(Dispatchers.IO) {
        val tenantId = sessionManager.tenantId ?: return@withContext false
        val userId = sessionManager.userId ?: return@withContext false
        val token = sessionManager.authToken ?: return@withContext false

        val storagePath = "$tenantId/$userId/$timestamp.jpg"

        try {
            // 1. Upload to Supabase Storage bucket 'screenshots'
            val uploadReq = Request.Builder()
                .url("${sessionManager.supabaseUrl}/storage/v1/object/screenshots/$storagePath")
                .header("apikey", sessionManager.supabaseKey)
                .header("Authorization", "Bearer $token")
                .header("x-upsert", "true")
                .post(jpegBytes.toRequestBody(jpegMediaType))
                .build()

            val uploadResp = client.newCall(uploadReq).execute()
            if (!uploadResp.isSuccessful) {
                Log.e("ApiClient", "Storage upload failed: ${uploadResp.code} ${uploadResp.body?.string()}")
                return@withContext false
            }

            // 2. Insert record in 'screenshots' table
            val record = JsonObject().apply {
                addProperty("tenant_id", tenantId)
                addProperty("user_id", userId)
                addProperty("storage_path", storagePath)
                addProperty("is_blurred", false)
                addProperty("taken_at", getIsoTimestamp(timestamp))
            }

            val insertReq = Request.Builder()
                .url("${sessionManager.supabaseUrl}/rest/v1/screenshots")
                .header("apikey", sessionManager.supabaseKey)
                .header("Authorization", "Bearer $token")
                .header("Content-Type", "application/json")
                .header("Prefer", "return=minimal")
                .post(record.toString().toRequestBody(jsonMediaType))
                .build()

            val insertResp = client.newCall(insertReq).execute()
            val success = insertResp.isSuccessful
            if (success) {
                sessionManager.screenshotCount = sessionManager.screenshotCount + 1
            }
            success
        } catch (e: Exception) {
            Log.e("ApiClient", "Upload screenshot exception", e)
            false
        }
    }

    suspend fun reportActivity(
        appName: String,
        packageName: String,
        startTimeMs: Long,
        endTimeMs: Long,
        classification: String = "PRODUCTIVE"
    ): Boolean = withContext(Dispatchers.IO) {
        val tenantId = sessionManager.tenantId ?: return@withContext false
        val userId = sessionManager.userId ?: return@withContext false
        val token = sessionManager.authToken ?: return@withContext false

        try {
            val record = JsonObject().apply {
                addProperty("tenant_id", tenantId)
                addProperty("user_id", userId)
                addProperty("app_name", appName)
                addProperty("window_title", packageName)
                addProperty("domain", null as String?)
                addProperty("classification", classification)
                addProperty("started_at", getIsoTimestamp(startTimeMs))
                addProperty("ended_at", getIsoTimestamp(endTimeMs))
            }

            val request = Request.Builder()
                .url("${sessionManager.supabaseUrl}/rest/v1/activity_events")
                .header("apikey", sessionManager.supabaseKey)
                .header("Authorization", "Bearer $token")
                .header("Content-Type", "application/json")
                .header("Prefer", "return=minimal")
                .post(record.toString().toRequestBody(jsonMediaType))
                .build()

            val response = client.newCall(request).execute()
            response.isSuccessful
        } catch (e: Exception) {
            Log.e("ApiClient", "Report activity exception", e)
            false
        }
    }
}
