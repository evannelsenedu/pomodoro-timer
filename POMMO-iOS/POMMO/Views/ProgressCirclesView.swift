import SwiftUI

/// Six progress circles showing completed work sessions and current session progress.
struct ProgressCirclesView: View {
    let completedSessions: Int
    let currentProgress: Double
    let isWorkMode: Bool

    private let circleCount = 6
    private let circleSize: CGFloat = 14
    private let fillColor = Color(red: 230/255, green: 57/255, blue: 70/255).opacity(0.55)
    private let emptyColor = Color.black.opacity(0.1)
    private let borderColor = Color.black.opacity(0.12)

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<circleCount, id: \.self) { index in
                ZStack {
                    Circle()
                        .fill(emptyColor)
                        .frame(width: circleSize, height: circleSize)
                    Circle()
                        .trim(from: 0, to: progress(for: index))
                        .stroke(fillColor, style: StrokeStyle(lineWidth: circleSize / 2, lineCap: .round))
                        .frame(width: circleSize, height: circleSize)
                        .rotationEffect(.degrees(-90))
                    Circle()
                        .stroke(borderColor, lineWidth: 1)
                        .frame(width: circleSize, height: circleSize)
                }
            }
        }
    }

    private func progress(for index: Int) -> CGFloat {
        if index < completedSessions {
            return 1.0
        } else if index == completedSessions && isWorkMode {
            return CGFloat(min(1, max(0, currentProgress)))
        } else {
            return 0
        }
    }
}
