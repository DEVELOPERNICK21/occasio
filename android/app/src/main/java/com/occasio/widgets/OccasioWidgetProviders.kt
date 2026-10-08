package com.occasio.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

/**
 * Shared behaviour: draw on every system update, and redraw when the day, time
 * or time zone changes so "3 days" becomes "2 days" without the app opening.
 */
abstract class OccasioWidgetProvider : AppWidgetProvider() {
    abstract fun build(context: Context): RemoteViews

    override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
        manager.updateAppWidget(appWidgetIds, build(context))
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            Intent.ACTION_DATE_CHANGED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED -> {
                val manager = AppWidgetManager.getInstance(context)
                val ids = manager.getAppWidgetIds(android.content.ComponentName(context, this::class.java))
                if (ids.isNotEmpty()) manager.updateAppWidget(ids, build(context))
            }
        }
    }
}

class NextUpWidgetProvider : OccasioWidgetProvider() {
    override fun build(context: Context): RemoteViews = WidgetRenderer.nextUp(context)
}

class ComingUpWidgetProvider : OccasioWidgetProvider() {
    override fun build(context: Context): RemoteViews = WidgetRenderer.comingUp(context)
}

class QuickCreateWidgetProvider : OccasioWidgetProvider() {
    override fun build(context: Context): RemoteViews = WidgetRenderer.quickCreate(context)
}
