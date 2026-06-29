package dev.ranzak.kord

import android.os.Bundle
import android.content.Intent
import android.util.Log
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    val url = intent?.data?.toString()
    if (url != null) {
    }

    if (android.os.Build.VERSION.SDK_INT >= 33) {
        if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            androidx.core.app.ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 101)
        }
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    val url = intent.data?.toString()
    if (url != null) {
      val root = window.decorView.rootView
      val webView = findWebView(root)
      if (webView != null) {
        val js = "javascript:window.dispatchEvent(new CustomEvent('android_intent', { detail: '${url}' }));"
        webView.post {
            webView.evaluateJavascript(js, null)
        }
      }
    }
  }

  private var isInterfaceAdded = false

  override fun onResume() {
      super.onResume()
      if (!isInterfaceAdded) {
          val root = window.decorView.rootView
          val webView = findWebView(root)
          if (webView != null) {
              webView.addJavascriptInterface(MediaInterface(this), "AndroidMedia")
              MediaService.webViewRef = java.lang.ref.WeakReference(webView)
              isInterfaceAdded = true
          }
      }
  }

  private fun findWebView(view: android.view.View): android.webkit.WebView? {
      if (view is android.webkit.WebView) return view
      if (view is android.view.ViewGroup) {
          for (i in 0 until view.childCount) {
              val child = view.getChildAt(i)
              val wv = findWebView(child)
              if (wv != null) return wv
          }
      }
      return null
  }

  class MediaInterface(private val context: android.content.Context) {
      @android.webkit.JavascriptInterface
      fun updateState(isPlaying: Boolean, title: String, artist: String, imageUrl: String) {
          val intent = Intent(context, MediaService::class.java).apply {
              action = MediaService.ACTION_UPDATE_STATE
              putExtra("IS_PLAYING", isPlaying)
              putExtra("TITLE", title)
              putExtra("ARTIST", artist)
              putExtra("IMAGE_URL", imageUrl)
          }
          if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
              context.startForegroundService(intent)
          } else {
              context.startService(intent)
          }
      }

      @android.webkit.JavascriptInterface
      fun stopService() {
          val intent = Intent(context, MediaService::class.java).apply {
              action = MediaService.ACTION_STOP
          }
          if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
              context.startForegroundService(intent)
          } else {
              context.startService(intent)
          }
      }
  }
}
