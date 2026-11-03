import Foundation
import Photos
import UIKit
import ImageIO
import CoreLocation

// The photo library, read on this iPhone. Each asset comes back with what the web picker strips: when it was taken
// (EXIF wall clock and offset, else the library's creation date) and where (PHAsset.location), plus a 640 px JPEG
// copy in this app's private cache for Belluh's on-device engine. Nothing here touches the network except iCloud
// Photos fetching the person's own original when the app is open; photos and the index never leave the device.

public final class PhotoLibrary {
    public static let shared = PhotoLibrary()

    private let defaults = UserDefaults.standard
    private let fm = FileManager.default
    private let lock = NSLock()
    static let maxSide: CGFloat = 640

    private enum Key {
        static let newest = "belluh.photos.newest"
        static let oldest = "belluh.photos.oldest"
        static let notBefore = "belluh.photos.notBefore"
        static let background = "belluh.photos.background"
    }

    var root: URL {
        let base = fm.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent("belluh-photos", isDirectory: true)
        try? fm.createDirectory(at: base.appendingPathComponent("r", isDirectory: true), withIntermediateDirectories: true)
        return base
    }
    private var inboxFile: URL { root.appendingPathComponent("inbox.json") }

    // MARK: permission

    public func status() -> String {
        switch PHPhotoLibrary.authorizationStatus(for: .readWrite) {
        case .authorized: return "granted"
        case .limited: return "limited"
        case .denied, .restricted: return "denied"
        default: return "prompt"
        }
    }

