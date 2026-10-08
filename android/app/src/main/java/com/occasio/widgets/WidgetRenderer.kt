package com.occasio.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews
import com.occasio.R

/** Builds the RemoteViews for each widget from the stored snapshot. */
object WidgetRenderer {

    fun nextUp(context: Context): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_next_up)
        val next = WidgetData.upcoming(WidgetStore.load(context)).firstOrNull()

        if (next == null) {
            views.setViewVisibility(R.id.content_group, android.view.View.GONE)
            views.setViewVisibility(R.id.empty_group, android.view.View.VISIBLE)
            views.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_bg_card)
            views.setOnClickPendingIntent(R.id.widget_root, WidgetLinks.open(context, WidgetLinks.ADD_PERSON))
            return views
        }

        val today = next.days == 0
        val ink = context.getColor(if (today) R.color.occasio_on_today else R.color.occasio_ink)
        val soft = context.getColor(if (today) R.color.occasio_on_today_soft else R.color.occasio_muted)
        val cta = context.getColor(if (today) R.color.occasio_on_today else R.color.occasio_accent_text)

        views.setViewVisibility(R.id.content_group, android.view.View.VISIBLE)
        views.setViewVisibility(R.id.empty_group, android.view.View.GONE)
        views.setInt(
            R.id.widget_root,
            "setBackgroundResource",
            if (today) R.drawable.widget_bg_today else R.drawable.widget_bg_card,
        )
        views.setTextViewText(R.id.avatar_letter, WidgetData.initial(next.entry.label))
        views.setInt(
            R.id.avatar_letter,
            "setBackgroundResource",
            if (next.entry.kind == "anniversary") R.drawable.widget_avatar_amber else R.drawable.widget_avatar_rose,
        )
        views.setTextViewText(R.id.title, "${next.entry.label} · ${WidgetData.kindText(next.entry.kind)}")
        views.setTextColor(R.id.title, ink)
        views.setTextViewText(R.id.days, WidgetData.daysText(next.days))
        views.setTextColor(R.id.days, ink)
        views.setTextViewText(
            R.id.date,
            if (today && next.entry.autoSend) "Auto-send is on" else WidgetData.dateText(next.date),
        )
        views.setTextColor(R.id.date, soft)
        views.setTextColor(R.id.cta, cta)
        views.setOnClickPendingIntent(
            R.id.widget_root,
            WidgetLinks.open(context, WidgetLinks.card(next.entry.id, next.entry.kind)),
        )
        return views
    }

    private val ROW_GROUPS = intArrayOf(R.id.row1, R.id.row2, R.id.row3)
    private val ROW_AVATARS = intArrayOf(R.id.row1_avatar, R.id.row2_avatar, R.id.row3_avatar)
    private val ROW_LABELS = intArrayOf(R.id.row1_label, R.id.row2_label, R.id.row3_label)
    private val ROW_DAYS = intArrayOf(R.id.row1_days, R.id.row2_days, R.id.row3_days)

    fun comingUp(context: Context): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_coming_up)
        val upcoming = WidgetData.upcoming(WidgetStore.load(context)).take(ROW_GROUPS.size)

        views.setOnClickPendingIntent(R.id.quick_wish, WidgetLinks.open(context, WidgetLinks.QUICK_CREATE))

        if (upcoming.isEmpty()) {
            views.setViewVisibility(R.id.rows_group, android.view.View.GONE)
            views.setViewVisibility(R.id.empty_group, android.view.View.VISIBLE)
            views.setOnClickPendingIntent(R.id.empty_group, WidgetLinks.open(context, WidgetLinks.ADD_PERSON))
            return views
        }

        views.setViewVisibility(R.id.rows_group, android.view.View.VISIBLE)
        views.setViewVisibility(R.id.empty_group, android.view.View.GONE)
        ROW_GROUPS.forEachIndexed { index, groupId ->
            val item = upcoming.getOrNull(index)
            if (item == null) {
                views.setViewVisibility(groupId, android.view.View.GONE)
                return@forEachIndexed
            }
            views.setViewVisibility(groupId, android.view.View.VISIBLE)
            views.setTextViewText(ROW_AVATARS[index], WidgetData.initial(item.entry.label))
            views.setInt(
                ROW_AVATARS[index],
                "setBackgroundResource",
                if (item.entry.kind == "anniversary") R.drawable.widget_avatar_amber else R.drawable.widget_avatar_rose,
            )
            views.setTextViewText(ROW_LABELS[index], "${item.entry.label} · ${WidgetData.kindText(item.entry.kind)}")
            views.setTextViewText(ROW_DAYS[index], WidgetData.daysText(item.days))
            views.setTextColor(
                ROW_DAYS[index],
                context.getColor(
                    if (item.days <= 7) R.color.occasio_accent_text else R.color.occasio_ink_soft,
                ),
            )
            views.setOnClickPendingIntent(
                groupId,
                WidgetLinks.open(context, WidgetLinks.card(item.entry.id, item.entry.kind)),
            )
        }
        return views
    }

    fun quickCreate(context: Context): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_quick_create)
        views.setOnClickPendingIntent(R.id.widget_root, WidgetLinks.open(context, WidgetLinks.QUICK_CREATE))
        return views
    }

    /** Redraw every placed widget — called after the app writes a new snapshot. */
    fun updateAll(context: Context) {
        val manager = AppWidgetManager.getInstance(context)
        fun refresh(provider: Class<*>, build: (Context) -> RemoteViews) {
            val ids = manager.getAppWidgetIds(ComponentName(context, provider))
            if (ids.isNotEmpty()) manager.updateAppWidget(ids, build(context))
        }
        refresh(NextUpWidgetProvider::class.java, ::nextUp)
        refresh(ComingUpWidgetProvider::class.java, ::comingUp)
        refresh(QuickCreateWidgetProvider::class.java, ::quickCreate)
    }
}
