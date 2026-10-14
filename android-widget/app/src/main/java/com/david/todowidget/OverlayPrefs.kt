package com.david.todowidget

import android.content.Context

object OverlayPrefs {
    private const val PREFS_NAME = "overlay_prefs"
    private const val KEY_POSITION = "position"
    private const val KEY_COMPACT = "compact"

    val POSITIONS = listOf(
        "top-left", "top-center", "top-right",
        "middle-left", "middle-center", "middle-right",
        "bottom-left", "bottom-center", "bottom-right"
    )
    const val DEFAULT_POSITION = "top-right"

    fun getPosition(context: Context): String {
        val saved = prefs(context).getString(KEY_POSITION, DEFAULT_POSITION)
        return if (saved in POSITIONS) saved!! else DEFAULT_POSITION
    }

    fun setPosition(context: Context, position: String) {
        if (position !in POSITIONS) return
        prefs(context).edit().putString(KEY_POSITION, position).apply()
    }

    fun getCompact(context: Context): Boolean = prefs(context).getBoolean(KEY_COMPACT, false)

    fun setCompact(context: Context, compact: Boolean) {
        prefs(context).edit().putBoolean(KEY_COMPACT, compact).apply()
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}
