package com.occasio.widgets

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

data class Upcoming(val entry: WidgetEntry, val date: String, val days: Int)

/**
 * Countdown maths without java.time (minSdk 24). Dates are local calendar days,
 * so both sides are turned into a whole-day count in UTC to stay DST-proof.
 */
object WidgetData {
    private const val DAY_MS = 86_400_000L

    private fun epochDay(year: Int, month: Int, day: Int): Long {
        val utc = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        utc.clear()
        utc.set(year, month - 1, day)
        return utc.timeInMillis / DAY_MS
    }

    private fun parse(iso: String): Triple<Int, Int, Int>? {
        val parts = iso.split("-")
        if (parts.size != 3) return null
        val y = parts[0].toIntOrNull() ?: return null
        val m = parts[1].toIntOrNull() ?: return null
        val d = parts[2].toIntOrNull() ?: return null
        return Triple(y, m, d)
    }

    /** Soonest first; each entry uses its first date that is today or later. */
    fun upcoming(entries: List<WidgetEntry>, now: Calendar = Calendar.getInstance()): List<Upcoming> {
        val today = epochDay(
            now.get(Calendar.YEAR),
            now.get(Calendar.MONTH) + 1,
            now.get(Calendar.DAY_OF_MONTH),
        )
        return entries
            .mapNotNull { entry ->
                entry.dates.firstNotNullOfOrNull { iso ->
                    val (y, m, d) = parse(iso) ?: return@firstNotNullOfOrNull null
                    val days = (epochDay(y, m, d) - today).toInt()
                    if (days >= 0) Upcoming(entry, iso, days) else null
                }
            }
            .sortedWith(compareBy({ it.days }, { it.entry.label }))
    }

    fun daysText(days: Int): String = when (days) {
        0 -> "Today"
        1 -> "Tomorrow"
        else -> "$days days"
    }

    fun kindText(kind: String): String = if (kind == "anniversary") "Anniversary" else "Birthday"

    fun dateText(iso: String): String {
        val (y, m, d) = parse(iso) ?: return ""
        val cal = Calendar.getInstance()
        cal.clear()
        cal.set(y, m - 1, d)
        return SimpleDateFormat("EEE, d MMM", Locale.getDefault()).format(cal.time)
    }

    /** First letter of the label, used inside the round avatar. */
    fun initial(label: String): String =
        label.trim().firstOrNull()?.uppercaseChar()?.toString() ?: ""
}
