package com.david.todowidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class TodoWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_TOGGLE_TASK = "com.david.todowidget.ACTION_TOGGLE_TASK"
        const val ACTION_DELETE_TASK = "com.david.todowidget.ACTION_DELETE_TASK"
        const val EXTRA_TASK_ID = "task_id"

        fun updateWidgets(context: Context, manager: AppWidgetManager, ids: IntArray) {
            for (id in ids) {
                val views = buildRemoteViews(context, id)
                manager.updateAppWidget(id, views)
            }
        }

        private fun buildRemoteViews(context: Context, widgetId: Int): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_layout)

            // Abrir a app completa ao tocar no título
            val openAppIntent = Intent(context, MainActivity::class.java)
            val openAppPending = PendingIntent.getActivity(
                context, 0, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_title, openAppPending)

            // Botão "+" abre o ecrã de adicionar tarefa
            val addIntent = Intent(context, AddTaskActivity::class.java)
            val addPending = PendingIntent.getActivity(
                context, 1, addIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_add_button, addPending)

            // Lista de tarefas (collection widget)
            val listIntent = Intent(context, TodoWidgetService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
                data = android.net.Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
            }
            views.setRemoteAdapter(R.id.widget_list, listIntent)
            views.setEmptyView(R.id.widget_list, R.id.widget_empty)

            // Template de clique para os itens da lista (toggle / apagar)
            val templateIntent = Intent(context, TodoWidgetProvider::class.java)
            val templatePending = PendingIntent.getBroadcast(
                context, 0, templateIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )
            views.setPendingIntentTemplate(R.id.widget_list, templatePending)

            return views
        }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        updateWidgets(context, appWidgetManager, appWidgetIds)
    }

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            ACTION_TOGGLE_TASK -> {
                intent.getStringExtra(EXTRA_TASK_ID)?.let { TaskStore.toggle(context, it) }
            }
            ACTION_DELETE_TASK -> {
                intent.getStringExtra(EXTRA_TASK_ID)?.let { TaskStore.delete(context, it) }
            }
            else -> super.onReceive(context, intent)
        }
    }
}
