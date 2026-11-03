package com.belluh.nativeplugin

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.webkit.MimeTypeMap
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.io.File
import java.util.UUID
import java.util.concurrent.Executors

/**
 * "BelluhPhotos" for the web code (src/lib/native/photos.ts): the photo library with real dates and places, read on
 * the device; background preparation of new photos (WorkManager); and Share to Belluh (images shared from Photos,
 * Chrome or any app arrive as files in this app's cache).
 */
@CapacitorPlugin(
    name = "BelluhPhotos",
    permissions = [
        Permission(alias = "photos", strings = [Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO]),
        Permission(alias = "selected", strings = [Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED]),
        Permission(alias = "legacy", strings = [Manifest.permission.READ_EXTERNAL_STORAGE]),
        Permission(alias = "places", strings = [Manifest.permission.ACCESS_MEDIA_LOCATION]),
    ],
)
class BelluhPhotosPlugin : Plugin() {
    private val io = Executors.newSingleThreadExecutor()
    private lateinit var lib: PhotoLibrary
    private var pendingShared: JSArray? = null

    override fun load() {
        lib = PhotoLibrary(context)
        activity?.intent?.let { takeShared(it) }?.let { pendingShared = it }
    }

    override fun handleOnNewIntent(intent: Intent) {
        super.handleOnNewIntent(intent)
        takeShared(intent)?.let { files ->
            pendingShared = files
            notifyListeners("shared", JSObject().put("files", files), true)
        }
    }

    private fun mainAlias() = if (Build.VERSION.SDK_INT >= 33) "photos" else "legacy"

    private fun status(): JSObject {
        val a = lib.access()
        val s = a ?: if (getPermissionState(mainAlias()) == PermissionState.DENIED) "denied" else "prompt"
        return JSObject().put("photos", s)
    }

    @PluginMethod
    override fun checkPermissions(call: PluginCall) { call.resolve(status()) }

    @PluginMethod
    override fun requestPermissions(call: PluginCall) {
        val aliases = when {
            Build.VERSION.SDK_INT >= 34 -> arrayOf("photos", "selected", "places")
            Build.VERSION.SDK_INT >= 33 -> arrayOf("photos", "places")
            Build.VERSION.SDK_INT >= 29 -> arrayOf("legacy", "places")
            else -> arrayOf("legacy")
        }
        requestPermissionForAliases(aliases, call, "permissionsDone")
    }

    @PermissionCallback
    private fun permissionsDone(call: PluginCall) { call.resolve(status()) }

    /** Android 14's "selected photos": asking again lets the person change the selection */
    @PluginMethod
    fun manageLimited(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= 34 && lib.access() == "limited") requestPermissionForAliases(arrayOf("photos", "selected"), call, "permissionsDone")
        else call.resolve(status())
    }

    /** Photo access was turned off: Belluh's page in Settings, where the person can turn it back on */
    @PluginMethod
    fun openSettings(call: PluginCall) {
        val i = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", context.packageName, null))
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(i)
        call.resolve()
    }

    @PluginMethod
    fun nextBatch(call: PluginCall) {
        val limit = (call.getInt("limit") ?: 60).coerceIn(1, 200)
        val notBefore = call.getDouble("notBefore")?.toLong()
        io.execute {
            try { call.resolve(JSObject.fromJSONObject(lib.nextBatch(limit, notBefore))) } catch (e: Exception) { call.reject(e.message ?: "read failed") }
        }
    }

    @PluginMethod
    fun commit(call: PluginCall) {
        val c = call.getObject("cursor") ?: JSObject()
        val ids = call.getArray("ids")?.toList<String>() ?: emptyList()
        val newest = if (c.has("newest")) c.getDouble("newest").toLong() else null
        val oldest = if (c.has("oldest")) c.getDouble("oldest").toLong() else null
        io.execute { lib.commit(newest, oldest, ids); call.resolve() }
    }

    @PluginMethod
    fun setBackground(call: PluginCall) {
        lib.backgroundEnabled = call.getBoolean("enabled") ?: false
        call.getDouble("notBefore")?.let { lib.notBefore = it.toLong() }
        if (lib.backgroundEnabled) PhotoWorker.schedule(context) else PhotoWorker.cancel(context)
        call.resolve(JSObject().put("enabled", lib.backgroundEnabled))
    }

    @PluginMethod
    fun reset(call: PluginCall) {
        lib.backgroundEnabled = false
        PhotoWorker.cancel(context)
        io.execute { lib.reset(); call.resolve() }
    }

    /** FCM works only in a build with google-services.json; without it, asking for a token would crash the app */
    @PluginMethod
    fun pushReady(call: PluginCall) {
        val id = context.resources.getIdentifier("google_app_id", "string", context.packageName)
        call.resolve(JSObject().put("ready", id != 0))
    }

    /** Images shared to Belluh before the page was ready to listen */
    @PluginMethod
    fun getShared(call: PluginCall) {
        call.resolve(JSObject().put("files", pendingShared ?: JSArray()))
        pendingShared = null
    }

    /** Copies images shared to Belluh into this app's cache; the originals stay where they were */
    private fun takeShared(intent: Intent): JSArray? {
        val action = intent.action
        if (action != Intent.ACTION_SEND && action != Intent.ACTION_SEND_MULTIPLE) return null
        if (intent.type?.startsWith("image/") != true) return null
        val uris: List<Uri> = if (action == Intent.ACTION_SEND) {
            listOfNotNull(if (Build.VERSION.SDK_INT >= 33) intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java) else @Suppress("DEPRECATION") intent.getParcelableExtra(Intent.EXTRA_STREAM))
        } else {
            (if (Build.VERSION.SDK_INT >= 33) intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java) else @Suppress("DEPRECATION") intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM)) ?: emptyList()
        }
        // Handled once: a rotation or a resume must not share the same images again
        intent.action = Intent.ACTION_MAIN
        val dir = File(context.cacheDir, "belluh-shared").apply { mkdirs() }
        val out = JSArray()
        for (u in uris.take(20)) {
            try {
                val mime = context.contentResolver.getType(u) ?: "image/jpeg"
                if (!mime.startsWith("image/")) continue
                val ext = MimeTypeMap.getSingleton().getExtensionFromMimeType(mime) ?: "jpg"
                val f = File(dir, "${UUID.randomUUID()}.$ext")
                context.contentResolver.openInputStream(u)?.use { input -> f.outputStream().use { input.copyTo(it) } } ?: continue
                out.put(JSObject().put("path", f.absolutePath).put("mimeType", mime))
            } catch (e: Exception) { /* one unreadable image: skip it */ }
        }
        return if (out.length() > 0) out else null
    }
}
