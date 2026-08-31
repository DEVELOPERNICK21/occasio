package com.occasio

import android.content.Context
import android.content.res.Configuration
import android.util.DisplayMetrics

object DisplayConfig {
  fun attachBaseContext(base: Context): Context {
    val config = Configuration(base.resources.configuration)
    config.fontScale = 1.0f
    config.densityDpi = DisplayMetrics.DENSITY_DEVICE_STABLE
    return base.createConfigurationContext(config)
  }
}
