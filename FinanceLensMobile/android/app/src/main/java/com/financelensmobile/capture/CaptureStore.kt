package com.financelensmobile.capture

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * App-private persisted state for the capture service: connection settings,
 * a small retry queue for transactions that couldn't be delivered, and
 * counters for the UI. Lives in native storage (not JS) because the listener
 * runs even when the React Native runtime isn't.
 */
class CaptureStore(context: Context) {
  private val prefs = context.applicationContext.getSharedPreferences("financelens_capture", Context.MODE_PRIVATE)

  val baseUrl: String? get() = prefs.getString("base_url", null)
  val apiKey: String? get() = prefs.getString("api_key", null)
  val accountId: String? get() = prefs.getString("account_id", null)
  val isConfigured: Boolean get() = !baseUrl.isNullOrEmpty() && !apiKey.isNullOrEmpty() && !accountId.isNullOrEmpty()

  val capturedCount: Int get() = prefs.getInt("captured", 0)
  val lastCaptureAt: Long get() = prefs.getLong("last_capture_at", 0L)
  val lastError: String? get() = prefs.getString("last_error", null)
  val pendingCount: Int get() = readQueue().length()

  @Synchronized
  fun configure(baseUrl: String, apiKey: String, accountId: String) {
    prefs.edit().putString("base_url", baseUrl.trimEnd('/')).putString("api_key", apiKey).putString("account_id", accountId)
      .remove("last_error").apply()
  }

  @Synchronized
  fun clear() {
    prefs.edit().clear().apply()
  }

  @Synchronized
  fun recordSuccess() {
    prefs.edit().putInt("captured", capturedCount + 1).putLong("last_capture_at", System.currentTimeMillis())
      .remove("last_error").apply()
  }

  @Synchronized
  fun recordError(message: String) {
    prefs.edit().putString("last_error", message).apply()
  }

  @Synchronized
  fun enqueue(body: JSONObject) {
    val queue = readQueue()
    queue.put(body)
    // Keep the newest MAX entries so a long offline stretch can't grow unbounded.
    val trimmed = JSONArray()
    for (i in maxOf(0, queue.length() - MAX_QUEUE) until queue.length()) trimmed.put(queue.get(i))
    prefs.edit().putString("queue", trimmed.toString()).apply()
  }

  @Synchronized
  fun drainQueue(): List<JSONObject> {
    val queue = readQueue()
    prefs.edit().remove("queue").apply()
    return (0 until queue.length()).map { queue.getJSONObject(it) }
  }

  private fun readQueue(): JSONArray =
    try {
      JSONArray(prefs.getString("queue", "[]"))
    } catch (_: Exception) {
      JSONArray()
    }

  companion object {
    private const val MAX_QUEUE = 200
  }
}
