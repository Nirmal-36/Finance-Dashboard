package com.financelensmobile.capture

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.util.Log
import android.service.notification.StatusBarNotification
import com.financelensmobile.BuildConfig
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.Executors
import org.json.JSONObject

/**
 * Reads payment notifications from UPI apps and forwards them to the backend
 * as device captures. Requires the user to grant "Notification access" to the
 * app in system settings — Android shows no runtime dialog for it.
 */
class PaymentNotificationListener : NotificationListenerService() {
  private val executor = Executors.newSingleThreadExecutor()

  override fun onListenerConnected() {
    // Deliver anything that queued up while we weren't running.
    val store = CaptureStore(this)
    executor.execute { CaptureUploader.flush(store) }
    // Pick up payment notifications still in the shade from before we connected.
    // The server de-duplicates, so re-sending one we already captured is harmless.
    val cutoff = System.currentTimeMillis() - RECENT_WINDOW_MS
    try {
      activeNotifications?.filter { it.postTime >= cutoff }?.forEach { handle(it) }
    } catch (_: Exception) {
      // Listener not fully bound yet; nothing to catch up on.
    }
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) = handle(sbn)

  private fun handle(sbn: StatusBarNotification) {
    if (!isCapturable(sbn)) return
    val extras = sbn.notification.extras
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
    val text = (extras.getCharSequence(Notification.EXTRA_BIG_TEXT) ?: extras.getCharSequence(Notification.EXTRA_TEXT))?.toString()
    val payment = NotificationParser.parse(title, text)
    if (payment == null) {
      // Debug builds only: lets us see real notification wording we failed to parse, to extend the parser.
      if (BuildConfig.DEBUG) Log.d(TAG, "not a payment (${sbn.packageName}): title=\"$title\" text=\"$text\"")
      return
    }

    val store = CaptureStore(this)
    if (!store.isConfigured) return

    val body = JSONObject()
      .put("account_id", store.accountId)
      .put("amount", payment.amount)
      .put("type", payment.type)
      .put("txn_timestamp", isoTimestamp(sbn.postTime))
      .put("merchant_raw", payment.merchant)
      .put("reference_id", payment.referenceId ?: JSONObject.NULL)
    executor.execute { CaptureUploader.submit(store, body) }
  }

  override fun onDestroy() {
    executor.shutdown()
    super.onDestroy()
  }

  private fun isCapturable(sbn: StatusBarNotification): Boolean {
    // Group summaries duplicate their children's content.
    if (sbn.notification.flags and Notification.FLAG_GROUP_SUMMARY != 0) return false
    return sbn.packageName in PAYMENT_APPS || sbn.packageName in SMS_APPS ||
      // Our own test notifications (see CaptureModule.sendTestPayment) and, in debug builds only,
      // `adb shell cmd notification post` (posted by the shell package).
      sbn.packageName == packageName && sbn.notification.extras.getBoolean(EXTRA_TEST, false) ||
      (BuildConfig.DEBUG && sbn.packageName == "com.android.shell")
  }

  companion object {
    private const val TAG = "FinanceLensCapture"
    const val EXTRA_TEST = "financelens_test_payment"

    private const val RECENT_WINDOW_MS = 24 * 60 * 60 * 1000L

    val PAYMENT_APPS = setOf(
      "com.phonepe.app",
      "com.google.android.apps.nbu.paisa.user", // Google Pay
      "net.one97.paytm",
      "in.org.npci.upiapp", // BHIM
      "com.dreamplug.androidapp", // CRED
      "com.snapwork.hdfc", // HDFC Bank apps
      "com.hdfcbank.android.now",
    )

    // Bank debit/credit alerts arrive as SMS, shown by the messaging app (or Truecaller).
    // The parser only accepts clearly completed payments, so other messages are ignored.
    val SMS_APPS = setOf(
      "com.google.android.apps.messaging",
      "com.samsung.android.messaging",
      "com.android.mms",
      "com.android.messaging",
      "com.oneplus.mms",
      "com.truecaller",
    )

    fun isoTimestamp(millis: Long): String =
      SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.format(Date(millis))
  }
}
