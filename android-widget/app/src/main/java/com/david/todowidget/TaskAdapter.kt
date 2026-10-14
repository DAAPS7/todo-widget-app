package com.david.todowidget

import android.content.Context
import android.graphics.Paint
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.ImageView
import android.widget.TextView

class TaskAdapter(
    private val context: Context,
    private var tasks: List<Task>,
    private val onToggle: (Task) -> Unit,
    private val onDelete: (Task) -> Unit
) : BaseAdapter() {

    fun update(newTasks: List<Task>) {
        tasks = newTasks
        notifyDataSetChanged()
    }

    override fun getCount(): Int = tasks.size
    override fun getItem(position: Int): Task = tasks[position]
    override fun getItemId(position: Int): Long = position.toLong()

    override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
        val view = convertView ?: LayoutInflater.from(context).inflate(R.layout.widget_item, parent, false)
        val task = tasks[position]

        val circle = view.findViewById<ImageView>(R.id.item_circle)
        val text = view.findViewById<TextView>(R.id.item_text)
        val delete = view.findViewById<ImageView>(R.id.item_delete)

        text.text = task.text
        text.paintFlags = if (task.done) {
            text.paintFlags or Paint.STRIKE_THRU_TEXT_FLAG
        } else {
            text.paintFlags and Paint.STRIKE_THRU_TEXT_FLAG.inv()
        }
        circle.setImageResource(if (task.done) R.drawable.circle_checked else R.drawable.circle_unchecked)

        circle.setOnClickListener { onToggle(task) }
        text.setOnClickListener { onToggle(task) }
        delete.setOnClickListener { onDelete(task) }

        return view
    }
}
