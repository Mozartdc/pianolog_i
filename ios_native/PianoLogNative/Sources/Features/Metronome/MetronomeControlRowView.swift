import SwiftUI

struct MetronomeControlRowView: View {
    let signatureText: String
    let denominator: Int
    let subdivision: RhythmSubdivision
    let onTapSignature: () -> Void
    let onTapSubdivision: () -> Void
    let onTapTraining: () -> Void

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
                        .padding(.horizontal, 6)
                        .frame(minWidth: 66)
                        .frame(height: 50)
                }
                .buttonStyle(.plain)

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
        switch value.id {
        case "triplet", "triplet_rest_first", "triplet_rest_middle",
             "triplet_rest_last", "triplet_rest_edges":
            return 102
        case "four_parts_A", "four_parts_B":
            return 108
        case "rest_plus_half":
            return 96
        default:
            return 90
        }
    }

}
