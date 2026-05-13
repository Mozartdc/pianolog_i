import SwiftUI
import UIKit

struct MetronomeSubdivisionNotationView: View {
    static let commonTargetHeight: CGFloat = 42
    static let commonMinWidth: CGFloat = 39
    static let commonMaxWidth: CGFloat = 91

    let subdivision: RhythmSubdivision
    let denominator: Int
    var targetHeight: CGFloat = MetronomeSubdivisionNotationView.commonTargetHeight

    var body: some View {
        Group {
            if let image = SubdivisionNotationAssetLibrary.image(for: assetKey) {
                let size = SubdivisionNotationAssetLibrary.displaySize(
                    for: image,
                    subdivisionID: subdivision.id,
                    targetHeight: targetHeight,
                    minWidth: MetronomeSubdivisionNotationView.commonMinWidth,
                    maxWidth: MetronomeSubdivisionNotationView.commonMaxWidth
                )
                Image(uiImage: image)
                    .renderingMode(.original)
                    .resizable()
                    .scaledToFit()
                    .frame(width: size.width, height: size.height)
            } else {
                Text(subdivision.description)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .frame(width: 78, height: targetHeight)
            }
        }
        .accessibilityLabel(Text(subdivision.description))
    }

    private var assetKey: String {
        "\(subdivision.id)_d\(denominator)"
    }
}

enum SubdivisionNotationAssetLibrary {
    private static let lock = NSLock()
    private static var cache: [String: UIImage] = [:]

    static func image(for key: String) -> UIImage? {
        lock.lock()
        if let cached = cache[key] {
            lock.unlock()
            return cached
        }
        lock.unlock()

        let baseKey = key.replacingOccurrences(of: #"_d[0-9]+$"#, with: "", options: .regularExpression)
        let names = [key, baseKey].uniqued()

        let candidates: [URL] = names.flatMap { name in
            [
                Bundle.main.url(forResource: name, withExtension: "png", subdirectory: "Features/Metronome/SubdivisionPNGs"),
                Bundle.main.url(forResource: name, withExtension: "png", subdirectory: "SubdivisionPNGs"),
                Bundle.main.url(forResource: name, withExtension: "png")
            ]
        }.compactMap { $0 }

        guard let image = candidates.lazy.compactMap({ loadPNG(at: $0) }).first else { return nil }
        let rendered = image.withRenderingMode(.alwaysOriginal)
        lock.lock()
        cache[key] = rendered
        lock.unlock()
        return rendered
    }

    static func renderSize(for image: UIImage, targetHeight: CGFloat, minWidth: CGFloat, maxWidth: CGFloat) -> CGSize {
        let size = image.size
        guard size.width > 0, size.height > 0 else {
            return CGSize(width: minWidth, height: targetHeight)
        }
        let width = min(maxWidth, max(minWidth, (size.width / size.height) * targetHeight))
        return CGSize(width: width, height: targetHeight)
    }

    static func displaySize(
        for image: UIImage,
        subdivisionID: String,
        targetHeight: CGFloat,
        minWidth: CGFloat,
        maxWidth: CGFloat
    ) -> CGSize {
        _ = subdivisionID
        return renderSize(
            for: image,
            targetHeight: targetHeight,
            minWidth: minWidth,
            maxWidth: maxWidth
        )
    }

    private static func loadPNG(at url: URL) -> UIImage? {
        guard url.pathExtension.lowercased() == "png" else { return nil }
        guard let data = try? Data(contentsOf: url), let image = UIImage(data: data) else { return nil }
        return image
    }

}

private extension Array where Element: Hashable {
    func uniqued() -> [Element] {
        var seen = Set<Element>()
        return filter { seen.insert($0).inserted }
    }
}
