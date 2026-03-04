import SwiftUI

/// Reusable modal for work-complete and break-complete prompts.
struct ModalView: View {
    let title: String
    let message: String
    let primaryButtonTitle: String
    let onPrimary: () -> Void
    var showSkipButton: Bool = false
    var skipButtonTitle: String = "Skip Break"
    var onSkip: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 0) {
            Text(title)
                .font(.system(size: 20, weight: .semibold))
                .foregroundColor(Color(white: 0.2))
                .multilineTextAlignment(.center)
                .padding(.bottom, 8)

            Text(message)
                .font(.body)
                .foregroundColor(Color(white: 0.33))
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(.bottom, 24)

            HStack(spacing: 12) {
                Button(action: onPrimary) {
                    Text(primaryButtonTitle)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(minWidth: 140)
                        .padding(.vertical, 14)
                        .background(Color(red: 92/255, green: 107/255, blue: 192/255))
                        .cornerRadius(12)
                }
                .buttonStyle(.plain)

                if showSkipButton, let onSkip = onSkip {
                    Button(action: onSkip) {
                        Text(skipButtonTitle)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(minWidth: 140)
                            .padding(.vertical, 14)
                            .background(Color(red: 92/255, green: 107/255, blue: 192/255))
                            .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(32)
        .frame(maxWidth: 320)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.3), radius: 30, x: 0, y: 10)
    }
}
