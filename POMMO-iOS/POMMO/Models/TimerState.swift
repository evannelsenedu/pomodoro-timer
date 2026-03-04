import Foundation
import Combine

/// Timer mode: work session or break.
enum TimerMode {
    case work
    case break_
}

/// Central timer state: mode, remaining time, modals, duration picker.
/// Coordinates with HistoryService and SoundService.
final class TimerState: ObservableObject {
    @Published var mode: TimerMode = .work
    @Published var timeRemaining: Int = 0
    @Published var isPaused: Bool = true
    @Published var timerEndDate: Date?
    @Published var showDurationPicker: Bool = false
    @Published var showWorkCompleteModal: Bool = false
    @Published var showBreakCompleteModal: Bool = false
    @Published var showConfetti: Bool = false

    private var timerCancellable: AnyCancellable?
    private let historyService = HistoryService.shared
    private let soundService = SoundService.shared

    static let breakDurationSeconds = 10 * 60

    var workDurationSeconds: Int {
        historyService.getWorkDurationMinutes() * 60
    }

    var currentDuration: Int {
        mode == .work ? workDurationSeconds : Self.breakDurationSeconds
    }

    // MARK: - Timer control

    func startTimer() {
        guard isPaused else { return }
        isPaused = false
        timerEndDate = Date().addingTimeInterval(TimeInterval(timeRemaining))
        soundService.play(.start)
        startTick()
    }

    func pauseTimer() {
        guard !isPaused else { return }
        timerCancellable?.cancel()
        timerCancellable = nil
        timerEndDate = nil
        isPaused = true
        soundService.play(.pause)
    }

    func resetTimer() {
        timerCancellable?.cancel()
        timerCancellable = nil
        timerEndDate = nil
        isPaused = true
        timeRemaining = currentDuration
        soundService.play(.reset)
    }

    func skipBreak() {
        guard mode == .break_ else { return }
        timerCancellable?.cancel()
        timerCancellable = nil
        timerEndDate = nil
        mode = .work
        timeRemaining = workDurationSeconds
        isPaused = false
        timerEndDate = Date().addingTimeInterval(TimeInterval(timeRemaining))
        soundService.play(.start)
        startTick()
    }

    private func startTick() {
        timerCancellable = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.tick()
            }
    }

    private func tick() {
        guard let endDate = timerEndDate else { return }
        let remaining = max(0, Int(endDate.timeIntervalSince(Date())))

        if remaining <= 0 {
            timerCancellable?.cancel()
            timerCancellable = nil
            timerEndDate = nil
            isPaused = true

            if mode == .work {
                historyService.incrementCompletedMinutes(historyService.getWorkDurationMinutes())
                soundService.play(.end)
                showConfetti = true
                showWorkCompleteModal = true
            } else {
                soundService.play(.end)
                showBreakCompleteModal = true
            }
        } else {
            timeRemaining = remaining
        }
    }

    func syncFromBackground() {
        if let endDate = timerEndDate, !isPaused {
            let remaining = max(0, Int(endDate.timeIntervalSince(Date())))
            if remaining <= 0 {
                tick()
            } else {
                timeRemaining = remaining
            }
        }
    }

    // MARK: - Work complete flow

    func onWorkCompleteStartBreak() {
        showWorkCompleteModal = false
        mode = .break_
        timeRemaining = Self.breakDurationSeconds
        isPaused = false
        timerEndDate = Date().addingTimeInterval(TimeInterval(timeRemaining))
        startTick()
    }

    func onWorkCompleteSkipBreak() {
        showWorkCompleteModal = false
        mode = .work
        timeRemaining = workDurationSeconds
        isPaused = false
        timerEndDate = Date().addingTimeInterval(TimeInterval(timeRemaining))
        soundService.play(.start)
        startTick()
    }

    // MARK: - Break complete flow

    func onBreakCompleteStartWork() {
        showBreakCompleteModal = false
        mode = .work
        timeRemaining = workDurationSeconds
        isPaused = false
        timerEndDate = Date().addingTimeInterval(TimeInterval(timeRemaining))
        soundService.play(.start)
        startTick()
    }

    // MARK: - Duration picker

    func selectDuration(_ minutes: Int) {
        historyService.setWorkDurationMinutes(minutes)
        timeRemaining = workDurationSeconds
        mode = .work
        timerEndDate = nil
        showDurationPicker = false
        soundService.play(.start)
    }

    func resetTimeStats() {
        historyService.resetHistory()
        soundService.play(.resetSessions)
    }

    // MARK: - Init

    func initialize() {
        historyService.migrateToHistory()
        if historyService.hasDurationSet() {
            timeRemaining = workDurationSeconds
        } else {
            showDurationPicker = true
        }
    }
}
