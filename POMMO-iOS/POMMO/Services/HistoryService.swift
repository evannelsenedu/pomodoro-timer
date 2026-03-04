import Foundation

/// Persists work history (date → minutes) and settings in UserDefaults.
/// Handles migration from legacy session-count format.
final class HistoryService {
    static let shared = HistoryService()

    private let historyKey = "pomodoroHistory"
    private let durationKey = "pomodoroWorkDurationMinutes"
    private let quoteKey = "pomodoroQuoteFor"
    private let legacyTotalKey = "pomodoroTotalSessions"

    static let workDurationOptions = [30, 45, 60, 75, 90]
    static let defaultWorkDuration = 60

    private var defaults: UserDefaults { .standard }

    // MARK: - Date key

    func dateKey(for date: Date = Date()) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter.string(from: date)
    }

    // MARK: - History

    func getHistory() -> [String: Int] {
        guard let data = defaults.data(forKey: historyKey),
              let decoded = try? JSONDecoder().decode([String: Int].self, from: data) else {
            return [:]
        }
        return decoded
    }

    func saveHistory(_ history: [String: Int]) {
        guard let data = try? JSONEncoder().encode(history) else { return }
        defaults.set(data, forKey: historyKey)
    }

    func migrateToHistory() {
        var history = getHistory()
        var changed = false

        for (key, val) in history {
            let n = val
            let migrated: Int
            if n > 0 && n <= 24 {
                migrated = n * 60
            } else {
                migrated = n
            }
            if migrated != n {
                history[key] = migrated
                changed = true
            }
        }

        if history.isEmpty {
            let oldTotal = defaults.integer(forKey: legacyTotalKey)
            if oldTotal > 0 {
                history[dateKey()] = oldTotal * 60
                changed = true
                defaults.removeObject(forKey: legacyTotalKey)
            }
        }

        if changed {
            saveHistory(history)
        }
    }

    func incrementCompletedMinutes(_ minutes: Int) {
        var history = getHistory()
        let today = dateKey()
        history[today] = (history[today] ?? 0) + minutes
        saveHistory(history)
    }

    func getTotalMinutes() -> Int {
        getHistory().values.reduce(0, +)
    }

    func getMinutesToday() -> Int {
        getHistory()[dateKey()] ?? 0
    }

    func getMinutesThisWeek() -> Int {
        let history = getHistory()
        var sum = 0
        for i in 0..<7 {
            let d = Calendar.current.date(byAdding: .day, value: -i, to: Date()) ?? Date()
            sum += history[dateKey(for: d)] ?? 0
        }
        return sum
    }

    func getMinutesThisYear() -> Int {
        let history = getHistory()
        let year = String(Calendar.current.component(.year, from: Date()))
        return history.filter { $0.key.hasPrefix(year) }.values.reduce(0, +)
    }

    func resetHistory() {
        saveHistory([:])
    }

    // MARK: - Work duration

    func getWorkDurationMinutes() -> Int {
        let stored = defaults.integer(forKey: durationKey)
        return Self.workDurationOptions.contains(stored) ? stored : Self.defaultWorkDuration
    }

    func setWorkDurationMinutes(_ minutes: Int) {
        defaults.set(minutes, forKey: durationKey)
    }

    func hasDurationSet() -> Bool {
        defaults.object(forKey: durationKey) != nil
    }

    // MARK: - Quote

    func getQuoteFor() -> String? {
        defaults.string(forKey: quoteKey)
    }

    func setQuoteFor(_ value: String?) {
        if let value = value, !value.isEmpty {
            defaults.set(value, forKey: quoteKey)
        } else {
            defaults.removeObject(forKey: quoteKey)
        }
    }
}
