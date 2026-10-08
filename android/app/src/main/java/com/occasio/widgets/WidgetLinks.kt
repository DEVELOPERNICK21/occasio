package com.occasio.widgets

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri

/**
 * Deep links the widgets open. Keep in sync with
 * `src/features/widgets/domain/widgetLinks.ts` (the contract) and the iOS copy.
 */
object WidgetLinks {
    const val QUICK_CREATE = "occasio://create/quick"
    const val VAULT = "occasio://vault"
    const val ADD_PERSON = "occasio://vault/add"

    fun card(personId: String, kind: String): String =
        "occasio://card/new?person=${Uri.encode(personId)}&occasion=$kind"

    fun open(context: Context, url: String): PendingIntent {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            setPackage(context.packageName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        return PendingIntent.getActivity(
            context,
            url.hashCode(),
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    }
}
