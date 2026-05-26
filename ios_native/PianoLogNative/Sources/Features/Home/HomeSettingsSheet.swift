import SwiftUI
import UniformTypeIdentifiers
import PhotosUI

private struct FullBackupPayload: Codable {
    var tracks: [PracticeTrack]
    var practiceRecords: [PracticeRecord]
    var practiceChecks: [String: [Int: Bool]]
    var partialCounts: [String: [Int: Int]]
    var generalPracticeCounts: [String: Int]
    var avatar: String
    var nickname: String
    var theme: String
    var timestamp: String
    var version: String
}

struct HomeSettingsSheet: View {
    @EnvironmentObject private var tracksStore: PracticeTracksStore
    @EnvironmentObject private var practiceDataStore: PracticeDataStore
    @Environment(\.dismiss) private var dismiss

    @AppStorage("nickname") private var nickname = String(localized: "settings.nickname.default")
    @AppStorage("avatar") private var avatarPath = ""
    @AppStorage("theme") private var themeRawValue = AppThemePreference.system.rawValue

    @State private var draftNickname = ""
    @State private var selectedAvatarItem: PhotosPickerItem?
    @State private var isImportingCSV = false
    @State private var isImportingBackup = false
    @State private var alertMessage: String?
    @ScaledMetric(relativeTo: .body) private var avatarPreviewSize: CGFloat = 56

