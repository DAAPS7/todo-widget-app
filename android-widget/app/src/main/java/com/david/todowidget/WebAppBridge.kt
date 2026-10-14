package com.david.todowidget

import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject
import java.util.concurrent.Executors

class WebAppBridge(
    private val service: OverlayService,
    private val webView: WebView
) {
    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun call(method: String, argJson: String?, requestId: Int) {
        executor.execute {
            val resultJson = try {
                handle(method, argJson)
            } catch (e: Exception) {
                null
            }
            mainHandler.post {
                val literal = if (resultJson == null) "null" else JSONObject.quote(resultJson)
                webView.evaluateJavascript("window.__apiResolve($requestId, $literal)", null)
            }
        }
    }

    private fun handle(method: String, argJson: String?): String? = when (method) {
        "loadTasks" -> SimpleTaskStore.load(service)
        "saveTasks" -> {
            SimpleTaskStore.save(service, argJson ?: "[]")
            null
        }
        "quit" -> {
            mainHandler.post { service.requestStop() }
            null
        }
        "getPosition" -> JSONObject.quote(OverlayPrefs.getPosition(service))
        "setPosition" -> {
            val position = argJson?.trim('"') ?: OverlayPrefs.DEFAULT_POSITION
            OverlayPrefs.setPosition(service, position)
            mainHandler.post { service.applyLayout() }
            JSONObject.quote(OverlayPrefs.getPosition(service))
        }
        "getCompact" -> OverlayPrefs.getCompact(service).toString()
        "setCompact" -> {
            val compact = argJson?.trim() == "true"
            OverlayPrefs.setCompact(service, compact)
            mainHandler.post { service.applyLayout() }
            OverlayPrefs.getCompact(service).toString()
        }
        "getGoogleStatus", "connectGoogle", "disconnectGoogle" ->
            JSONObject().put("available", false).put("connected", false).toString()
        else -> null
    }
}
