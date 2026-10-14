package com.david.todowidget

import android.content.Context
import java.io.File

object SimpleTaskStore {
    private const val FILE_NAME = "tasks.json"

    @Synchronized
    fun load(context: Context): String {
        val file = File(context.filesDir, FILE_NAME)
        if (!file.exists()) return "[]"
        return file.readText()
    }

    @Synchronized
    fun save(context: Context, tasksJson: String) {
        File(context.filesDir, FILE_NAME).writeText(tasksJson)
    }
}
