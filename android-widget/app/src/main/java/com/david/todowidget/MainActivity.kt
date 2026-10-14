package com.david.todowidget

import android.app.Activity
import android.os.Bundle
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.ListView

class MainActivity : Activity() {

    private lateinit var adapter: TaskAdapter
    private lateinit var input: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        input = findViewById(R.id.main_input)
        val addButton = findViewById<Button>(R.id.main_add_button)
        val listView = findViewById<ListView>(R.id.main_list)

        adapter = TaskAdapter(
            this,
            TaskStore.sorted(TaskStore.load(this)),
            onToggle = { task -> TaskStore.toggle(this, task.id); refresh() },
            onDelete = { task -> TaskStore.delete(this, task.id); refresh() }
        )
        listView.adapter = adapter

        addButton.setOnClickListener { addTaskFromInput() }
        input.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                addTaskFromInput()
                true
            } else {
                false
            }
        }
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    private fun addTaskFromInput() {
        val text = input.text.toString().trim()
        if (text.isNotEmpty()) {
            TaskStore.add(this, text)
            input.text.clear()
            refresh()
        }
    }

    private fun refresh() {
        adapter.update(TaskStore.sorted(TaskStore.load(this)))
    }
}
