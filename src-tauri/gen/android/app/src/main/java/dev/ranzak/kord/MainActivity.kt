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
}
