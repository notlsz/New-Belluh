package com.belluh.nativeplugin

import android.Manifest
import android.content.ContentUris
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Size
import androidx.core.content.ContextCompat
import androidx.exifinterface.media.ExifInterface
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * The photo library, read on this phone through MediaStore. Each asset comes back with what the web picker strips:
 * when it was taken (EXIF DateTimeOriginal and its offset, else MediaStore's date) and where (EXIF GPS from the
 * original, which needs ACCESS_MEDIA_LOCATION), plus a 640 px JPEG copy in this app's private cache for Belluh's
 * on-device engine. Photos and the index never leave the device.
 */
class PhotoLibrary(private val context: Context) {
    companion object {
        const val PREFS = "belluh_photos"
        const val MAX_SIDE = 640
        private const val K_NEWEST = "newest"
        private const val K_OLDEST = "oldest"
        private const val K_NOT_BEFORE = "notBefore"
        private const val K_BACKGROUND = "background"
        private val lock = Any()
    }

    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private val resolver = context.contentResolver
    private val root: File get() = File(context.cacheDir, "belluh-photos").also { File(it, "r").mkdirs() }
    private val inboxFile: File get() = File(root, "inbox.json")

    // permission

    private fun has(p: String) = ContextCompat.checkSelfPermission(context, p) == PackageManager.PERMISSION_GRANTED

    /** granted, limited (Android 14 "selected photos"), or null when not granted (the plugin tells prompt from denied) */
    fun access(): String? = when {
        Build.VERSION.SDK_INT >= 33 && has(Manifest.permission.READ_MEDIA_IMAGES) -> "granted"
        Build.VERSION.SDK_INT >= 34 && has(Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED) -> "limited"
        Build.VERSION.SDK_INT < 33 && has(Manifest.permission.READ_EXTERNAL_STORAGE) -> "granted"
        else -> null
    }
    val canRead: Boolean get() = access() != null
    private val canReadPlaces: Boolean get() = Build.VERSION.SDK_INT < 29 || has(Manifest.permission.ACCESS_MEDIA_LOCATION)

    // settings shared with the background worker

    var backgroundEnabled: Boolean
        get() = prefs.getBoolean(K_BACKGROUND, false)
        set(v) { prefs.edit().putBoolean(K_BACKGROUND, v).apply() }
    var notBefore: Long?
        get() = if (prefs.contains(K_NOT_BEFORE)) prefs.getLong(K_NOT_BEFORE, 0) else null
        set(v) { prefs.edit().apply { if (v == null) remove(K_NOT_BEFORE) else putLong(K_NOT_BEFORE, v) }.apply() }
    private val newest: Long? get() = if (prefs.contains(K_NEWEST)) prefs.getLong(K_NEWEST, 0) else null
    private val oldest: Long? get() = if (prefs.contains(K_OLDEST)) prefs.getLong(K_OLDEST, 0) else null

    fun commit(newestIn: Long?, oldestIn: Long?, ids: List<String>) = synchronized(lock) {
        prefs.edit().apply {
            if (newestIn != null) putLong(K_NEWEST, max(newestIn, newest ?: newestIn))
            if (oldestIn != null) putLong(K_OLDEST, min(oldestIn, oldest ?: oldestIn))
        }.apply()
        val gone = ids.toSet()
        val inbox = readInbox()
        val kept = inbox.filter { it.optString("id") !in gone }
        if (kept.size != inbox.size) writeInbox(kept)
        ids.forEach { renditionFile(it).delete() }
    }

    fun reset() = synchronized(lock) {
        prefs.edit().remove(K_NEWEST).remove(K_OLDEST).apply()
        root.deleteRecursively()
    }

    // reading

    /** First what the background worker prepared, then anything added since the last run, then older photos back to notBefore */
    fun nextBatch(limit: Int, notBeforeIn: Long?): JSONObject {
        val out = JSONObject()
        if (!canRead) return out.put("assets", JSONArray()).put("more", false).put("cursor", JSONObject())
        if (notBeforeIn != null) notBefore = notBeforeIn
        var inbox = readInbox()
        val kept = inbox.filter { File(it.optString("path")).exists() }
        if (kept.size != inbox.size) synchronized(lock) { writeInbox(kept) }
        inbox = kept
        if (inbox.isNotEmpty()) {
            val take = inbox.take(limit)
            val cursor = JSONObject()
            take.maxOfOrNull { it.optLong("key") }?.let { cursor.put("newest", it) }
            return out.put("assets", JSONArray(take)).put("more", true).put("cursor", cursor)
        }
        val n = newest
        var rows: List<Row> = emptyList()
        var isNew = false
        if (n != null) {
            rows = query(after = n, before = null, notBefore = null, limit = limit, ascending = true)
            isNew = rows.isNotEmpty()
        }
        if (rows.isEmpty()) {
            rows = query(after = null, before = oldest ?: (System.currentTimeMillis() + 86_400_000L), notBefore = notBefore, limit = limit, ascending = false)
        }
        val assets = JSONArray()
        rows.forEach { r -> describe(r)?.let { assets.put(it) } }
        val cursor = JSONObject()
        val maxKey = rows.maxOfOrNull { it.key }
        val minKey = rows.minOfOrNull { it.key }
        if (maxKey != null && (n == null || isNew)) cursor.put("newest", maxKey)
        if (minKey != null && !isNew) cursor.put("oldest", minKey)
        return out.put("assets", assets).put("more", rows.size == limit || isNew).put("cursor", cursor)
    }

