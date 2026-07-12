package dev.ranzak.kord

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import java.net.URL
import java.util.concurrent.Executors

class MediaService : Service() {

    companion object {
        const val ACTION_UPDATE_STATE = "ACTION_UPDATE_STATE"
        const val ACTION_STOP = "ACTION_STOP"

        var webViewRef: java.lang.ref.WeakReference<android.webkit.WebView>? = null

        fun sendJsEvent(event: String) {
            val wv = webViewRef?.get()
            wv?.post {
                wv.evaluateJavascript("javascript:window.dispatchEvent(new CustomEvent('android_media_action', { detail: '$event' }));", null)
            }
        }
    }

    private lateinit var mediaSession: MediaSessionCompat
    private val CHANNEL_ID = "kord_media_channel"
    private val NOTIFICATION_ID = 1

    private var currentTitle = ""
    private var currentArtist = ""
    private var currentImageUrl = ""
    private var isCurrentlyPlaying = false
    private var currentBitmap: Bitmap? = null

    private val executorService = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())
    
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        mediaSession = MediaSessionCompat(this, "KordMediaSession").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    sendJsEvent("play")
                }
                override fun onPause() {
                    sendJsEvent("pause")
                }
                override fun onSkipToNext() {
                    sendJsEvent("next")
                }
                override fun onSkipToPrevious() {
                    sendJsEvent("prev")
                }
            })
            isActive = true
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (wakeLock == null) {
            val powerManager = getSystemService(POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Kord:MediaPlaybackWakeLock")
        }

        when (intent?.action) {
            ACTION_UPDATE_STATE -> {
                val isPlaying = intent.getBooleanExtra("IS_PLAYING", false)
                val title = intent.getStringExtra("TITLE") ?: ""
                val artist = intent.getStringExtra("ARTIST") ?: ""
                val imageUrl = intent.getStringExtra("IMAGE_URL") ?: ""

                val needsBitmapUpdate = imageUrl != currentImageUrl
                isCurrentlyPlaying = isPlaying
                currentTitle = title
                currentArtist = artist
                currentImageUrl = imageUrl

                if (isPlaying) {
                    if (wakeLock?.isHeld == false) wakeLock?.acquire()
                } else {
                    if (wakeLock?.isHeld == true) wakeLock?.release()
                }

                updatePlaybackState(isPlaying)

                // Always show notification immediately to satisfy startForeground requirements
                updateMetadata()
                showNotification()

                if (needsBitmapUpdate && imageUrl.isNotEmpty()) {
                    executorService.execute {
                        try {
                            val stream = URL(imageUrl).openStream()
                            currentBitmap = BitmapFactory.decodeStream(stream)
                            mainHandler.post {
                                updateMetadata()
                                showNotification()
                            }
                        } catch (e: Exception) {
                            currentBitmap = null
                            mainHandler.post {
                                updateMetadata()
                                showNotification()
                            }
                        }
                    }
                }
            }
            ACTION_STOP -> {
                if (wakeLock?.isHeld == true) wakeLock?.release()
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun updatePlaybackState(isPlaying: Boolean) {
        val state = if (isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
        mediaSession.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                .setActions(
                    PlaybackStateCompat.ACTION_PLAY or
                    PlaybackStateCompat.ACTION_PAUSE or
                    PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                    PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                )
                .build()
        )
    }

    private fun updateMetadata() {
        val builder = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
        
        if (currentBitmap != null) {
            builder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, currentBitmap)
        }
        
        mediaSession.setMetadata(builder.build())
    }

    private fun showNotification() {
        val playPauseAction = if (isCurrentlyPlaying) {
            NotificationCompat.Action(
                android.R.drawable.ic_media_pause, "Pause",
                androidx.media.session.MediaButtonReceiver.buildMediaButtonPendingIntent(
                    this, PlaybackStateCompat.ACTION_PAUSE
                )
            )
        } else {
            NotificationCompat.Action(
                android.R.drawable.ic_media_play, "Play",
                androidx.media.session.MediaButtonReceiver.buildMediaButtonPendingIntent(
                    this, PlaybackStateCompat.ACTION_PLAY
                )
            )
        }

        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE)

        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setStyle(
                androidx.media.app.NotificationCompat.MediaStyle()
                    .setMediaSession(mediaSession.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2)
            )
            .setColor(0xFF1E2022.toInt()) // fallback color
            .setSmallIcon(android.R.drawable.ic_media_play) // Use a built-in icon for now
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setContentIntent(pendingIntent)
            .addAction(
                android.R.drawable.ic_media_previous, "Previous",
                androidx.media.session.MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS)
            )
            .addAction(playPauseAction)
            .addAction(
                android.R.drawable.ic_media_next, "Next",
                androidx.media.session.MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_SKIP_TO_NEXT)
            )
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(isCurrentlyPlaying)

        if (currentBitmap != null) {
            notificationBuilder.setLargeIcon(currentBitmap)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID, 
                notificationBuilder.build(), 
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(NOTIFICATION_ID, notificationBuilder.build())
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Media Playback",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Controls for background music"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        mediaSession.release()
        executorService.shutdown()
    }
}
