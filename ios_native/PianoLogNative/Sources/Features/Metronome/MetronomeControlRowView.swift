import SwiftUI

struct MetronomeControlRowView: View {
    let signatureText: String
    let denominator: Int
    let subdivision: RhythmSubdivision
    let onTapSignature: () -> Void
    let onTapSubdivision: () -> Void
    let onTapTraining: () -> Void
    @State private var signatureAnimated = false

    var body: some View {
        ZStack(alignment: .center) {
            Button {
                AppHaptics.tap()
                onTapSubdivision()
            } label: {
                MetronomeSubdivisionNotationView(
                    subdivision: subdivision,
                    denominator: denominator
                )
                .frame(width: subdivisionButtonWidth(subdivision), height: 56)
            }
            .buttonStyle(.plain)

            HStack(spacing: 0) {
                Button {
                    AppHaptics.tap()
                    onTapSignature()
                } label: {
                    Text(signatureText)
                        .font(.system(size: 20.5, weight: .semibold, design: .rounded))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .scaleEffect(signatureAnimated ? 0.88 : 1.0)
                        .opacity(signatureAnimated ? 0.7 : 1.0)
                        .animation(.easeInOut(duration: 0.2), value: signatureAnimated)
                        .padding(.horizontal, 6)
                        .frame(minWidth: 66)
                        .frame(height: 50)
                }
                .buttonStyle(.plain)
                .onChange(of: signatureText) { _ in
                    signatureAnimated = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                        signatureAnimated = false
                    }
                }

                Spacer(minLength: 10)

                Button {
                    AppHaptics.tap()
                    onTapTraining()
                } label: {
                    Image(systemName: "arrow.2.squarepath")
                        .font(.system(size: 24, weight: .regular))
                        .foregroundStyle(.primary)
                        .frame(width: 50, height: 50)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 2)
            .frame(maxWidth: 270)
        }
        .frame(maxWidth: .infinity, minHeight: 56, maxHeight: 56)
    }

    private func subdivisionButtonWidth(_ value: RhythmSubdivision) -> CGFloat {
        if value.id.contains("triplet") { return 102 }
        if value.id.contains("four_parts") { return 108 }
        if value.id.contains("rest") { return 96 }
        return 90
    }

}