    /** The worker's part: copies of new photos, ready for the engine the next time Belluh opens */
    fun prepareInbox(limit: Int, shouldStop: () -> Boolean): Int {
        val committed = newest
        if (!canRead || !backgroundEnabled || committed == null) return 0
        val inbox = readInbox().toMutableList()
        val after = max(committed, inbox.maxOfOrNull { it.optLong("key") } ?: committed)
        var added = 0
        for (r in query(after = after, before = null, notBefore = null, limit = limit, ascending = true)) {
            if (shouldStop()) break
            describe(r)?.let { inbox.add(it); added++ }
        }
        if (added > 0) synchronized(lock) { writeInbox(inbox) }
        return added
    }

    data class Row(val id: Long, val video: Boolean, val key: Long, val taken: Long?, val w: Int, val h: Int, val mime: String?, val folder: String?)

    private val collection: Uri = MediaStore.Files.getContentUri("external")

    private fun query(after: Long?, before: Long?, notBefore: Long?, limit: Int, ascending: Boolean): List<Row> {
        // The cursor follows DATE_ADDED (seconds), so photos saved or synced later are still found
        val sel = StringBuilder("(${MediaStore.Files.FileColumns.MEDIA_TYPE}=? OR ${MediaStore.Files.FileColumns.MEDIA_TYPE}=?)")
        val args = mutableListOf(MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(), MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString())
        if (after != null) { sel.append(" AND ${MediaStore.MediaColumns.DATE_ADDED}>?"); args.add((after / 1000).toString()) }
        if (before != null) { sel.append(" AND ${MediaStore.MediaColumns.DATE_ADDED}<?"); args.add((before / 1000).toString()) }
        if (notBefore != null) { sel.append(" AND ${MediaStore.MediaColumns.DATE_ADDED}>=?"); args.add((notBefore / 1000).toString()) }
        if (Build.VERSION.SDK_INT >= 30) sel.append(" AND ${MediaStore.MediaColumns.IS_TRASHED}=0")
        val folderCol = if (Build.VERSION.SDK_INT >= 29) MediaStore.MediaColumns.RELATIVE_PATH else MediaStore.MediaColumns.DATA
        val proj = arrayOf(
            MediaStore.MediaColumns._ID, MediaStore.Files.FileColumns.MEDIA_TYPE, MediaStore.MediaColumns.DATE_ADDED,
            MediaStore.MediaColumns.DATE_TAKEN, MediaStore.MediaColumns.WIDTH, MediaStore.MediaColumns.HEIGHT,
            MediaStore.MediaColumns.MIME_TYPE, folderCol,
        )
        val order = "${MediaStore.MediaColumns.DATE_ADDED} ${if (ascending) "ASC" else "DESC"}, ${MediaStore.MediaColumns._ID} ${if (ascending) "ASC" else "DESC"}"
        val rows = ArrayList<Row>()
        resolver.query(collection, proj, sel.toString(), args.toTypedArray(), order)?.use { c ->
            while (c.moveToNext() && rows.size < limit) {
                val added = c.getLong(2) * 1000
                val taken = if (c.isNull(3)) null else c.getLong(3).takeIf { it > 0 }
                rows.add(Row(c.getLong(0), c.getInt(1) == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO, added, taken, c.getInt(4), c.getInt(5), c.getString(6), c.getString(7)))
            }
        }
        return rows
    }

    private fun uriOf(r: Row): Uri = ContentUris.withAppendedId(
        if (r.video) MediaStore.Video.Media.EXTERNAL_CONTENT_URI else MediaStore.Images.Media.EXTERNAL_CONTENT_URI, r.id)

    private fun renditionFile(id: String) = File(File(root, "r"), "${id.replace(Regex("[^A-Za-z0-9_-]"), "_")}.jpg")

