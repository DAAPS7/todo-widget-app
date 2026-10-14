package com.david.todowidget

import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

data class Task(
    val id: String = UUID.randomUUID().toString(),
    var text: String,
    var done: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("id", id)
        put("text", text)
        put("done", done)
        put("createdAt", createdAt)
    }

    companion object {
        fun fromJson(obj: JSONObject): Task = Task(
            id = obj.getString("id"),
            text = obj.getString("text"),
            done = obj.optBoolean("done", false),
            createdAt = obj.optLong("createdAt", System.currentTimeMillis())
        )

        fun listToJson(tasks: List<Task>): String {
            val array = JSONArray()
            tasks.forEach { array.put(it.toJson()) }
            return array.toString()
        }

        fun listFromJson(json: String): MutableList<Task> {
            val result = mutableListOf<Task>()
            if (json.isBlank()) return result
            val array = JSONArray(json)
            for (i in 0 until array.length()) {
                result.add(fromJson(array.getJSONObject(i)))
            }
            return result
        }
    }
}
