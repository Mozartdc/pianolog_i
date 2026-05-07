import Foundation
import CoreText

enum FontBootstrap {
    static func registerBravuraIfNeeded() {
        guard let url = Bundle.main.url(forResource: "Bravura", withExtension: "otf") else { return }
        CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
    }
}

