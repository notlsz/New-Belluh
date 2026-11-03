import Foundation
import UIKit
import Capacitor
import Photos
import PhotosUI
import BackgroundTasks

// "BelluhPhotos" for the web code (src/lib/native/photos.ts). Reading runs off the main thread; results are small
// dictionaries plus file paths to 640 px copies in this app's cache, which the WebView loads by URL.
@objc(BelluhPhotosPlugin)
public class BelluhPhotosPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BelluhPhotosPlugin"
    public let jsName = "BelluhPhotos"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageLimited", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "nextBatch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "commit", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setBackground", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reset", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getShared", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pushReady", returnType: CAPPluginReturnPromise),
    ]

    private let queue = DispatchQueue(label: "com.belluh.photos", qos: .userInitiated)
    private let lib = PhotoLibrary.shared

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(["photos": lib.status()])
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        lib.request { call.resolve(["photos": $0]) }
    }

    /// With limited access, lets the person add or remove photos from what Belluh can see
    @objc func manageLimited(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.lib.status() == "limited", let vc = self.bridge?.viewController else { call.resolve(["photos": self.lib.status()]); return }
            PHPhotoLibrary.shared().presentLimitedLibraryPicker(from: vc) { _ in call.resolve(["photos": self.lib.status()]) }
        }
    }

    /// Photo access was turned off: Belluh's page in Settings, where the person can turn it back on
    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
            call.resolve()
        }
    }

    @objc func nextBatch(_ call: CAPPluginCall) {
        let limit = max(1, min(call.getInt("limit") ?? 60, 200))
        let notBefore = call.getDouble("notBefore")
        queue.async {
            call.resolve(self.lib.nextBatch(limit: limit, notBefore: notBefore, network: true))
        }
    }

    @objc func commit(_ call: CAPPluginCall) {
        let c = call.getObject("cursor") ?? [:]
        let ids = call.getArray("ids", String.self) ?? []
        queue.async {
            self.lib.commit(newest: c["newest"] as? Double, oldest: c["oldest"] as? Double, ids: ids)
            call.resolve()
        }
    }

    @objc func setBackground(_ call: CAPPluginCall) {
        lib.backgroundEnabled = call.getBool("enabled") ?? false
        if let nb = call.getDouble("notBefore") { lib.notBefore = nb }
        if lib.backgroundEnabled { BelluhBackground.schedule() } else { BelluhBackground.cancel() }
        call.resolve(["enabled": lib.backgroundEnabled])
    }

    @objc func reset(_ call: CAPPluginCall) {
        lib.backgroundEnabled = false
        BelluhBackground.cancel()
        queue.async { self.lib.reset(); call.resolve() }
    }

    /// APNs needs nothing in the app beyond the entitlement, so notifications can always be asked for
    @objc func pushReady(_ call: CAPPluginCall) {
        call.resolve(["ready": true])
    }

    /// Share to Belluh comes from a Share Extension on iOS (not yet added, see docs/native-app.md); nothing waits here
    @objc func getShared(_ call: CAPPluginCall) {
        call.resolve(["files": []])
    }
}

/// Background indexing, after Rollup: a BGProcessingTask (often overnight, while charging) prepares new photos so the
/// next open indexes them at once. The image model runs in the WebView, which iOS does not run in the background,
/// so the task reads dates, places and 640 px copies; the engine understands them when Belluh opens.
public enum BelluhBackground {
    public static let taskId = "com.belluh.app.photos"

    /// Call from application(_:didFinishLaunchingWithOptions:), before it returns
    public static func register() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: taskId, using: nil) { task in
            guard let task = task as? BGProcessingTask else { task.setTaskCompleted(success: false); return }
            handle(task)
        }
    }

    public static func schedule() {
        guard PhotoLibrary.shared.backgroundEnabled else { return }
        let r = BGProcessingTaskRequest(identifier: taskId)
        r.requiresNetworkConnectivity = false
        r.requiresExternalPower = false
        r.earliestBeginDate = Date(timeIntervalSinceNow: 30 * 60)
        try? BGTaskScheduler.shared.submit(r)
    }

    public static func cancel() {
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: taskId)
    }

    static func handle(_ task: BGProcessingTask) {
        schedule()
        final class Flag { var stop = false }
        let flag = Flag()
        task.expirationHandler = { flag.stop = true }
        DispatchQueue.global(qos: .utility).async {
            _ = PhotoLibrary.shared.prepareInbox(limit: 400, shouldStop: { flag.stop })
            task.setTaskCompleted(success: !flag.stop)
        }
    }
}
