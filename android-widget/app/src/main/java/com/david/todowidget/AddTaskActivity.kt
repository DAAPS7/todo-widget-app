package com.david.todowidget

import android.os.Bundle
import android.app.Activity
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText

class AddTaskActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_add_task)

        val input = findViewById<EditText>(R.id.add_task_input)
        val confirmButton = findViewById<Button>(R.id.add_task_confirm)
        val cancelButton = findViewById<Button>(R.id.add_task_cancel)

        input.requestFocus()

        confirmButton.setOnClickListener {
            val text = input.text.toString().trim()
            if (text.isNotEmpty()) {
                TaskStore.add(this, text)
            }
            finish()
        }

        cancelButton.setOnClickListener { finish() }
    }

    override fun onPause() {
        super.onPause()
        val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
        imm.hideSoftInputFromWindow(currentFocus?.windowToken, 0)
    }
}
