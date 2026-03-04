import Foundation

enum TimeFormatting {
    /// Format seconds as MM:SS
    static func formatTime(seconds: Int) -> String {
        let mins = seconds / 60
        let secs = seconds % 60
        return String(format: "%02d:%02d", mins, secs)
    }

    /// Format total minutes as H:MM
    static func formatHoursMinutes(totalMinutes: Int) -> String {
        let hours = totalMinutes / 60
        let mins = totalMinutes % 60
        return String(format: "%d:%02d", hours, mins)
    }
}
