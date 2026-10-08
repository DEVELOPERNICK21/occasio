package com.occasio.widgets

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** JS → widgets: store the snapshot and redraw. Registered as `OccasioWidgets`. */
class OccasioWidgetsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    @ReactMethod
    fun setSnapshot(json: String, promise: Promise) {
        try {
            WidgetStore.save(reactContext, json)
            WidgetRenderer.updateAll(reactContext)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("E_WIDGETS", e)
        }
    }

    @ReactMethod
    fun clear(promise: Promise) {
        try {
            WidgetStore.clear(reactContext)
            WidgetRenderer.updateAll(reactContext)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("E_WIDGETS", e)
        }
    }

    companion object {
        const val NAME = "OccasioWidgets"
    }
}
