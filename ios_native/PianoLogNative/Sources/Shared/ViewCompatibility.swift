import SwiftUI

// MARK: - onChange backward-compatible wrapper
//
// iOS 16 배포 타겟: onChange(of:perform:) 단일-클로저 형태가
// iOS 17 SDK에서 deprecated 처리됨.
// 이 wrapper가 런타임 OS 버전에 따라 올바른 오버로드를 선택한다.

struct OnChangeCompat<V: Equatable>: ViewModifier {
    let value: V
    let action: (V) -> Void

    func body(content: Content) -> some View {
        if #available(iOS 17, *) {
            content.onChange(of: value) { _, new in action(new) }
        } else {
            content.onChange(of: value, perform: action)
        }
    }
}

extension View {
    func onChangeSafe<V: Equatable>(
        of value: V,
        perform action: @escaping (V) -> Void
    ) -> some View {
        modifier(OnChangeCompat(value: value, action: action))
    }
}
