import SwiftUI

/// Root view: progress circles, main timer, duration picker overlay, modals, confetti.
struct ContentView: View {
    @StateObject private var timerState = TimerState()

    var body: some View {
        ZStack {
            Color(red: 248/255, green: 246/255, blue: 241/255)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                ProgressCirclesView(
                    completedSessions: progressCompletedSessions,
                    currentProgress: progressCurrentSession,
                    isWorkMode: timerState.mode == .work
                )
                .padding(.top, 16)
                .zIndex(100)

                Spacer()

                MainTimerView(timerState: timerState)
                    .padding(.horizontal, 16)

                Spacer()
            }

            if timerState.showDurationPicker {
                durationPickerOverlay
            }

            if timerState.showWorkCompleteModal {
                modalOverlay(
                    ModalView(
                        title: "Work session complete!",
                        message: "Time for a 10-minute break. Click Start when you're ready.",
                        primaryButtonTitle: "Start",
                        onPrimary: { timerState.onWorkCompleteStartBreak() },
                        showSkipButton: true,
                        skipButtonTitle: "Skip Break",
                        onSkip: { timerState.onWorkCompleteSkipBreak() }
                    )
                )
            }

            if timerState.showBreakCompleteModal {
                modalOverlay(
                    ModalView(
                        title: "Break over!",
                        message: "Ready to start your next \(HistoryService.shared.getWorkDurationMinutes())-minute work session?",
                        primaryButtonTitle: "Start",
                        onPrimary: { timerState.onBreakCompleteStartWork() }
                    )
                )
            }

            if timerState.showConfetti {
                ConfettiView()
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                            timerState.showConfetti = false
                        }
                    }
            }
        }
        .onAppear {
            timerState.initialize()
        }
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)) { _ in
            timerState.syncFromBackground()
        }
    }

    private var progressCompletedSessions: Int {
        let history = HistoryService.shared
        let workMins = history.getWorkDurationMinutes()
        let totalMinutes = history.getTotalMinutes()
        let totalSessions = workMins > 0 ? totalMinutes / workMins : 0
        var completed = totalSessions % 6
        if completed == 0 && totalSessions > 0 && timerState.mode == .break_ {
            completed = 6
        }
        return completed
    }

    private var progressCurrentSession: Double {
        let duration = Double(timerState.currentDuration)
        let elapsed = duration - Double(timerState.timeRemaining)
        return duration > 0 ? min(1, elapsed / duration) : 0
    }

    private var durationPickerOverlay: some View {
        Color.black.opacity(0.5)
            .ignoresSafeArea()
            .overlay(
                DurationPickerView(timerState: timerState)
            )
    }

    private func modalOverlay<Content: View>(_ content: Content) -> some View {
        Color.black.opacity(0.5)
            .ignoresSafeArea()
            .overlay(content)
    }
}