    public func request(_ done: @escaping (String) -> Void) {
        PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in DispatchQueue.main.async { done(self.status()) } }
    }

    var canRead: Bool { let s = status(); return s == "granted" || s == "limited" }

    // MARK: settings shared with the background task

    public var backgroundEnabled: Bool {
        get { defaults.bool(forKey: Key.background) }
        set { defaults.set(newValue, forKey: Key.background) }
    }
    public var notBefore: Double? {
        get { defaults.object(forKey: Key.notBefore) as? Double }
        set { if let v = newValue { defaults.set(v, forKey: Key.notBefore) } else { defaults.removeObject(forKey: Key.notBefore) } }
    }
    var cursor: (newest: Double?, oldest: Double?) {
        (defaults.object(forKey: Key.newest) as? Double, defaults.object(forKey: Key.oldest) as? Double)
    }

    public func commit(newest: Double?, oldest: Double?, ids: [String]) {
        lock.lock(); defer { lock.unlock() }
        if let n = newest { defaults.set(max(n, cursor.newest ?? n), forKey: Key.newest) }
        if let o = oldest { defaults.set(min(o, cursor.oldest ?? o), forKey: Key.oldest) }
        let gone = Set(ids)
        var inbox = readInbox()
        let before = inbox.count
        inbox.removeAll { gone.contains($0["id"] as? String ?? "") }
        if inbox.count != before { writeInbox(inbox) }
        for id in ids { try? fm.removeItem(at: renditionURL(id)) }
    }

    /// Forget where reading got to and every prepared copy (Memory turned off, or its index deleted)
    public func reset() {
        lock.lock(); defer { lock.unlock() }
        defaults.removeObject(forKey: Key.newest)
        defaults.removeObject(forKey: Key.oldest)
        try? fm.removeItem(at: root)
    }

    // MARK: reading

    /// The next photos to index: first what the background task prepared, then anything new since the last run,
    /// then older photos back to notBefore. Nothing is marked done until commit().
    public func nextBatch(limit: Int, notBefore: Double?, network: Bool) -> [String: Any] {
        guard canRead else { return ["assets": [], "more": false, "cursor": [:]] }
        if let nb = notBefore { self.notBefore = nb }
        var inbox = readInbox()
        let kept = inbox.filter { fm.fileExists(atPath: ($0["path"] as? String) ?? "") }
        if kept.count != inbox.count { lock.lock(); writeInbox(kept); lock.unlock(); inbox = kept }
        if !inbox.isEmpty {
            let take = Array(inbox.prefix(limit))
            let keys = take.compactMap { $0["key"] as? Double }
            return ["assets": take, "more": true, "cursor": cursorDict(newest: keys.max(), oldest: nil)]
        }
        let c = cursor
        var picked: [PHAsset] = []
        var isNew = false
        if let newest = c.newest {
            picked = fetch(after: newest, before: nil, notBefore: nil, limit: limit, ascending: true)
            isNew = !picked.isEmpty
        }
        if picked.isEmpty {
            let before = c.oldest ?? (Date().timeIntervalSince1970 * 1000 + 86_400_000)
            picked = fetch(after: nil, before: before, notBefore: self.notBefore, limit: limit, ascending: false)
        }
        var out: [[String: Any]] = []
        var keys: [Double] = []
        for a in picked {
            autoreleasepool {
                keys.append(Self.key(a))
                if let d = describe(a, network: network) { out.append(d) }
            }
        }
        let newest = keys.max(), oldest = isNew ? nil : keys.min()
        return ["assets": out, "more": picked.count == limit || isNew, "cursor": cursorDict(newest: c.newest == nil ? newest : (isNew ? newest : nil), oldest: oldest)]
    }

    /// The background task's part: copies of new photos, ready for the engine the next time Belluh opens
    public func prepareInbox(limit: Int, shouldStop: () -> Bool) -> Int {
        guard canRead, backgroundEnabled, let committed = cursor.newest else { return 0 }
        var inbox = readInbox()
        let after = max(committed, inbox.compactMap { $0["key"] as? Double }.max() ?? committed)
        let picked = fetch(after: after, before: nil, notBefore: nil, limit: limit, ascending: true)
        var added = 0
        for a in picked {
            if shouldStop() { break }
            autoreleasepool {
                if let d = describe(a, network: false) { inbox.append(d); added += 1 }
            }
        }
        if added > 0 { lock.lock(); writeInbox(inbox); lock.unlock() }
        return added
    }

    func fetch(after: Double?, before: Double?, notBefore: Double?, limit: Int, ascending: Bool) -> [PHAsset] {
        let o = PHFetchOptions()
        var preds = [NSPredicate(format: "mediaType == %d || mediaType == %d", PHAssetMediaType.image.rawValue, PHAssetMediaType.video.rawValue)]
        if let a = after { preds.append(NSPredicate(format: "creationDate > %@", Date(timeIntervalSince1970: a / 1000) as NSDate)) }
        if let b = before { preds.append(NSPredicate(format: "creationDate < %@", Date(timeIntervalSince1970: b / 1000) as NSDate)) }
        if let n = notBefore { preds.append(NSPredicate(format: "creationDate >= %@", Date(timeIntervalSince1970: n / 1000) as NSDate)) }
        o.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: preds)
        o.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: ascending)]
        o.fetchLimit = limit
        o.includeHiddenAssets = false   // the Hidden album stays hidden from Belluh
        let r = PHAsset.fetchAssets(with: o)
        var out: [PHAsset] = []
        r.enumerateObjects { a, _, _ in out.append(a) }
        return out
    }

    static func key(_ a: PHAsset) -> Double { (a.creationDate ?? a.modificationDate ?? Date()).timeIntervalSince1970 * 1000 }

    private func renditionURL(_ id: String) -> URL {
        let safe = id.replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: ":", with: "_")
        return root.appendingPathComponent("r", isDirectory: true).appendingPathComponent("\(safe).jpg")
    }

    func describe(_ a: PHAsset, network: Bool) -> [String: Any]? {
        guard let r = render(a, network: network) else { return nil }
        var d: [String: Any] = [
            "id": a.localIdentifier,
            "key": Self.key(a),
            "createdAt": Self.key(a),
            "mediaType": a.mediaType == .video ? "video" : (a.mediaSubtypes.contains(.photoScreenshot) ? "screenshot" : "photo"),
            "width": a.pixelWidth,
            "height": a.pixelHeight,
            "path": r.path,
            "favorite": a.isFavorite,
        ]
        if let loc = a.location, CLLocationCoordinate2DIsValid(loc.coordinate), !(loc.coordinate.latitude == 0 && loc.coordinate.longitude == 0) {
            d["lat"] = loc.coordinate.latitude
            d["lng"] = loc.coordinate.longitude
        }
        if a.mediaType == .image, let x = exif(a, network: network) {
            if let t = x.taken { d["taken"] = t }
            if let o = x.offset { d["offset"] = o }
        }
        return d
    }

    private func render(_ a: PHAsset, network: Bool) -> URL? {
        let url = renditionURL(a.localIdentifier)
        if fm.fileExists(atPath: url.path) { return url }
        let o = PHImageRequestOptions()
        o.isSynchronous = true
        o.deliveryMode = .highQualityFormat
        o.resizeMode = .exact
        o.isNetworkAccessAllowed = network
        let w = CGFloat(a.pixelWidth), h = CGFloat(a.pixelHeight)
        let s = min(1, Self.maxSide / max(w, h, 1))
        let target = CGSize(width: max(1, (w * s).rounded()), height: max(1, (h * s).rounded()))
        var image: UIImage?
        PHImageManager.default().requestImage(for: a, targetSize: target, contentMode: .aspectFit, options: o) { img, _ in image = img }
        guard let img = image, let data = img.jpegData(compressionQuality: 0.85) else { return nil }
        do { try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication]) } catch { return nil }
        return url
    }

    /// DateTimeOriginal and OffsetTimeOriginal from the original's EXIF, read without decoding the image
    private func exif(_ a: PHAsset, network: Bool) -> (taken: String?, offset: String?)? {
        let o = PHImageRequestOptions()
        o.isSynchronous = true
        o.isNetworkAccessAllowed = network
        o.deliveryMode = .highQualityFormat
        var result: (String?, String?)?
        PHImageManager.default().requestImageDataAndOrientation(for: a, options: o) { data, _, _, _ in
            guard let data = data, let src = CGImageSourceCreateWithData(data as CFData, nil),
                  let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any],
                  let ex = props[kCGImagePropertyExifDictionary] as? [CFString: Any] else { return }
            let taken = (ex[kCGImagePropertyExifDateTimeOriginal] as? String) ?? (ex[kCGImagePropertyExifDateTimeDigitized] as? String)
            let offset = (ex[kCGImagePropertyExifOffsetTimeOriginal] as? String) ?? (ex[kCGImagePropertyExifOffsetTime] as? String)
            result = (taken, offset)
        }
        return result
    }

    private func cursorDict(newest: Double?, oldest: Double?) -> [String: Any] {
        var c: [String: Any] = [:]
        if let n = newest { c["newest"] = n }
        if let o = oldest { c["oldest"] = o }
        return c
    }

    private func readInbox() -> [[String: Any]] {
        guard let data = try? Data(contentsOf: inboxFile), let list = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { return [] }
        return list
    }
    private func writeInbox(_ list: [[String: Any]]) {
        if list.isEmpty { try? fm.removeItem(at: inboxFile); return }
        if let data = try? JSONSerialization.data(withJSONObject: list) { try? data.write(to: inboxFile, options: .atomic) }
    }
}
