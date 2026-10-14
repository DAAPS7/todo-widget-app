package com.david.todowidget

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.WindowManager
import android.webkit.WebView

class OverlayService : Service() {

    companion object {
        const val ACTION_STOP = "com.david.todowidget.ACTION_STOP_OVERLAY"
        private const val CHANNEL_ID = "overlay_channel"
        private const val NOTIF_ID = 1

        private const val WIDTH_DP = 330f
        private const val HEIGHT_DP = 520f
        private const val COMPACT_HEIGHT_DP = 300f
        private const val MARGIN_DP = 24f
        private const val TOP_OFFSET_DP = 48f

        var isRunning: Boolean = false
    }

    private var windowManager: WindowManager? = null
    private var webView: WebView? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            requestStop()
            return START_NOT_STICKY
        }

        if (!Settings.canDrawOverlays(this)) {
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(NOTIF_ID, buildNotification())

        if (webView == null) {
            setupOverlay()
        }
        isRunning = true

        return START_STICKY
    }

    private fun setupOverlay() {
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        val view = WebView(this)
        view.settings.javaScriptEnabled = true
        view.settings.domStorageEnabled = true
        view.addJavascriptInterface(WebAppBridge(this, view), "AndroidBridge")
        view.loadUrl("file:///android_asset/web/index.html")
        webView = view

        windowManager?.addView(view, buildLayoutParams())
    }

    fun applyLayout() {
        val view = webView ?: return
        windowManager?.updateViewLayout(view, buildLayoutParams())
    }

    private fun buildLayoutParams(): WindowManager.LayoutParams {
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager?.defaultDisplay?.getMetrics(metrics)
        val density = metrics.density

        val position = OverlayPrefs.getPosition(this)
        val compact = OverlayPrefs.getCompact(this)

        val width = (WIDTH_DP * density).toInt()
        val height = ((if (compact) COMPACT_HEIGHT_DP else HEIGHT_DP) * density).toInt()
        val margin = (MARGIN_DP * density).toInt()
        val topOffset = (TOP_OFFSET_DP * density).toInt()

        val row = when {
            position.startsWith("top") -> 0
            position.startsWith("bottom") -> 2
            else -> 1
        }
        val col = when {
            position.endsWith("left") -> 0
            position.endsWith("right") -> 2
            else -> 1
        }

        val x = intArrayOf(
            margin,
            (metrics.widthPixels - width) / 2,
            metrics.widthPixels - width - margin
        )[col]

        val y = intArrayOf(
            topOffset,
            (metrics.heightPixels - height) / 2,
            metrics.heightPixels - height - margin
        )[row]

        val overlayType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY

        return WindowManager.LayoutParams(
            width,
            height,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            this.x = x
            this.y = y
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }
    }

    fun requestStop() {
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        webView?.let { windowManager?.removeView(it) }
        webView?.destroy()
        webView = null
        isRunning = false
        super.onDestroy()
    }

    private fun buildNotification(): Notification {
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, getString(R.string.app_name), NotificationManager.IMPORTANCE_MIN
            )
            manager.createNotificationChannel(channel)
        }

        val stopIntent = Intent(this, OverlayService::class.java).setAction(ACTION_STOP)
        val stopPending = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.overlay_running))
            .setSmallIcon(R.drawable.ic_add)
            .setOngoing(true)
            .addAction(0, getString(R.string.cancel), stopPending)
            .build()
    }
}
