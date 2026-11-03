package com.belluh.nativeplugin

import android.content.Context
import android.provider.MediaStore
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/**
 * Background indexing on Android, after Rollup: WorkManager prepares new photos (dates, places, 640 px copies) when
 * new ones appear in MediaStore and every few hours, while the battery is not low. The image model runs in the
 * WebView, so understanding them happens the next time Belluh opens, at once instead of photo by photo.
 */
class PhotoWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val lib = PhotoLibrary(applicationContext)
        if (!lib.backgroundEnabled) return Result.success()
        lib.prepareInbox(300) { isStopped }
        // Content-URI triggers fire once; ask again for the next new photo
        if (tags.contains(TRIGGER)) enqueueOnNewMedia(applicationContext, ExistingWorkPolicy.APPEND_OR_REPLACE)
        return Result.success()
    }

    companion object {
        private const val PERIODIC = "belluh-photos-periodic"
        private const val TRIGGER = "belluh-photos-new-media"

        fun schedule(context: Context) {
            val wm = WorkManager.getInstance(context)
            val periodic = PeriodicWorkRequestBuilder<PhotoWorker>(6, TimeUnit.HOURS)
                .setConstraints(Constraints.Builder().setRequiresBatteryNotLow(true).build())
                .build()
            wm.enqueueUniquePeriodicWork(PERIODIC, ExistingPeriodicWorkPolicy.KEEP, periodic)
            enqueueOnNewMedia(context, ExistingWorkPolicy.KEEP)
        }

        private fun enqueueOnNewMedia(context: Context, policy: ExistingWorkPolicy) {
            val c = Constraints.Builder()
                .setRequiresBatteryNotLow(true)
                .addContentUriTrigger(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true)
                .addContentUriTrigger(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, true)
                .setTriggerContentUpdateDelay(2, TimeUnit.MINUTES)
                .build()
            val req = OneTimeWorkRequestBuilder<PhotoWorker>().setConstraints(c).addTag(TRIGGER).build()
            WorkManager.getInstance(context).enqueueUniqueWork(TRIGGER, policy, req)
        }

        fun cancel(context: Context) {
            val wm = WorkManager.getInstance(context)
            wm.cancelUniqueWork(PERIODIC)
            wm.cancelUniqueWork(TRIGGER)
        }
    }
}
