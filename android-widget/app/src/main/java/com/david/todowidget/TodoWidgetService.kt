package com.david.todowidget

import android.appwidget.AppWidgetManager
import android.content.Intent
import android.widget.RemoteViewsService

class TodoWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        val widgetId = intent.getIntExtra(
            AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID
        )
        return TodoWidgetViewsFactory(applicationContext, widgetId)
    }
}
