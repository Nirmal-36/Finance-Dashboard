package com.financelensmobile.capture

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.financelensmobile.R
import kotlin.random.Random

/** JS bridge: configures the capture service and reports its status. */
class CaptureModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "FinanceLensCapture"

  private val store get() = CaptureStore(reactContext)

  @ReactMethod
  fun configure(baseUrl: String, apiKey: String, accountId: String, promise: Promise) {
    store.configure(baseUrl, apiKey, accountId)
    Thread { CaptureUploader.flush(CaptureStore(reactContext)) }.start()
    promise.resolve(null)
  }

  @ReactMethod
  fun disconnect(promise: Promise) {
    store.clear()
    promise.resolve(null)
  }

  @ReactMethod
  fun getStatus(promise: Promise) {
    val s = store
    val map: WritableMap = Arguments.createMap()
    map.putBoolean("configured", s.isConfigured)
    map.putBoolean("listenerEnabled", isListenerEnabled())
    map.putString("accountId", s.accountId)
    map.putInt("capturedCount", s.capturedCount)
    map.putInt("pendingCount", s.pendingCount)
    map.putDouble("lastCaptureAt", s.lastCaptureAt.toDouble())
    map.putString("lastError", s.lastError)
    promise.resolve(map)
  }

  @ReactMethod
  fun openListenerSettings() {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    reactContext.startActivity(intent)
  }

  /**
   * Posts a local notification worded like a UPI app's, so the whole capture
   * path can be demoed without moving real money. It is tagged so the
   * listener accepts it from this app only.
   */
  @ReactMethod
  fun sendTestPayment(promise: Promise) {
    if (Build.VERSION.SDK_INT >= 33 &&
      reactContext.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) {
      val activity = reactContext.currentActivity
      if (activity != null) activity.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1001)
      promise.reject("NO_PERMISSION", "Allow notifications for FinanceLens, then try again.")
      return
    }

    val nm = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) {
      nm.createNotificationChannel(NotificationChannel(TEST_CHANNEL, "Test payments", NotificationManager.IMPORTANCE_HIGH))
    }
    val (title, text) = SAMPLES.random().let { (merchant, amount, debit) ->
      val ref = (1..12).joinToString("") { Random.nextInt(10).toString() }
      if (debit) "Sent ₹$amount" to "Paid to $merchant. UPI Ref: $ref"
      else "Received ₹$amount" to "from $merchant. UPI Ref: $ref"
    }
    val extras = Bundle().apply { putBoolean(PaymentNotificationListener.EXTRA_TEST, true) }
    val notification = NotificationCompat.Builder(reactContext, TEST_CHANNEL)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(title)
      .setContentText(text)
      .setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_MESSAGE)
      .addExtras(extras)
      .build()
    NotificationManagerCompat.from(reactContext).notify(Random.nextInt(), notification)
    promise.resolve("$title — $text")
  }

  private fun isListenerEnabled(): Boolean {
    val flat = Settings.Secure.getString(reactContext.contentResolver, "enabled_notification_listeners") ?: return false
    val me = ComponentName(reactContext, PaymentNotificationListener::class.java)
    return flat.split(":").any { ComponentName.unflattenFromString(it) == me }
  }

  companion object {
    // v2: channel importance is fixed once created, so the switch to HIGH (heads-up pop-up) needs a new id.
    private const val TEST_CHANNEL = "financelens_test_payments_v2"

    // merchant, amount, isDebit
    private val SAMPLES = listOf(
      Triple("Swiggy", "349.00", true),
      Triple("Zomato", "512.00", true),
      Triple("Uber", "186.00", true),
      Triple("Sri Lakshmi Kirana Store", "230.00", true),
      Triple("Netflix", "649.00", true),
      Triple("Apollo Pharmacy", "420.00", true),
      Triple("Rahul Sharma", "1,000.00", true),
      Triple("Priya Nair", "750.00", false),
      Triple("Acme Technologies", "65,000.00", false),
    )
  }
}
