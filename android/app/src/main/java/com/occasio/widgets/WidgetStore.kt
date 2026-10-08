package com.occasio.widgets

import android.content.Context
import org.json.JSONObject

/** One upcoming birthday or anniversary, exactly as the app wrote it. No names. */
data class WidgetEntry(
    val id: String,
    /** Relationship label, e.g. "Mom". Never the person's name. */
    val label: String,
    /** "birthday" or "anniversary". */
    val kind: String,
    /** Next occurrences as local `yyyy-MM-dd`, soonest first. */
    val dates: List<String>,
    val autoSend: Boolean,
)

/** Snapshot storage shared between the React Native bridge and the widgets. */
object WidgetStore {
    private const val PREFS = "occasio_widgets"
    private const val KEY = "snapshot_v1"

    fun save(context: Context, json: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply()
    }

    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY).apply()
    }

    /** Empty when nothing is stored, the user signed out, or the data is unreadable. */
    fun load(context: Context): List<WidgetEntry> {
        val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
            ?: return emptyList()
        return try {
            val root = JSONObject(raw)
            if (!root.optBoolean("signedIn", false)) return emptyList()
            val array = root.optJSONArray("entries") ?: return emptyList()
            (0 until array.length()).mapNotNull { index ->
                val item = array.optJSONObject(index) ?: return@mapNotNull null
                val datesJson = item.optJSONArray("dates") ?: return@mapNotNull null
                val dates = (0 until datesJson.length()).map { datesJson.getString(it) }
                val id = item.optString("id")
                val label = item.optString("label")
                if (id.isEmpty() || label.isEmpty() || dates.isEmpty()) return@mapNotNull null
                WidgetEntry(
                    id = id,
                    label = label,
                    kind = item.optString("kind", "birthday"),
                    dates = dates,
                    autoSend = item.optBoolean("autoSend", false),
                )
            }
        } catch (_: Exception) {
            emptyList()
        }
    }
}
