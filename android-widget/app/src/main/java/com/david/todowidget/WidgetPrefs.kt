package com.david.todowidget

import android.content.Context

object WidgetPrefs {
    private const val PREFS_NAME = "widget_prefs"
    private const val KEY_PREFIX = "accent_"

    fun getAccent(context: Context, widgetId: Int): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getInt(KEY_PREFIX + widgetId, context.getColor(R.color.accent))
    }

    fun setAccent(context: Context, widgetId: Int, color: Int) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
            .putInt(KEY_PREFIX + widgetId, color)
            .apply()
    }

    fun remove(context: Context, widgetId: Int) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
            .remove(KEY_PREFIX + widgetId)
            .apply()
    }
}
