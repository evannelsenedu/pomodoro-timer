import SwiftUI

/// Overlay for choosing work session duration (30–90 min) on first launch or via "Change duration".
struct DurationPickerView: View {
    @ObservedObject var timerState: TimerState
    private let soundService = SoundService.shared

    private let options = HistoryService.workDurationOptions

    var body: some View {
        VStack(spacing: 24) {
            Text("Choose your work session length")
                .font(.system(size: 20, weight: .semibold))
                .foregroundColor(Color(white: 0.2))
                .multilineTextAlignment(.center)

            HStack(spacing: 12) {
                ForEach(options, id: \.self) { minutes in
                    Button(action: {
                        soundService.play(.start)
                        timerState.selectDuration(minutes)
                    }) {
                        Text("\(minutes) min")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 12)
                            .background(Color(red: 92/255, green: 107/255, blue: 192/255))
                            .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(32)
        .frame(maxWidth: 340)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.3), radius: 30, x: 0, y: 10)
    }
}
