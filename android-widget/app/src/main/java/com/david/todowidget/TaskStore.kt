package com.david.todowidget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import java.io.File

object TaskStore {
    private const val FILE_NAME = "tasks.json"

    @Synchronized
    fun load(context: Context): MutableList<Task> {
        val file = File(context.filesDir, FILE_NAME)
        if (!file.exists()) return mutableListOf()
        return Task.listFromJson(file.readText())
    }

    @Synchronized
    fun save(context: Context, tasks: List<Task>) {
        val file = File(context.filesDir, FILE_NAME)
        file.writeText(Task.listToJson(tasks))
        refreshWidgets(context)
    }

    fun add(context: Context, text: String) {
        val tasks = load(context)
        tasks.add(Task(text = text.trim()))
        save(context, tasks)
    }

    fun toggle(context: Context, id: String) {
        val tasks = load(context)
        tasks.find { it.id == id }?.let { it.done = !it.done }
        save(context, tasks)
    }

    fun delete(context: Context, id: String) {
        val tasks = load(context)
        tasks.removeAll { it.id == id }
        save(context, tasks)
    }

    fun sorted(tasks: List<Task>): List<Task> =
        tasks.sortedWith(compareBy({ it.done }, { it.createdAt }))

    private fun refreshWidgets(context: Context) {
        val manager = AppWidgetManager.getInstance(context)
        val ids = manager.getAppWidgetIds(ComponentName(context, TodoWidgetProvider::class.java))
        if (ids.isNotEmpty()) {
            manager.notifyAppWidgetViewDataChanged(ids, R.id.widget_list)
            TodoWidgetProvider.updateWidgets(context, manager, ids)
        }
    }
}
