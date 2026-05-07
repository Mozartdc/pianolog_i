import CoreGraphics
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
                Bundle.main.url(forResource: name, withExtension: "png"),
                Bundle.main.url(forResource: name, withExtension: "png", subdirectory: "Features/Metronome/SubdivisionPDFs"),
                Bundle.main.url(forResource: name, withExtension: "png", subdirectory: "SubdivisionPDFs"),
                Bundle.main.url(forResource: name, withExtension: "pdf", subdirectory: "Features/Metronome/SubdivisionPDFs"),
                Bundle.main.url(forResource: name, withExtension: "pdf", subdirectory: "SubdivisionPDFs"),
                Bundle.main.url(forResource: name, withExtension: "pdf")
            ]
        }.compactMap { $0 }

        guard let image = candidates.lazy.compactMap({ renderImage(at: $0) }).first else { return nil }
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

    private static func renderImage(at url: URL) -> UIImage? {
        if url.pathExtension.lowercased() == "png" {
            guard let data = try? Data(contentsOf: url), let image = UIImage(data: data) else { return nil }
            return image
        }
        return renderPDF(at: url)
    }

    private static func renderPDF(at url: URL) -> UIImage? {
        guard let document = CGPDFDocument(url as CFURL), let page = document.page(at: 1) else {
            return nil
        }

        let box = page.getBoxRect(.mediaBox)
        guard box.width > 0, box.height > 0 else { return nil }

        let outputSize = CGSize(width: box.width, height: box.height)
        let renderer = UIGraphicsImageRenderer(size: outputSize)
        let image = renderer.image { context in
            let cg = context.cgContext
            cg.setFillColor(UIColor.clear.cgColor)
            cg.fill(CGRect(origin: .zero, size: outputSize))
            cg.translateBy(x: 0, y: outputSize.height)
            cg.scaleBy(x: 1, y: -1)
            cg.drawPDFPage(page)
        }
        return makeWhiteTransparent(image)
    }

    private static func makeWhiteTransparent(_ image: UIImage) -> UIImage {
        guard let cgImage = image.cgImage else { return image }

        let width = cgImage.width
        let height = cgImage.height
        let bytesPerPixel = 4
        let bytesPerRow = width * bytesPerPixel
        let totalBytes = height * bytesPerRow

        guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
              let context = CGContext(
                data: nil,
                width: width,
                height: height,
                bitsPerComponent: 8,
                bytesPerRow: bytesPerRow,
                space: colorSpace,
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
              ) else {
            return image
        }

        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        guard let data = context.data else { return image }

        let pixels = data.bindMemory(to: UInt8.self, capacity: totalBytes)
        var i = 0
        while i < totalBytes {
            let r = pixels[i]
            let g = pixels[i + 1]
            let b = pixels[i + 2]
            let a = pixels[i + 3]

            if a > 0, r >= 245, g >= 245, b >= 245 {
                pixels[i + 3] = 0
            }

            i += bytesPerPixel
        }

        guard let output = context.makeImage() else { return image }
        return UIImage(cgImage: output, scale: image.scale, orientation: image.imageOrientation)
    }

}

private extension Array where Element: Hashable {
    func uniqued() -> [Element] {
        var seen = Set<Element>()
        return filter { seen.insert($0).inserted }
    }
}
