package com.david.todowidget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.view.View

class WidgetConfigureActivity : Activity() {

    private var widgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setResult(RESULT_CANCELED)
        setContentView(R.layout.activity_widget_configure)

        widgetId = intent.getIntExtra(
            AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID
        )
        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        val swatches = listOf(
            R.id.swatch_red to 0xFFFF3B30.toInt(),
            R.id.swatch_blue to 0xFF0A84FF.toInt(),
            R.id.swatch_green to 0xFF30D158.toInt(),
            R.id.swatch_orange to 0xFFFF9F0A.toInt(),
            R.id.swatch_purple to 0xFFBF5AF2.toInt()
        )
        swatches.forEach { (viewId, color) ->
            findViewById<View>(viewId).setOnClickListener { confirm(color) }
        }
    }

    private fun confirm(color: Int) {
        WidgetPrefs.setAccent(this, widgetId, color)

        val manager = AppWidgetManager.getInstance(this)
        TodoWidgetProvider.updateWidgets(this, manager, intArrayOf(widgetId))
        manager.notifyAppWidgetViewDataChanged(intArrayOf(widgetId), R.id.widget_list)

        val resultValue = Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
        setResult(RESULT_OK, resultValue)
        finish()
    }
}
