package com.david.todowidget

import android.content.Context
import android.content.Intent
import android.graphics.Paint
import android.widget.RemoteViews
import android.widget.RemoteViewsService.RemoteViewsFactory

class TodoWidgetViewsFactory(
    private val context: Context,
    private val widgetId: Int
) : RemoteViewsFactory {

    private var tasks: List<Task> = emptyList()

    override fun onCreate() {
        tasks = TaskStore.sorted(TaskStore.load(context))
    }

    override fun onDataSetChanged() {
        tasks = TaskStore.sorted(TaskStore.load(context))
    }

    override fun onDestroy() {
        tasks = emptyList()
    }

    override fun getCount(): Int = tasks.size

    override fun getViewAt(position: Int): RemoteViews {
        val task = tasks[position]
        val views = RemoteViews(context.packageName, R.layout.widget_item)

        views.setTextViewText(R.id.item_text, task.text)
        views.setInt(
            R.id.item_text, "setPaintFlags",
            if (task.done) Paint.STRIKE_THRU_TEXT_FLAG else 0
        )
        views.setInt(
            R.id.item_circle, "setImageResource",
            if (task.done) R.drawable.circle_checked else R.drawable.circle_unchecked
        )
        if (task.done) {
            views.setInt(R.id.item_circle, "setColorFilter", WidgetPrefs.getAccent(context, widgetId))
        }

        val toggleFillIn = Intent().apply {
            action = TodoWidgetProvider.ACTION_TOGGLE_TASK
            putExtra(TodoWidgetProvider.EXTRA_TASK_ID, task.id)
        }
        views.setOnClickFillInIntent(R.id.item_circle, toggleFillIn)
        views.setOnClickFillInIntent(R.id.item_text, toggleFillIn)

        val deleteFillIn = Intent().apply {
            action = TodoWidgetProvider.ACTION_DELETE_TASK
            putExtra(TodoWidgetProvider.EXTRA_TASK_ID, task.id)
        }
        views.setOnClickFillInIntent(R.id.item_delete, deleteFillIn)

        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = tasks[position].id.hashCode().toLong()
    override fun hasStableIds(): Boolean = true
}