    var body: some View {
        NavigationStack {
            Form {
                profileSection
                themeSection
                migrationSection
            }
            .navigationTitle("settings.title")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.close") {
                        AppHaptics.tap()
                        dismiss()
                    }
                }
            }
            .onAppear {
                draftNickname = nickname
            }
            .onChange(of: draftNickname) { newValue in
                let trimmed = newValue.trimmingCharacters(in: .whitespacesAndNewlines)
                let clamped = String(trimmed.prefix(16))
                if clamped != draftNickname {
                    draftNickname = clamped
                }
                nickname = clamped.isEmpty ? String(localized: "settings.nickname.default") : clamped
            }
            .onChange(of: selectedAvatarItem) { item in
                guard let item else { return }
                Task {
                    do {
                        if let data = try await item.loadTransferable(type: Data.self) {
                            saveAvatarData(data)
                        }
                    } catch {
                        await MainActor.run {
                            alertMessage = String(localized: "settings.image.load.failed")
                        }
                    }
                }
            }
            .fileImporter(
                isPresented: $isImportingCSV,
                allowedContentTypes: [.commaSeparatedText, .plainText]
            ) { result in
                handleCSVImport(result)
            }
            .fileImporter(
                isPresented: $isImportingBackup,
                allowedContentTypes: [.json]
            ) { result in
                handleBackupImport(result)
            }
            .alert("settings.result.title", isPresented: alertPresentedBinding) {
                Button("common.close", role: .cancel) { }
            } message: {
                Text(alertMessage ?? "")
            }
        }
    }

    private var profileSection: some View {
        Section("settings.profile.section") {
            // 아바타 + 닉네임 한 줄 — 아바타 자체가 PhotosPicker 트리거
            HStack(spacing: 14) {
                avatarPickerView
                VStack(alignment: .leading, spacing: 6) {
                    TextField("settings.nickname.placeholder", text: $draftNickname)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Text("settings.nickname.caption")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.vertical, 4)
        }
    }

    /// 아바타 자체를 탭 → PhotosPicker 열림. 아바타 있을 때 컨텍스트 메뉴로 삭제.
    private var avatarPickerView: some View {
        PhotosPicker(selection: $selectedAvatarItem, matching: .images) {
            avatarPreview
                .overlay(alignment: .bottomTrailing) {
                    Image(systemName: "camera.circle.fill")
                        .font(.system(size: 18))
                        .symbolRenderingMode(.multicolor)
                        .background(Circle().fill(Color(uiColor: .systemBackground)).padding(1))
                }
        }
        .buttonStyle(.plain)
        .contextMenu {
            if !avatarPath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Button(role: .destructive) {
                    AppHaptics.tap()
                    avatarPath = ""
                } label: {
                    Label("settings.avatar.delete", systemImage: "trash")
                }
            }
        }
    }

    private var migrationSection: some View {
        Section {
            Button("settings.csv.import") {
                AppHaptics.tap()
                isImportingCSV = true
            }
            Button("settings.backup.import") {
                AppHaptics.tap()
                isImportingBackup = true
            }
        } header: {
            Text("settings.migration.section")
        } footer: {
            Text("settings.migration.help")
        }
    }

    private var themeSection: some View {
        Section("settings.theme.section") {
            Picker(selection: themeSelectionBinding) {
                ForEach(AppThemePreference.allCases) { option in
                    Text(option.localizedLabel).tag(option)
                }
            } label: {
                EmptyView()
            }
            .pickerStyle(.inline)
            .labelsHidden()
        }
    }

    private var themeSelectionBinding: Binding<AppThemePreference> {
        Binding(
            get: { AppThemePreference(rawValue: themeRawValue) ?? .system },
            set: { themeRawValue = $0.rawValue }
        )
    }

    private var alertPresentedBinding: Binding<Bool> {
        Binding(
            get: { alertMessage != nil },
            set: { if !$0 { alertMessage = nil } }
        )
    }

    private var avatarPreview: some View {
        Group {
            if let image = loadAvatarImage() {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else {
                Image(systemName: "person.crop.circle.fill")
                    .resizable()
                    .scaledToFit()
                    .foregroundStyle(.secondary)
                    .padding(2)
            }
        }
        .frame(width: avatarPreviewSize, height: avatarPreviewSize)
        .clipShape(Circle())
        .overlay(Circle().strokeBorder(.quaternary, lineWidth: 1))
    }

    private func loadAvatarImage() -> UIImage? {
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

    private func saveAvatarData(_ data: Data) {
        guard let image = UIImage(data: data),
              let jpeg = image.jpegData(compressionQuality: 0.85) else {
            alertMessage = String(localized: "settings.image.save.failed")
            return
        }
        do {
            let supportDir = try FileManager.default.url(
                for: .applicationSupportDirectory,
                in: .userDomainMask,
                appropriateFor: nil,
                create: true
            )
            let fileURL = supportDir.appendingPathComponent("home_avatar.jpg")
            try jpeg.write(to: fileURL, options: .atomic)
            avatarPath = fileURL.path
        } catch {
            alertMessage = String(localized: "settings.image.save.failed")
        }
    }

    private func handleCSVImport(_ result: Result<URL, Error>) {
        do {
            let url = try result.get()
            guard url.startAccessingSecurityScopedResource() else { return }
            defer { url.stopAccessingSecurityScopedResource() }
            let data = try Data(contentsOf: url)
            guard let text = String(data: data, encoding: .utf8) ?? String(data: data, encoding: .unicode) else {
                alertMessage = String(localized: "settings.csv.import.failed")
                return
            }
            let records = parsePracticeRecords(from: text)
            practiceDataStore.importRecords(records)
            alertMessage = String(localized: "settings.csv.import.success")
        } catch {
            alertMessage = String(localized: "settings.csv.import.failed")
        }
    }

    private func handleBackupImport(_ result: Result<URL, Error>) {
        do {
            let url = try result.get()
            guard url.startAccessingSecurityScopedResource() else { return }
            defer { url.stopAccessingSecurityScopedResource() }
            let data = try Data(contentsOf: url)
            let payload = try JSONDecoder().decode(FullBackupPayload.self, from: data)
            guard !payload.version.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  !payload.timestamp.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                alertMessage = String(localized: "settings.backup.invalid")
                return
            }
            tracksStore.importSnapshot(
                PracticeTracksSnapshot(
                    tracks: payload.tracks,
                    practiceChecks: payload.practiceChecks,
                    partialCounts: payload.partialCounts,
                    generalPracticeCounts: payload.generalPracticeCounts
                )
            )
            practiceDataStore.importRecords(payload.practiceRecords)
            avatarPath = payload.avatar
            nickname = payload.nickname
            if AppThemePreference(rawValue: payload.theme) != nil {
                themeRawValue = payload.theme
            }
            alertMessage = String(localized: "settings.backup.import.success")
        } catch {
            alertMessage = String(localized: "settings.backup.import.failed")
        }
    }

    private func parsePracticeRecords(from csvText: String) -> [PracticeRecord] {
        let lines = csvText
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        let sectionTitle = String(localized: "settings.csv.section.title")
        guard let startIndex = lines.firstIndex(where: { line in
            line.contains(sectionTitle) || line.lowercased().contains("practice session records")
        }),
              startIndex + 2 < lines.count else {
            return []
        }
        let rows = lines[(startIndex + 2)...]
        var parsed: [PracticeRecord] = []
        for row in rows {
            if row.hasPrefix("===") { break }
            let values = splitCSVRow(row)
            guard values.count >= 6 else { continue }
            let date = values[0]
            let minutes = parsePracticeTimeToMinutes(values[2])
            let start = parseClockTime(values[3], date: date) ?? Int64(Date().timeIntervalSince1970 * 1000)
            let end = parseClockTime(values[4], date: date) ?? start
            let memo = values[5].isEmpty ? nil : values[5]
            let record = PracticeRecord(
                id: "\(Date().timeIntervalSince1970)-\(UUID().uuidString.prefix(8))",
                date: date,
                practiceTime: minutes,
                startTime: start,
                endTime: max(start, end),
                memo: memo,
                track: nil
            )
            parsed.append(record)
        }
        return parsed
    }

    private func splitCSVRow(_ row: String) -> [String] {
        var values: [String] = []
        var current = ""
        var inQuotes = false
        for char in row {
            if char == "\"" {
                inQuotes.toggle()
            } else if char == "," && !inQuotes {
                values.append(current)
                current = ""
            } else {
                current.append(char)
            }
        }
        values.append(current)
        return values.map { $0.replacingOccurrences(of: "\"\"", with: "\"").trimmingCharacters(in: CharacterSet(charactersIn: "\"")) }
    }

    private func parsePracticeTimeToMinutes(_ text: String) -> Int {
        let hourMatch = extractFirstInt(from: text, pattern: "(\\d+)\\s*(시간|h)")
        let minMatch = extractFirstInt(from: text, pattern: "(\\d+)\\s*(분|m)")
        return hourMatch * 60 + minMatch
    }

    private func extractFirstInt(from text: String, pattern: String) -> Int {
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else {
            return 0
        }
        let range = NSRange(text.startIndex..<text.endIndex, in: text)
        guard let match = regex.firstMatch(in: text, options: [], range: range),
              match.numberOfRanges > 1,
              let numberRange = Range(match.range(at: 1), in: text) else {
            return 0
        }
        return Int(text[numberRange]) ?? 0
    }

    private func parseClockTime(_ text: String, date: String) -> Int64? {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.dateFormat = "yyyy-MM-dd h:mm:ss a"
        if let dateObj = formatter.date(from: "\(date) \(text)") {
            return Int64(dateObj.timeIntervalSince1970 * 1000)
        }
        let alt = DateFormatter()
        alt.locale = Locale(identifier: "en_US_POSIX")
        alt.calendar = Calendar(identifier: .gregorian)
        alt.dateFormat = "yyyy-MM-dd HH:mm:ss"
        guard let dateObj = alt.date(from: "\(date) \(text)") else { return nil }
        return Int64(dateObj.timeIntervalSince1970 * 1000)
    }

}
