import UIKit

// MARK: - 공유 카드 생성 유틸리티

enum ShareCardMaker {

    static func loadAvatarImage(avatarPath: String) -> UIImage? {
        guard !avatarPath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
        if avatarPath.hasPrefix("data:image"),
           let base64 = avatarPath.components(separatedBy: ",").last,
           let data = Data(base64Encoded: base64) {
            return UIImage(data: data)
        }
        if FileManager.default.fileExists(atPath: avatarPath) {
            return UIImage(contentsOfFile: avatarPath)
        }
        return nil
    }

    static func makeImage(
        record: PracticeRecord,
        nickname: String,
        dateText: String,
        avatarPath: String
    ) -> UIImage {
        let W: CGFloat = 480, H: CGFloat = 480
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3.0
        format.opaque = true

        return UIGraphicsImageRenderer(size: CGSize(width: W, height: H), format: format).image { ctx in
            let cg = ctx.cgContext
            let cs = CGColorSpaceCreateDeviceRGB()
            let tq       = UIColor(red: 0.271, green: 0.710, blue: 0.667, alpha: 1)
            let white    = UIColor.white
            let soft     = UIColor(white: 0.72, alpha: 1)
            let dim      = UIColor(white: 0.45, alpha: 1)
            let avatarBg = UIColor(red: 0.11, green: 0.22, blue: 0.21, alpha: 1)
            let bgColors = [UIColor(red: 0.082, green: 0.188, blue: 0.176, alpha: 1).cgColor,
                            UIColor(red: 0.039, green: 0.094, blue: 0.086, alpha: 1).cgColor] as CFArray
            if let g = CGGradient(colorsSpace: cs, colors: bgColors, locations: [0, 1]) {
                cg.drawLinearGradient(g, start: .zero, end: CGPoint(x: W, y: H), options: [])
            }
            let glowColors = [tq.withAlphaComponent(0.10).cgColor, tq.withAlphaComponent(0).cgColor] as CFArray
            let glowCenter = CGPoint(x: W / 2 + 70, y: H / 2 - 55)
            if let g = CGGradient(colorsSpace: cs, colors: glowColors, locations: [0, 1]) {
                cg.drawRadialGradient(g, startCenter: glowCenter, startRadius: 0,
                                      endCenter: glowCenter, endRadius: 160, options: [])
            }
            let avSz: CGFloat = 72, avX = (W - avSz) / 2, avY: CGFloat = 44
            let avRect = CGRect(x: avX, y: avY, width: avSz, height: avSz)
            cg.saveGState()
            cg.addEllipse(in: avRect); cg.clip()
            if let img = loadAvatarImage(avatarPath: avatarPath) {
                let r = img.size.width / img.size.height
                let dw = r >= 1 ? avSz * r : avSz
                let dh = r >= 1 ? avSz : avSz / r
                img.draw(in: CGRect(x: avX + (avSz - dw) / 2, y: avY + (avSz - dh) / 2, width: dw, height: dh))
            } else {
                avatarBg.setFill(); cg.fill(avRect)
                let pCfg = UIImage.SymbolConfiguration(pointSize: 28)
                if let p = UIImage(systemName: "person.fill", withConfiguration: pCfg)?
                    .withTintColor(tq.withAlphaComponent(0.8), renderingMode: .alwaysOriginal) {
                    let ps = p.size
                    p.draw(in: CGRect(x: avX + (avSz - ps.width) / 2, y: avY + (avSz - ps.height) / 2,
                                      width: ps.width, height: ps.height))
                }
            }
            cg.restoreGState()
            cg.setStrokeColor(white.withAlphaComponent(0.22).cgColor)
            cg.setLineWidth(1.5)
            cg.addEllipse(in: avRect.insetBy(dx: 0.75, dy: 0.75)); cg.strokePath()
            func roundedFont(size: CGFloat, weight: UIFont.Weight) -> UIFont {
                let base = UIFont.systemFont(ofSize: size, weight: weight)
                return base.fontDescriptor.withDesign(.rounded).map { UIFont(descriptor: $0, size: size) } ?? base
            }
            let nickA: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 17, weight: .semibold),
                                                         .foregroundColor: white]
            let nickSz = (nickname as NSString).size(withAttributes: nickA)
            (nickname as NSString).draw(at: CGPoint(x: (W - nickSz.width) / 2, y: avY + avSz + 12),
                                        withAttributes: nickA)
            let dateA: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 13), .foregroundColor: soft]
            let dateSz = (dateText as NSString).size(withAttributes: dateA)
            (dateText as NSString).draw(at: CGPoint(x: (W - dateSz.width) / 2, y: avY + avSz + 12 + nickSz.height + 4),
                                        withAttributes: dateA)
            let h = max(0, record.practiceTime) / 60
            let m = max(0, record.practiceTime) % 60
            let timeStr = NSMutableAttributedString()
            let bigF  = roundedFont(size: 62, weight: .bold)
            let unitF = UIFont.systemFont(ofSize: 22, weight: .light)
            if h > 0 {
                timeStr.append(NSAttributedString(string: "\(h)", attributes: [.font: bigF, .foregroundColor: white]))
                timeStr.append(NSAttributedString(string: "시간", attributes: [.font: unitF, .foregroundColor: soft]))
                if m > 0 { timeStr.append(NSAttributedString(string: " ", attributes: [.font: bigF, .foregroundColor: white])) }
            }
            if m > 0 || h == 0 {
                timeStr.append(NSAttributedString(string: "\(m)", attributes: [.font: bigF, .foregroundColor: white]))
                timeStr.append(NSAttributedString(string: "분", attributes: [.font: unitF, .foregroundColor: soft]))
            }
            let timeSz = timeStr.size()
            let timeCY = H * 0.50
            timeStr.draw(at: CGPoint(x: (W - timeSz.width) / 2, y: timeCY - timeSz.height / 2))
            let lCfg = UIImage.SymbolConfiguration(pointSize: 38, weight: .ultraLight)
            let lColor = tq.withAlphaComponent(0.75)
            if let lL = UIImage(systemName: "laurel.leading", withConfiguration: lCfg)?
                .withTintColor(lColor, renderingMode: .alwaysOriginal) {
                let ls = lL.size
                lL.draw(in: CGRect(x: (W - timeSz.width) / 2 - ls.width - 6,
                                   y: timeCY - ls.height / 2, width: ls.width, height: ls.height))
            }
            if let lR = UIImage(systemName: "laurel.trailing", withConfiguration: lCfg)?
                .withTintColor(lColor, renderingMode: .alwaysOriginal) {
                let ls = lR.size
                lR.draw(in: CGRect(x: (W + timeSz.width) / 2 + 6,
                                   y: timeCY - ls.height / 2, width: ls.width, height: ls.height))
            }
            let badgeA: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 11, weight: .medium),
                                                          .foregroundColor: soft]
            let badgeTxt = "오늘 연습 기록" as NSString
            let badgeSz  = badgeTxt.size(withAttributes: badgeA)
            let sCfg = UIImage.SymbolConfiguration(pointSize: 8)
            let badgeY = timeCY + timeSz.height / 2 + 14
            if let star = UIImage(systemName: "star.fill", withConfiguration: sCfg)?
                .withTintColor(tq, renderingMode: .alwaysOriginal) {
                let ss = star.size
                let totalW = ss.width + 5 + badgeSz.width + 5 + ss.width
                let bx = (W - totalW) / 2
                star.draw(in: CGRect(x: bx, y: badgeY + (badgeSz.height - ss.height) / 2,
                                     width: ss.width, height: ss.height))
                badgeTxt.draw(at: CGPoint(x: bx + ss.width + 5, y: badgeY), withAttributes: badgeA)
                star.draw(in: CGRect(x: bx + ss.width + 5 + badgeSz.width + 5,
                                     y: badgeY + (badgeSz.height - ss.height) / 2,
                                     width: ss.width, height: ss.height))
            } else {
                badgeTxt.draw(at: CGPoint(x: (W - badgeSz.width) / 2, y: badgeY), withAttributes: badgeA)
            }
            let brandA: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 12, weight: .medium),
                                                          .foregroundColor: dim]
            let brandTxt = "PianoLog" as NSString
            let brandSz  = brandTxt.size(withAttributes: brandA)
            let pCfg2 = UIImage.SymbolConfiguration(pointSize: 12)
            let brandY = H - 32 - brandSz.height
            if let piano = UIImage(systemName: "pianokeys", withConfiguration: pCfg2)?
                .withTintColor(dim, renderingMode: .alwaysOriginal) {
                let ps = piano.size
                let totalW = ps.width + 5 + brandSz.width
                let px = (W - totalW) / 2
                piano.draw(in: CGRect(x: px, y: brandY + (brandSz.height - ps.height) / 2,
                                      width: ps.width, height: ps.height))
                brandTxt.draw(at: CGPoint(x: px + ps.width + 5, y: brandY), withAttributes: brandA)
            } else {
                brandTxt.draw(at: CGPoint(x: (W - brandSz.width) / 2, y: brandY), withAttributes: brandA)
            }
        }
    }

    static func present(image: UIImage, from window: UIWindow) {
        guard let rootVC = window.rootViewController else { return }
        let activityVC = UIActivityViewController(activityItems: [image], applicationActivities: nil)
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = window
            popover.sourceRect = CGRect(x: window.bounds.midX, y: window.bounds.midY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }
        // presentedViewController가 시트 해제 중일 수 있으므로 rootVC에 직접 present
        rootVC.present(activityVC, animated: true)
    }
}

// MARK: - 햅틱

enum AppHaptics {
    private static let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private static let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private static let selection = UISelectionFeedbackGenerator()
    private static let notification = UINotificationFeedbackGenerator()

    static func tap() {
        lightImpact.prepare()
        lightImpact.impactOccurred()
    }

    static func mediumTap(intensity: CGFloat = 0.85) {
        mediumImpact.prepare()
        mediumImpact.impactOccurred(intensity: intensity)
    }

    static func selectionChanged() {
        selection.selectionChanged()
    }

    static func success() {
        notification.prepare()
        notification.notificationOccurred(.success)
    }
}