    fun describe(r: Row): JSONObject? {
        val uri = uriOf(r)
        val id = "${if (r.video) "v" else "i"}${r.id}"
        val file = render(uri, r, id) ?: return null
        val screenshot = !r.video && (r.folder ?: "").contains("screenshot", ignoreCase = true)
        val o = JSONObject()
            .put("id", id)
            .put("key", r.key)
            .put("createdAt", r.taken ?: r.key)
            .put("mediaType", if (r.video) "video" else if (screenshot) "screenshot" else "photo")
            .put("width", r.w)
            .put("height", r.h)
            .put("path", file.absolutePath)
        if (r.video) videoPlace(uri)?.let { (lat, lng) -> o.put("lat", lat).put("lng", lng) }
        else exif(uri)?.let { x ->
            x.taken?.let { o.put("taken", it) }
            x.offset?.let { o.put("offset", it) }
            x.lat?.let { o.put("lat", it) }
            x.lng?.let { o.put("lng", it) }
        }
        return o
    }

    private fun render(uri: Uri, r: Row, id: String): File? {
        val f = renditionFile(id)
        if (f.exists()) return f
        val bmp: Bitmap = try {
            if (Build.VERSION.SDK_INT >= 29) resolver.loadThumbnail(uri, Size(MAX_SIDE, MAX_SIDE), null)
            else if (r.video) {
                @Suppress("DEPRECATION")
                MediaStore.Video.Thumbnails.getThumbnail(resolver, r.id, MediaStore.Video.Thumbnails.MINI_KIND, null) ?: return null
            } else decodeScaled(uri) ?: return null
        } catch (e: Exception) { return null }
        return try {
            val s = min(1.0, MAX_SIDE.toDouble() / max(bmp.width, bmp.height))
            val out = if (s < 1.0) Bitmap.createScaledBitmap(bmp, max(1, (bmp.width * s).roundToInt()), max(1, (bmp.height * s).roundToInt()), true) else bmp
            FileOutputStream(f).use { out.compress(Bitmap.CompressFormat.JPEG, 85, it) }
            if (out !== bmp) out.recycle()
            bmp.recycle()
            f
        } catch (e: Exception) { f.delete(); null }
    }

    private fun decodeScaled(uri: Uri): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= MAX_SIDE) sample *= 2
        return resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample }) }
    }

    data class Exif(val taken: String?, val offset: String?, val lat: Double?, val lng: Double?)

    private fun exif(uri: Uri): Exif? = try {
        // The original, not the redacted copy: only with ACCESS_MEDIA_LOCATION does Android leave GPS in
        val src = if (Build.VERSION.SDK_INT >= 29 && canReadPlaces) MediaStore.setRequireOriginal(uri) else uri
        resolver.openInputStream(src)?.use { s ->
            val x = ExifInterface(s)
            val ll = x.latLong
            val ok = ll != null && !(ll[0] == 0.0 && ll[1] == 0.0)
            Exif(
                x.getAttribute(ExifInterface.TAG_DATETIME_ORIGINAL) ?: x.getAttribute(ExifInterface.TAG_DATETIME_DIGITIZED),
                x.getAttribute(ExifInterface.TAG_OFFSET_TIME_ORIGINAL) ?: x.getAttribute(ExifInterface.TAG_OFFSET_TIME),
                if (ok) ll!![0] else null, if (ok) ll!![1] else null,
            )
        }
    } catch (e: Exception) { null }

    /** Videos keep their place as ISO 6709 ("+37.7749-122.4194/") */
    private fun videoPlace(uri: Uri): Pair<Double, Double>? {
        if (!canReadPlaces) return null
        val m = MediaMetadataRetriever()
        return try {
            m.setDataSource(context, if (Build.VERSION.SDK_INT >= 29) MediaStore.setRequireOriginal(uri) else uri)
            val loc = m.extractMetadata(MediaMetadataRetriever.METADATA_KEY_LOCATION) ?: return null
            val g = Regex("^([+-]\\d+(?:\\.\\d+)?)([+-]\\d+(?:\\.\\d+)?)").find(loc) ?: return null
            val lat = g.groupValues[1].toDouble(); val lng = g.groupValues[2].toDouble()
            if (lat == 0.0 && lng == 0.0) null else lat to lng
        } catch (e: Exception) { null } finally { try { m.release() } catch (_: Exception) {} }
    }

    private fun readInbox(): List<JSONObject> = try {
        if (!inboxFile.exists()) emptyList() else JSONArray(inboxFile.readText()).let { a -> (0 until a.length()).map { a.getJSONObject(it) } }
    } catch (e: Exception) { emptyList() }

    private fun writeInbox(list: List<JSONObject>) {
        if (list.isEmpty()) { inboxFile.delete(); return }
        val tmp = File(root, "inbox.json.tmp")
        tmp.writeText(JSONArray(list).toString())
        tmp.renameTo(inboxFile)
    }
}
