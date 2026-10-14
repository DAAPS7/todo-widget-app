package com.david.todowidget

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView

class MainActivity : Activity() {

    private lateinit var statusText: TextView
    private lateinit var actionButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        statusText = findViewById(R.id.main_status)
        actionButton = findViewById(R.id.main_action_button)
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    private fun refresh() {
        if (!Settings.canDrawOverlays(this)) {
            statusText.text = getString(R.string.permission_explanation)
            actionButton.text = getString(R.string.grant_permission)
            actionButton.setOnClickListener {
                startActivity(
                    Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                )
            }
            return
        }

        statusText.text = ""
        if (OverlayService.isRunning) {
            actionButton.text = getString(R.string.stop_widget)
            actionButton.setOnClickListener {
                startService(Intent(this, OverlayService::class.java).setAction(OverlayService.ACTION_STOP))
                refresh()
            }
        } else {
            actionButton.text = getString(R.string.start_widget)
            actionButton.setOnClickListener {
                startForegroundService(Intent(this, OverlayService::class.java))
                finish()
            }
        }
    }
}
