package com.financelensmobile.capture

import android.util.Log
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

/** Posts captured payments to POST /devices/ingest, queueing them if the network or server is down. */
object CaptureUploader {
  private const val TAG = "FinanceLensCapture"

  private enum class Outcome { OK, RETRY, DROP }

  /** Blocking — call from a background thread. */
  fun submit(store: CaptureStore, body: JSONObject) {
    if (!store.isConfigured) return
    when (post(store, body)) {
      Outcome.OK -> {
        store.recordSuccess()
        flush(store)
      }
      Outcome.RETRY -> store.enqueue(body)
      Outcome.DROP -> Unit
    }
  }

  /** Retries anything queued while offline. Stops at the first failure and re-queues the rest. */
  fun flush(store: CaptureStore) {
    if (!store.isConfigured) return
    val pending = store.drainQueue()
    for ((i, body) in pending.withIndex()) {
      when (post(store, body)) {
        Outcome.OK -> store.recordSuccess()
        Outcome.DROP -> Unit
        Outcome.RETRY -> {
          pending.drop(i).forEach { store.enqueue(it) }
          return
        }
      }
    }
  }

  private fun post(store: CaptureStore, body: JSONObject): Outcome {
    var conn: HttpURLConnection? = null
    return try {
      conn = (URL("${store.baseUrl}/devices/ingest").openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        connectTimeout = 10_000
        readTimeout = 15_000
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
        setRequestProperty("X-Device-Key", store.apiKey)
      }
      conn.outputStream.use { it.write(body.toString().toByteArray()) }
      when (val code = conn.responseCode) {
        in 200..299 -> Outcome.OK
        429, in 500..599 -> {
          store.recordError("Server error ($code), will retry")
          Outcome.RETRY
        }
        401 -> {
          store.recordError("Device key rejected — it may have been revoked. Reconnect this phone.")
          Outcome.DROP
        }
        else -> {
          store.recordError("Rejected by server ($code)")
          Log.w(TAG, "ingest rejected: $code")
          Outcome.DROP
        }
      }
    } catch (e: Exception) {
      store.recordError("Can't reach server, will retry")
      Log.w(TAG, "ingest failed: ${e.message}")
      Outcome.RETRY
    } finally {
      conn?.disconnect()
    }
  }
}
